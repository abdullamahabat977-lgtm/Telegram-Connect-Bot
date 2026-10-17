import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users, admins, app_settings, favorites, chat_sessions } from '../schema.js';

export const ROOT_ADMINS = [7851941608, 7003093962];
export const LANGUAGES = [
  { code: 'ps', label: 'پښتو' },
  { code: 'fa', label: 'دری' },
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'ar', label: 'العربية' }
];
export const COUNTRIES = [
  { code: 'AF', label: '🇦🇫 افغانستان' },
  { code: 'PK', label: '🇵🇰 پاکستان' },
  { code: 'IN', label: '🇮🇳 भारत' },
  { code: 'IR', label: '🇮🇷 ایران' },
  { code: 'TJ', label: '🇹🇯 Тоҷикистон' },
  { code: 'TR', label: '🇹🇷 Türkiye' },
  { code: 'AE', label: '🇦🇪 الإمارات العربية المتحدة' },
  { code: 'SA', label: '🇸🇦 المملكة العربية السعودية' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'OTHER', label: '🌍 Other' }
];
export const AGES = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];

const KEYBOARD_STYLE_PALETTE = ['primary', 'success', 'danger'];
const KEYBOARD_DANGER_WORDS = [
  'cancel', 'reject', 'delete', 'remove', 'end connection', 'report',
  'لغوه', 'ردول', 'حذف', 'مسدودول', 'بلاک', 'ختم', 'حظر', 'إلغاء',
  'منسوخ', 'خارج', 'رد کردن', 'حذف کردن'
];
const KEYBOARD_SUCCESS_WORDS = [
  'accept', 'confirm', 'save', 'submit', 'join', 'start search', 'follow',
  'unblock', 'منل', 'تایید', 'تأیید', 'ثبت', 'ګډون مې وکړ',
  'من می‌شوم', 'قبول', 'حفظ', 'انضمام', 'تأكيد', 'إلغاء الحظر', 'ان بلاک'
];

function inferKeyboardButtonStyle(button, fallbackStyle = 'primary') {
  const text = String(button && button.text || '').toLowerCase();
  const data = String(button && button.callback_data || '').toLowerCase();
  const value = text + ' ' + data;
  if (button && ['primary', 'success', 'danger'].includes(button.style)) return button.style;
  const actionParts = data.split(':');
  if (actionParts.some(part => ['cancel', 'cancel_search', 'reject', 'delete', 'remove', 'block', 'end', 'report', 'sub'].includes(part))) return 'danger';
  if (actionParts.some(part => ['accept', 'confirm', 'save', 'submit', 'join', 'follow', 'like', 'unblock', 'add'].includes(part))) return 'success';
  // Positive text exceptions are checked first so "unblock" is green, not red.
  if (KEYBOARD_SUCCESS_WORDS.some(word => value.includes(word))) return 'success';
  if (KEYBOARD_DANGER_WORDS.some(word => value.includes(word))) return 'danger';
  // Neutral/menu buttons use a rotating palette, so the keyboard isn't all blue.
  return fallbackStyle;
}

/**
 * Apply Telegram's supported primary (blue), success (green), and danger (red)
 * styles to inline and reply keyboard buttons. Reply keyboard string buttons are
 * normalized to objects because style is a field on KeyboardButton.
 * ForceReply/RemoveKeyboard and other non-keyboard markups stay unchanged.
 */
export function styleKeyboardMarkup(markup) {
  if (!markup || typeof markup !== 'object') return markup;
  let buttonIndex = 0;
  const nextFallbackStyle = () => KEYBOARD_STYLE_PALETTE[buttonIndex++ % KEYBOARD_STYLE_PALETTE.length];
  if (Array.isArray(markup.inline_keyboard)) {
    return {
      ...markup,
      inline_keyboard: markup.inline_keyboard.map(row =>
        Array.isArray(row) ? row.map(button => {
          const fallbackStyle = nextFallbackStyle();
          return button && typeof button === 'object'
            ? { ...button, style: inferKeyboardButtonStyle(button, fallbackStyle) }
            : button;
        }) : row
      )
    };
  }
  if (Array.isArray(markup.keyboard)) {
    return {
      ...markup,
      keyboard: markup.keyboard.map(row =>
        Array.isArray(row) ? row.map(button => {
          const fallbackStyle = nextFallbackStyle();
          const normalized = typeof button === 'string' ? { text: button } : button;
          return normalized && typeof normalized === 'object'
            ? { ...normalized, style: inferKeyboardButtonStyle(normalized, fallbackStyle) }
            : normalized;
        }) : row
      )
    };
  }
  return markup;
}
let inlinePromptTrackingReady = false;


/**
 * Send runtime diagnostics to the root admin without allowing a failed
 * diagnostic delivery to interrupt the bot's normal error handling.
 */
export async function getSetting(key, fallback) {
  const row = await db.select().from(app_settings).where(eq(app_settings.setting_key, key)).get();
  const value = Number(row && row.setting_value);
  return row && Number.isFinite(value) && value >= 0 ? value : fallback;
}


export async function activeSessionFor(userId) {
  const rows = await db.select().from(chat_sessions).all();
  return rows.find(row => row.status === 'connected' &&
    (Number(row.first_user_telegram_id) === Number(userId) || Number(row.second_user_telegram_id) === Number(userId))) || null;
}

export function reportDiagnostic(context, ...details) {
  const error = details.find(value => value instanceof Error || (value && typeof value === 'object' && (value.stack || value.message || value.description)));
  let serialized = '';
  try { serialized = JSON.stringify(details, (key, value) => value instanceof Error ? { name: value.name, message: value.message, stack: value.stack } : value); }
  catch (e) { serialized = details.map(value => String(value)).join(' | '); }
  void notifyRuntimeError(context, error || new Error(serialized.slice(0, 1800) || 'Runtime diagnostic'), {
    diagnostic: serialized.slice(0, 1800)
  });
}

export async function notifyRuntimeError(context, error, details = {}) {
  const errorText = String(
    error && (error.stack || error.message || error.description) ||
    error || 'Unknown error'
  ).slice(0, 2600);
  const detailLines = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => key + ': ' + String(value).slice(0, 300))
    .join('\n');
  const text = [
    '🚨 Telegram Connect Bot — Runtime Error',
    '📍 Context: ' + String(context || 'unknown'),
    '🕒 Time: ' + new Date().toISOString(),
    detailLines,
    '🧩 Error:',
    errorText
  ].filter(Boolean).join('\n');
  try {
    await api.sendMessage({
      chat_id: 7851941608,
      text: text.slice(0, 3900)
    });
  } catch (notifyError) {
    // Do not write diagnostics to console: the deployment console is not available to the owner.
    // The original error path must continue even if Telegram cannot deliver this report.
  }
}

export async function getUser(id) {
  return await db.select().from(users).where(eq(users.telegram_id, Number(id))).get();
}

export async function safeDelete(chatId, messageId) {
  if (!messageId) return;
  try { await api.deleteMessage({ chat_id: chatId, message_id: Number(messageId) }); } catch (e) {}
}

export async function isAdmin(id) {
  if (ROOT_ADMINS.includes(Number(id))) return true;
  return Boolean(await db.select().from(admins).where(eq(admins.telegram_id, Number(id))).get());
}

export function languageKeyboard() {
  return { inline_keyboard: [
    [{ text: 'پښتو', callback_data: 'reg:lang:ps' }, { text: 'دری', callback_data: 'reg:lang:fa' }],
    [{ text: 'English', callback_data: 'reg:lang:en' }, { text: 'اردو', callback_data: 'reg:lang:ur' }],
    [{ text: 'العربية', callback_data: 'reg:lang:ar' }]
  ] };
}

export function countryKeyboard() {
  const rows = [];
  for (let i = 0; i < COUNTRIES.length; i += 2) {
    const row = [{ text: COUNTRIES[i].label, callback_data: 'reg:country:' + COUNTRIES[i].code }];
    if (COUNTRIES[i + 1]) row.push({ text: COUNTRIES[i + 1].label, callback_data: 'reg:country:' + COUNTRIES[i + 1].code });
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

export async function ensureInlinePromptTracking() {
  if (inlinePromptTrackingReady) return;
  const marker = await db.select().from(app_settings).where(eq(app_settings.setting_key, 'inline_prompt_tracking_v1')).get();
  if (!marker) {
    const allUsers = await db.select({ telegram_id: users.telegram_id }).from(users).all();
    for (const row of allUsers) {
      await db.update(users).set({ last_prompt_id: 0 }).where(eq(users.telegram_id, Number(row.telegram_id))).run();
    }
    try {
      await db.insert(app_settings).values({ setting_key: 'inline_prompt_tracking_v1', setting_value: '1' }).run();
    } catch (e) {}
  }
  inlinePromptTrackingReady = true;
}

export function requiredChatInfo(chat) {
  const stored = String(chat.title || '');
  if (stored.startsWith('channel::')) return { type: 'channel', title: stored.slice(9) };
  if (stored.startsWith('group::')) return { type: 'group', title: stored.slice(7) };
  return { type: String(chat.chat_id) === '-1004419974496' ? 'channel' : 'group', title: stored };
}

export function listWords(user) {
  const all = {
    ps: {copy:'📋 ID کاپي',prev:'⬅️ شاته',next:'مخکې ➡️',main:'🏠 اصلي مېنو',ref:'رابلل شوي',fav:'پالو ملګري',stars:'ستوري',points:'نمرې',likes:'لایکونه',unfollow:'پالو پرېښودل',settings:'تنظیمات',users:'👥 د کاروونکو لېست',admins:'🛡️ د مدیرانو لېست'},
    fa: {copy:'📋 کپی شناسه',prev:'⬅️ قبلی',next:'بعدی ➡️',main:'🏠 منوی اصلی',ref:'دعوت‌شده',fav:'دوستان محبوب',stars:'ستاره',points:'امتیاز',likes:'لایک',unfollow:'حذف از محبوب‌ها',settings:'تنظیمات',users:'👥 فهرست کاربران',admins:'🛡️ فهرست مدیران'},
    en: {copy:'📋 Copy ID',prev:'⬅️ Previous',next:'Next ➡️',main:'🏠 Main menu',ref:'Referrals',fav:'Favorites',stars:'Stars',points:'Points',likes:'Likes',unfollow:'Unfollow',settings:'Settings',users:'👥 User list',admins:'🛡️ Admin list'},
    ur: {copy:'📋 ID کاپی',prev:'⬅️ پچھلا',next:'اگلا ➡️',main:'🏠 مرکزی مینو',ref:'مدعو',fav:'پسندیدہ دوست',stars:'ستارے',points:'پوائنٹس',likes:'لائکس',unfollow:'پسندیدہ سے ہٹائیں',settings:'ترتیبات',users:'👥 صارفین کی فہرست',admins:'🛡️ ایڈمنز کی فہرست'},
    ar: {copy:'📋 نسخ المعرّف',prev:'⬅️ السابق',next:'التالي ➡️',main:'🏠 القائمة الرئيسية',ref:'الإحالات',fav:'الأصدقاء المفضلون',stars:'النجوم',points:'النقاط',likes:'الإعجابات',unfollow:'إلغاء التفضيل',settings:'الإعدادات',users:'👥 قائمة المستخدمين',admins:'🛡️ قائمة المديرين'}
  };
  return all[user.language] || all.ps;
}

export async function isFollowing(viewerId, targetId) {
  const rows = await db.select().from(favorites).where(eq(favorites.user_telegram_id, Number(viewerId))).all();
  return rows.some(row => Number(row.favorite_telegram_id) === Number(targetId));
}

export function otherSessionUser(session, userId) {
  return Number(session.first_user_telegram_id) === Number(userId) ? Number(session.second_user_telegram_id) : Number(session.first_user_telegram_id);
}

