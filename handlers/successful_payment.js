import { api, db } from 'sdk';
import { eq, sql } from 'sdk/db';
import { users, wallets, wallet_transactions, star_payments } from 'schema';

const ALLOWED_STAR_AMOUNTS = [100, 250, 500, 1000];

async function sendMessage(chatId, text) {
  await api.sendMessage({
    chat_id: chatId,
    text: text,
  });
}

export default async function (message) {
  if (!message || !message.successful_payment || !message.from || !message.chat) return;
  if (message.chat.type !== 'private') return;

  const payment = message.successful_payment;
  const payload = String(payment.invoice_payload || '');
  const match = /^wallet:(\\d+):(100|250|500|1000):([A-Za-z0-9_-]{6,40})$/.exec(payload);

  if (!match) {
    await sendMessage(message.chat.id, '⚠️ د تادیې معلومات سم نه دي. له مدیر سره اړیکه ونیسه.');
    return;
  }

  const userId = Number(match[1]);
  const amount = Number(match[2]);
  const totalAmount = Number(payment.total_amount);
  const chargeId = String(payment.telegram_payment_charge_id || '');

  if (!Number.isSafeInteger(userId) || userId <= 0 ||
      !ALLOWED_STAR_AMOUNTS.includes(amount) ||
      payment.currency !== 'XTR' ||
      totalAmount !== amount ||
      !chargeId) {
    await sendMessage(message.chat.id, '⚠️ د تادیې اندازه یا رسید سم نه دی. له مدیر سره اړیکه ونیسه.');
    return;
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).get();

  if (!user || Number(user.telegram_id) !== Number(message.from.id)) {
    await sendMessage(message.chat.id, '⚠️ دا تادیه له دې حساب سره سمون نه خوري. له مدیر سره اړیکه ونیسه.');
    return;
  }

  try {
    await db.insert(star_payments).values({
      user_id: user.id,
      telegram_payment_charge_id: chargeId,
      provider_payment_charge_id: payment.provider_payment_charge_id || null,
      invoice_payload: payload,
      currency: payment.currency,
      total_amount: totalAmount,
      status: 'successful',
      created_at: new Date().toISOString(),
    }).run();
  } catch (error) {
    await sendMessage(message.chat.id, 'ℹ️ دا تادیه مخکې ثبت شوې ده؛ ستا والټ بیا نه چارج کېږي.');
    return;
  }

  const now = new Date().toISOString();

  await db.insert(wallets).values({
    user_id: user.id,
    available_stars: 0,
    pending_stars: 0,
    updated_at: now,
  }).onConflictDoUpdate({
    target: wallets.user_id,
    set: { updated_at: now },
  }).run();

  await db.update(wallets)
    .set({
      available_stars: sql`${wallets.available_stars} + ${amount}`,
      updated_at: now,
    })
    .where(eq(wallets.user_id, user.id))
    .run();

  await db.insert(wallet_transactions).values({
    user_id: user.id,
    promotion_id: null,
    transaction_type: 'topup',
    bucket: 'available',
    amount_stars: amount,
    idempotency_key: 'topup:' + chargeId,
    note: 'Telegram Stars payment',
    created_at: now,
  }).run();

  const wallet = await db.select().from(wallets).where(eq(wallets.user_id, user.id)).get();

  await sendMessage(
    message.chat.id,
    '✅ تادیه بریالۍ شوه!\n➕ ورزیات شول: ' + amount + ' ⭐\n💰 موجود بیلانس: ' +
      (wallet ? wallet.available_stars : amount) + ' ⭐'
  );
}
