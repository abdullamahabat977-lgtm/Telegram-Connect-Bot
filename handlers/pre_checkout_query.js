import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users } from 'schema';

export default async function (query) {
  if (!query?.id || !query?.from?.id) return;

  const payload = String(query.invoice_payload ?? '');
  const match = /^wallet:(\d+):(100|250|500|1000):([A-Za-z0-9_-]{6,40})$/.exec(payload);
  if (!match || query.currency !== 'XTR' || Number(query.total_amount) !== Number(match[2])) {
    await api.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: 'د تادیې معلومات سم نه دي. بېرته لاړ شه او نوی رسید جوړ کړه.',
    });
    return;
  }

  const user = await db.select().from(users).where(eq(users.id, Number(match[1]))).get();
  if (!user || Number(user.telegram_id) !== Number(query.from.id)) {
    await api.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: 'دا تادیه د دې حساب لپاره نه ده. له خپل بوټ حساب څخه نوی رسید جوړ کړه.',
    });
    return;
  }

  await api.answerPreCheckoutQuery({ pre_checkout_query_id: query.id, ok: true });
}
