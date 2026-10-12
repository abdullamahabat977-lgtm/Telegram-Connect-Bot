import { api } from 'sdk';
import { eq } from 'sdk/db';
import { required_chats } from '../schema.js';
import { LANGUAGES, languageKeyboard, countryKeyboard, requiredChatInfo } from '../lib/shared.js';
import { tx, genderKeyboard, ageKeyboard } from './message-ui.js';
import { sendPrompt } from './message-core.js';

// ── Registration and required-chat membership ──

export async function getRequiredChats() { return await db.select().from(required_chats).where(eq(required_chats.is_active, 1)).all(); }
export function requiredChatButtonTitle(chat, user) {
  const info = requiredChatInfo(chat);
  const labels = { ps: ['چینل ته ګډون', 'ګروپ ته ګډون'], fa: ['عضویت در کانال', 'عضویت در گروه'], en: ['Join channel', 'Join group'], ur: ['چینل میں شامل ہوں', 'گروپ میں شامل ہوں'], ar: ['الانضمام إلى القناة', 'الانضمام إلى المجموعة'] };
  const pair = labels[user.language] || labels.ps;
  return (info.type === 'channel' ? pair[0] : pair[1]) + (info.title ? ': ' + info.title : '');
}
export function channelError(user, kind) {
  const messages = {
    ps: { invalid: '⚠️ ID ناسم دی یا بوټ لاسرسی نه لري.', member: '⚠️ بوټ په دې ګروپ/چینل کې غړی نه دی.', admin: '⚠️ بوټ باید په ګروپ/چینل کې مدیر وي.', link: '⚠️ د ګډون لینک پیدا یا جوړ نه شو.' },
    fa: { invalid: '⚠️ شناسه نادرست است یا ربات دسترسی ندارد.', member: '⚠️ ربات عضو این گروه/کانال نیست.', admin: '⚠️ ربات باید مدیر باشد.', link: '⚠️ لینک عضویت پیدا یا ساخته نشد.' },
    en: { invalid: '⚠️ Invalid ID or the bot cannot access this chat.', member: '⚠️ The bot is not a member of this group/channel.', admin: '⚠️ The bot must be an administrator.', link: '⚠️ Could not find or create a join link.' },
    ur: { invalid: '⚠️ ID غلط ہے یا بوٹ کو رسائی نہیں۔', member: '⚠️ بوٹ اس گروپ/چینل کا رکن نہیں۔', admin: '⚠️ بوٹ کو ایڈمن ہونا چاہیے۔', link: '⚠️ شمولیت کا لنک نہیں ملا۔' },
    ar: { invalid: '⚠️ المعرّف غير صحيح أو لا يوجد وصول.', member: '⚠️ البوت ليس عضوًا في المجموعة/القناة.', admin: '⚠️ يجب أن يكون البوت مشرفًا.', link: '⚠️ تعذّر العثور على رابط الانضمام.' }
  };
  return (messages[user.language] || messages.ps)[kind];
}
export async function showMembership(chatId, user) {
  const t = tx(user), chats = await getRequiredChats(), rows = [];
  for (const chat of chats) if (chat.invite_link) rows.push([{ text: requiredChatButtonTitle(chat, user).slice(0, 60), url: chat.invite_link }]);
  rows.push([{ text: t.joined, callback_data: 'reg:membership:check' }]);
  await sendPrompt(chatId, t.membership, { inline_keyboard: rows }, user);
}
export async function checkMembership(id) {
  const chats = await getRequiredChats();
  for (const chat of chats) {
    try {
      const member = await api.getChatMember({ chat_id: chat.chat_id, user_id: Number(id) });
      const status = member && member.status;
      if (!(status === 'creator' || status === 'administrator' || status === 'member' ||
        (status === 'restricted' && member.is_member === true))) return false;
    } catch (e) { return false; }
  }
  return true;
}
export function matchLanguage(input) {
  const cleanInput = String(input || '').normalize('NFC').trim().toLowerCase();
  const aliases = {
    ps: ['پښتو', 'pashto', 'ps'],
    fa: ['دری', 'دري', 'dari', 'fa', 'persian'],
    en: ['english', 'en'],
    ur: ['اردو', 'urdu', 'ur'],
    ar: ['العربية', 'عربي', 'arabic', 'ar']
  };
  return LANGUAGES.find(function (item) {
    return [item.label].concat(aliases[item.code] || []).some(function (name) {
      return String(name).normalize('NFC').trim().toLowerCase() === cleanInput;
    });
  }) || null;
}
export async function showLanguage(chatId, user) { await sendPrompt(chatId, tx(user).lang, languageKeyboard(), user); }
export async function showCountry(chatId, user) { await sendPrompt(chatId, tx(user).country, countryKeyboard(), user); }
export async function showGender(chatId, user) { await sendPrompt(chatId, tx(user).gender, genderKeyboard(user), user); }
export async function showAge(chatId, user) { await sendPrompt(chatId, tx(user).age, ageKeyboard(), user); }
export async function showName(chatId, user) { await sendPrompt(chatId, tx(user).name, { force_reply: true }, user); }
export async function showSurname(chatId, user) {
  await sendPrompt(chatId, tx(user).surname, { inline_keyboard: [[{ text: tx(user).skip, callback_data: 'reg:skip_surname' }]] }, user);
}
