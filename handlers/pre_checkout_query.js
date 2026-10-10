import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users } from 'schema';

const ALLOWED_STAR_AMOUNTS = [100, 250, 500, 1000];

async function rejectPayment(queryId, message) {
  await api.answerPreCheckoutQuery({
    pre_checkout_query_id: queryId,
    ok: false,
    error_message: message,
  });
}

export default async function (query) {
  if (!query || !query.id || !query.from || !query.from.id) return;

  const payload = String(query.invoice_payload || '');
  const match = /^wallet:(\d+):(100|250|500|1000):([A-Za-z0-9_-]{6,40})$/.exec(payload);

  if (!match) {
    await rejectPayment(query.id, 'د تادیې معلومات سم نه دي. بېرته لاړ شه او نوی رسید جوړ کړه.');
    return;
  }

  const userId = Number(match[1]);
  const expectedAmount = Number(match[2]);
  const totalAmount = Number(query.total_amount);

  if (!Number.isSafeInteger(userId) || userId <= 0 ||
      !ALLOWED_STAR_AMOUNTS.includes(expectedAmount) ||
      query.currency !== 'XTR' || totalAmount !== expectedAmount) {
    await rejectPayment(query.id, 'د تادیې اندازه یا اسعار سم نه دي. نوی رسید جوړ کړه.');
    return;
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).get();

  if (!user || Number(user.telegram_id) !== Number(query.from.id)) {
    await rejectPayment(query.id, 'دا تادیه د دې حساب لپاره نه ده. له خپل بوټ حساب څخه نوی رسید جوړ کړه.');
    return;
  }

  await api.answerPreCheckoutQuery({
    pre_checkout_query_id: query.id,
    ok: true,
  });
}
