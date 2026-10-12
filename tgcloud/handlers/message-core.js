import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users, admins, required_chats, app_settings } from '../schema.js';
import { ROOT_ADMINS, ensureInlinePromptTracking, safeDelete } from '../lib/shared.js';

// ── Prompt delivery and settings ──
export async function sendPrompt(chatId, text, markup, user, parseMode) {
  await ensureInlinePromptTracking();
  if (user) {
    const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users)
      .where(eq(users.telegram_id, Number(user.telegram_id))).get();
    user.last_prompt_id = Number(latest && latest.last_prompt_id || 0);
  }
  if (user && Number(user.last_prompt_id) > 0) {
    await safeDelete(chatId, Number(user.last_prompt_id));
  }
  const sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: markup, ...(parseMode ? { parse_mode: parseMode } : {}) });
  if (user) {
    const inlineId = markup && Array.isArray(markup.inline_keyboard) && sent && sent.message_id ? sent.message_id : 0;
    await db.update(users).set({ last_prompt_id: inlineId }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = inlineId;
  }
  return sent;
}
export async function getSetting(key, fallback) {
  const row = await db.select().from(app_settings).where(eq(app_settings.setting_key, key)).get();
  const value = Number(row && row.setting_value);
  return row && Number.isFinite(value) && value >= 0 ? value : fallback;
}
export async function setSetting(key, value) {
  const old = await db.select().from(app_settings).where(eq(app_settings.setting_key, key)).get();
  if (old) await db.update(app_settings).set({ setting_value: String(value) }).where(eq(app_settings.setting_key, key)).run();
  else await db.insert(app_settings).values({ setting_key: key, setting_value: String(value) }).run();
}
export async function ensureDefaults() {
  const seed = await db.select().from(app_settings).where(eq(app_settings.setting_key, 'initial_required_chat_seeded')).get();
  if (!seed) {
    const old = await db.select().from(required_chats).where(eq(required_chats.chat_id, '-1004419974496')).get();
    if (!old) await db.insert(required_chats).values({
      chat_id: '-1004419974496', invite_link: 'https://t.me/AskTechPs', title: 'AskTechPs',
      is_active: 1, created_at: new Date().toISOString()
    }).run();
    await db.insert(app_settings).values({ setting_key: 'initial_required_chat_seeded', setting_value: '1' }).run();
  }
  for (const id of ROOT_ADMINS) {
    const row = await db.select().from(admins).where(eq(admins.telegram_id, id)).get();
    if (!row) await db.insert(admins).values({ telegram_id: id, created_at: new Date().toISOString() }).run();
  }
}
