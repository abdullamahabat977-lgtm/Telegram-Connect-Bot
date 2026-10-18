import { api, db } from 'sdk';
import { and, eq } from 'sdk/db';
import { users, admins, required_chats, favorites, chat_sessions, connection_requests, chat_messages, user_ratings, user_likes, game_sessions, user_blocks } from '../schema.js';
import { activeSessionFor, LANGUAGES, COUNTRIES, AGES, countryKeyboard, ensureInlinePromptTracking, requiredChatInfo, listWords, isFollowing, otherSessionUser, getUser, safeDelete, isAdmin, styleKeyboardMarkup, notifyRuntimeError, reportDiagnostic, getSetting as sharedGetSetting } from '../lib/shared.js';
import { TEXT } from '../lib/callback-text.js';
import { T as MESSAGE_TEXT } from '../lib/message-text.js';
import { tryMatchGames } from './message.js';





async function getSetting(key, fallback) {
  return sharedGetSetting(key, fallback);
}

const ADMIN_UI = {
  ps: {
    buttons: ['👥 د مدیرانو تنظیمات','📢 د غړیتوب ګروپونه','📣 ډله‌ییز اعلان','⚙️ د کارن تنظیمات','👥 د کاروونکو لېست','🔙 اصلي مېنو','🎁 د جایزو تنظیمات','🔗 د اړیکو تنظیمات','🎲 د ګېم تنظیمات'],
    management: ['➕ مدیر زیاتول','➖ مدیر لرې کول','📋 د مدیرانو لېست','🔙 اډمین پینل'],
    intro: '🛡️ د اډمین پینل:', managementIntro: '👥 د مدیرانو اداره:', noAccess: '⛔ دا برخه یوازې د مجاز مدیرانو لپاره ده.', userMissing: 'دا کارن له بوټ سره نه دی یوځای شوی.'
  },
  fa: {
    buttons: ['👥 مدیریت مدیران','📢 عضویت اجباری','📣 پیام همگانی','⚙️ تنظیمات کاربر','👥 فهرست کاربران','🔙 منوی اصلی','🎁 تنظیمات جوایز','🔗 تنظیمات ارتباطات','🎲 تنظیمات بازی'],
    management: ['➕ افزودن مدیر','➖ حذف مدیر','📋 فهرست مدیران','🔙 پنل مدیریت'],
    intro: '🛡️ پنل مدیریت:', managementIntro: '👥 مدیریت مدیران:', noAccess: '⛔ این بخش فقط برای مدیران مجاز است.', userMissing: 'این کاربر هنوز ربات را شروع نکرده است.'
  },
  en: {
    buttons: ['👥 Admin management','📢 Required membership','📣 Broadcast','⚙️ User settings','👥 User list','🔙 Main menu','🎁 Reward settings','🔗 Connection settings','🎲 Game settings'],
    management: ['➕ Add admin','➖ Remove admin','📋 Admin list','🔙 Admin panel'],
    intro: '🛡️ Admin panel:', managementIntro: '👥 Admin management:', noAccess: '⛔ This section is for authorized admins only.', userMissing: 'This user has not started the bot.'
  },
  ur: {
    buttons: ['👥 ایڈمن مینجمنٹ','📢 لازمی رکنیت','📣 سب کو پیغام','⚙️ صارف کی ترتیبات','👥 صارفین کی فہرست','🔙 مرکزی مینو','🎁 انعامات کی ترتیبات','🔗 رابطے کی ترتیبات','🎲 گیم کی ترتیبات'],
    management: ['➕ ایڈمن شامل کریں','➖ ایڈمن ہٹائیں','📋 ایڈمن فہرست','🔙 ایڈمن پینل'],
    intro: '🛡️ ایڈمن پینل:', managementIntro: '👥 ایڈمن مینجمنٹ:', noAccess: '⛔ یہ حصہ صرف مجاز ایڈمنز کے لیے ہے۔', userMissing: 'اس صارف نے ابھی بوٹ شروع نہیں کیا۔'
  },
  ar: {
    buttons: ['👥 إدارة المديرين','📢 العضوية الإلزامية','📣 رسالة جماعية','⚙️ إعدادات المستخدم','👥 قائمة المستخدمين','🔙 القائمة الرئيسية','🎁 إعدادات المكافآت','🔗 إعدادات الاتصال','🎲 إعدادات اللعبة'],
    management: ['➕ إضافة مدير','➖ إزالة مدير','📋 قائمة المديرين','🔙 لوحة الإدارة'],
    intro: '🛡️ لوحة الإدارة:', managementIntro: '👥 إدارة المديرين:', noAccess: '⛔ هذا القسم للمديرين المصرح لهم فقط.', userMissing: 'هذا المستخدم لم يبدأ البوت بعد.'
  }
};

function tx(user) {
  return TEXT[user && TEXT[user.language] ? user.language : 'ps'];
}
function mt(user) {
  return MESSAGE_TEXT[user && MESSAGE_TEXT[user.language] ? user.language : 'ps'];
}
async function sendPrompt(chatId, text, markup, user, parseMode) {
  await ensureInlinePromptTracking();
  if (user) {
    const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users)
      .where(eq(users.telegram_id, Number(user.telegram_id))).get();
    user.last_prompt_id = Number(latest && latest.last_prompt_id || 0);
  }
  if (user && Number(user.last_prompt_id) > 0) await safeDelete(chatId, user.last_prompt_id);
  let sent;
  try {
    sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: styleKeyboardMarkup(markup), ...(parseMode ? { parse_mode: parseMode } : {}) });
  } catch (styledError) {
    const description = String(styledError && (styledError.description || styledError.message || styledError.stack) || styledError || '');
    const hasKeyboard = markup && (Array.isArray(markup.inline_keyboard) || Array.isArray(markup.keyboard));
    if (!hasKeyboard || !/style|keyboard|button|markup|parse/i.test(description)) throw styledError;
    console.warn('Styled keyboard rejected; retrying prompt with standard Telegram keyboard', {
      chatId: Number(chatId), error: description
    });
    sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: markup, ...(parseMode ? { parse_mode: parseMode } : {}) });
  }
  if (user) {
    const inlineId = markup && Array.isArray(markup.inline_keyboard) && sent && sent.message_id ? sent.message_id : 0;
    await db.update(users).set({ last_prompt_id: inlineId }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = inlineId;
  }
  return sent;
}
function genderKeyboard(user) {
  const labels = {
    ps: ['نارینه', 'ښځینه'], fa: ['مرد', 'زن'], en: ['Male', 'Female'],
    ur: ['مرد', 'عورت'], ar: ['ذكر', 'أنثى']
  };
  const pair = labels[user.language] || labels.ps;
  return { inline_keyboard: [[
    { text: pair[0], callback_data: 'reg:gender:male' },
    { text: pair[1], callback_data: 'reg:gender:female' }
  ]] };
}
function ageKeyboard() {
  const rows = [];
  for (let i = 0; i < AGES.length; i += 3) {
    rows.push(AGES.slice(i, i + 3).map(age => ({ text: String(age), callback_data: 'reg:age:' + String(age) })));
  }
  return { inline_keyboard: rows };
}
async function showMembership(chatId, user, prefix) {
  const t = tx(user), chats = await db.select().from(required_chats).where(eq(required_chats.is_active, 1)).all(), rows = [];
  const labels = { ps: ['چینل ته ګډون', 'ګروپ ته ګډون'], fa: ['عضویت در کانال', 'عضویت در گروه'], en: ['Join channel', 'Join group'], ur: ['چینل میں شامل ہوں', 'گروپ میں شامل ہوں'], ar: ['الانضمام إلى القناة', 'الانضمام إلى المجموعة'] };
  const pair = labels[user.language] || labels.ps;
  for (const chat of chats) {
    const info = requiredChatInfo(chat);
    if (chat.invite_link) rows.push([{ text: ((info.type === 'channel' ? pair[0] : pair[1]) + (info.title ? ': ' + info.title : '')).slice(0, 60), url: chat.invite_link }]);
  }
  rows.push([{ text: t.joined, callback_data: 'reg:membership:check' }]);
  await sendPrompt(chatId, (prefix ? prefix + '\n\n' : '') + t.membership, { inline_keyboard: rows }, user);
}
async function checkMembership(id) {
  const chats = await db.select().from(required_chats).where(eq(required_chats.is_active, 1)).all();
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

function replyKeyboard(rows, extra) {
  return { keyboard: rows, resize_keyboard: true, ...(extra || {}) };
}
function mainKeyboard(user, admin) {
  const m = tx(user).menu;
  const rows = [
    [{ text: m[0] }, { text: m[4] }],
    [{ text: m[2] }, { text: m[3] }],
    [{ text: m[6] }, { text: m[5] }],
    [{ text: m[9] }, { text: m[7] }],
    [{ text: m[10] }]
  ];
  if (admin) rows.push([{ text: m[8] }]);
  return replyKeyboard(rows);
}
function adminKeyboard(user) {
  const b = (ADMIN_UI[user.language] || ADMIN_UI.ps).buttons;
  return replyKeyboard([[{ text: b[0] }], [{ text: b[1] }, { text: b[2] }], [{ text: b[3] }, { text: b[4] }], ...(b[6] ? [[{ text: b[6] }]] : []), ...(b[7] ? [[{ text: b[7] }, { text: b[8] }]] : []), [{ text: b[5] }]]);
}
function adminManagementKeyboard(user) {
  const b = (ADMIN_UI[user.language] || ADMIN_UI.ps).management;
  return replyKeyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }], [{ text: b[3] }]]);
}
function adminSettingsKeyboard(user, targetId, blocked) {
  const en = user.language === 'en', fa = user.language === 'fa', ur = user.language === 'ur', ar = user.language === 'ar';
  const b = en ? ['🖼 Change photo','⭐ Stars','🏆 Points','❤️ Likes','⛔ Block','✅ Unblock','📨 Send message','🔙 Admin panel'] :
    fa ? ['🖼 تغییر عکس','⭐ ستاره','🏆 امتیاز','❤️ لایک','⛔ مسدود','✅ رفع مسدودی','📨 ارسال پیام','🔙 پنل مدیریت'] :
    ur ? ['🖼 تصویر بدلیں','⭐ ستارے','🏆 پوائنٹس','❤️ لائکس','⛔ بلاک','✅ ان بلاک','📨 پیغام بھیجیں','🔙 ایڈمن پینل'] :
    ar ? ['🖼 تغيير الصورة','⭐ النجوم','🏆 النقاط','❤️ الإعجابات','⛔ حظر','✅ إلغاء الحظر','📨 إرسال رسالة','🔙 لوحة الإدارة'] :
    ['🖼 عکس بدلول','⭐ ستوري','🏆 نمرې','❤️ لایکونه','⛔ مسدودول','✅ خلاصول','📨 پیغام لېږل','🔙 اډمین پینل'];
  return { inline_keyboard: [
    [{ text: b[0], callback_data: 'admin:photo:' + targetId }],
    [{ text: b[1] + ' +', callback_data: 'admin:balance:stars:add:' + targetId }, { text: b[1] + ' −', callback_data: 'admin:balance:stars:sub:' + targetId }],
    [{ text: b[2] + ' +', callback_data: 'admin:balance:points:add:' + targetId }, { text: b[2] + ' −', callback_data: 'admin:balance:points:sub:' + targetId }],
    [{ text: b[3] + ' +', callback_data: 'admin:balance:likes:add:' + targetId }, { text: b[3] + ' −', callback_data: 'admin:balance:likes:sub:' + targetId }],
    [{ text: Number(blocked) === 1 ? b[5] : b[4], callback_data: 'admin:' + (Number(blocked) === 1 ? 'unblock:' : 'block:') + targetId }],
    [{ text: b[6], callback_data: 'admin:send:' + targetId }],
    [{ text: b[7], callback_data: 'admin:panel' }]
  ] };
}
async function showAdminUserSettings(chatId, actor, target) {
  const country = COUNTRIES.find(item => item.code === target.country), w = listWords(actor);
  const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(target.telegram_id)));
  const title = actor.language === 'en' ? '👤 USER SETTINGS' : actor.language === 'fa' ? '👤 تنظیمات کاربر' : actor.language === 'ur' ? '👤 صارف کی ترتیبات' : actor.language === 'ar' ? '👤 إعدادات المستخدم' : '👤 د کارن تنظیمات';
  const text = title + '\n━━━━━━━━━━━━━━\n👤 ' + [target.name || target.first_name || '—', target.surname || ''].filter(Boolean).join(' ') +
    '\n🆔 ' + target.telegram_id + '\n🔗 ' + (target.username ? '@' + target.username : '—') +
    '\n🌍 ' + (country ? country.label : '—') + '\n⚧ ' + (target.gender || '—') + '  🎂 ' + (target.age || '—') +
    '\n📢 ' + (target.channel_username || '—') + '\n📨 ' + w.ref + ': ' + Number(target.referral_count || 0) +
    '\n👥 ' + w.fav + ': ' + favCount + '\n⭐ ' + w.stars + ': ' + Number(target.stars || 0) +
    '\n🏆 ' + w.points + ': ' + Number(target.points || 0) + '\n❤️ ' + w.likes + ': ' + Number(target.likes || 0) +
    '\n🖼 ' + (actor.language === 'en' ? 'Photo' : actor.language === 'fa' ? 'عکس' : actor.language === 'ur' ? 'تصویر' : actor.language === 'ar' ? 'الصورة' : 'عکس') + ': ' + (target.profile_photo_id ? '✓' : '—') +
    '\n🚦 ' + (actor.language === 'en' ? 'Status' : actor.language === 'fa' ? 'وضعیت' : actor.language === 'ur' ? 'حالت' : actor.language === 'ar' ? 'الحالة' : 'حالت') + ': ' + (Number(target.is_blocked) === 1 ? (actor.language === 'en' ? 'Blocked' : 'مسدود') : (actor.language === 'en' ? 'Active' : 'فعال'));
  await sendPrompt(chatId, text, adminSettingsKeyboard(actor, target.telegram_id, target.is_blocked), actor);
}
async function showAdminListPage(chatId, actor, page) {
  const all = await db.select().from(admins).all(), w = listWords(actor);
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = w.admins + '\n' + (current + 1) + '/' + pages + '\n\n';
  if (!all.length) text += actor.language === 'en' ? 'No admins.' : 'د مدیرانو لېست تش دی.';
  for (const row of items) {
    const profile = await getUser(row.telegram_id);
    const name = profile ? [profile.name || profile.first_name || 'Admin', profile.surname || ''].filter(Boolean).join(' ') : 'Admin';
    text += '👤 نوم: ' + name + '\n\n🆔 Telegram ID: ' + row.telegram_id + '\n\n🔗 Username: ' + (profile && profile.username ? '@' + profile.username : '—') + '\n\n━━━━━━━━━━━━━━\n\n';
    rows.push([{ text: w.copy + ' ' + row.telegram_id, copy_text: { text: String(row.telegram_id) } }]);
  }
  const nav = [];
  if (current > 0) nav.push({ text: w.prev, callback_data: 'admin:admins:page:' + (current - 1) });
  if (current < pages - 1) nav.push({ text: w.next, callback_data: 'admin:admins:page:' + (current + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: w.main, callback_data: 'admin:main' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, actor);
}
async function showUserListPage(chatId, actor, page) {
  const all = await db.select().from(users).all(), w = listWords(actor);
  all.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = w.users + '\n' + (current + 1) + '/' + pages + '\n━━━━━━━━━━━━━━\n\n';
  if (!all.length) text += actor.language === 'en' ? 'No users yet.' : 'تر اوسه هېڅ کارن نشته.';
  for (const item of items) {
    const name = [item.name || item.first_name || 'User', item.surname || ''].filter(Boolean).join(' ');
    const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(item.telegram_id)));
    text += '👤 نوم: ' + name + '\n\n🆔 Telegram ID: ' + item.telegram_id + '\n\n🔗 Username: ' + (item.username ? '@' + item.username : '—') +
      '\n\n📨 ' + w.ref + ': ' + Number(item.referral_count || 0) + '\n\n👥 ' + w.fav + ': ' + favCount +
      '\n\n⭐ ' + w.stars + ': ' + Number(item.stars || 0) + '\n\n🏆 ' + w.points + ': ' + Number(item.points || 0) + '\n\n❤️ ' + w.likes + ': ' + Number(item.likes || 0) + '\n\n━━━━━━━━━━━━━━\n\n';
    rows.push([{ text: '⚙️ ' + name.slice(0, 28), callback_data: 'admin:open_user:' + item.telegram_id },
      { text: w.copy, copy_text: { text: String(item.telegram_id) } }]);
  }
  const nav = [];
  if (current > 0) nav.push({ text: w.prev, callback_data: 'admin:users:page:' + (current - 1) });
  if (current < pages - 1) nav.push({ text: w.next, callback_data: 'admin:users:page:' + (current + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: w.main, callback_data: 'admin:main' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, actor);
}
async function showFavoriteSettings(chatId, actor, page) {
  const all = await db.select().from(favorites).where(eq(favorites.user_telegram_id, Number(actor.telegram_id))).all(), w = listWords(actor);
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = '❤️ ' + w.fav + '\n' + (current + 1) + '/' + pages + '\n\n';
  for (const item of items) {
    const friend = await getUser(item.favorite_telegram_id); if (!friend) continue;
    const name = [friend.name || friend.first_name || 'User', friend.surname || ''].filter(Boolean).join(' ');
    text += '👤 ' + name + '\n🆔 ' + friend.telegram_id + '\n\n';
    rows.push([{ text: '❌ ' + w.unfollow + ' ' + name.slice(0, 24), callback_data: 'settings:unfavorite:' + friend.telegram_id + ':' + current }]);
  }
  if (!all.length) text += actor.language === 'en' ? 'Your favorites list is empty.' : 'د پالو ملګرو لېست تش دی.';
  const nav = [];
  if (current > 0) nav.push({ text: w.prev, callback_data: 'settings:favorites:page:' + (current - 1) });
  if (current < pages - 1) nav.push({ text: w.next, callback_data: 'settings:favorites:page:' + (current + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: '⚙️ ' + w.settings, callback_data: 'settings:open' }, { text: w.main, callback_data: 'settings:main' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, actor);
}
async function showMain(chatId, user, message) {
  user.state = 'ready';
  await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
  const text = (message ? message + '\n\n' : '') + tx(user).main;
  await sendPrompt(chatId, text, mainKeyboard(user, await isAdmin(user.telegram_id)), user);
}
async function showCountry(chatId, user) {
  await sendPrompt(chatId, tx(user).country, countryKeyboard(), user);
}
async function showGender(chatId, user) {
  await sendPrompt(chatId, tx(user).gender, genderKeyboard(user), user);
}
async function showAge(chatId, user) {
  await sendPrompt(chatId, tx(user).age, ageKeyboard(), user);
}
async function requiredChannelAdminKeyboard(actor) {
  const labels = {
    ps: ['➕ ګروپ یا چینل زیاتول', '📋 د ګروپونو لېست', '🔙 اډمین پینل'],
    fa: ['➕ افزودن گروه یا کانال', '📋 فهرست گروه‌ها', '🔙 پنل مدیریت'],
    en: ['➕ Add group/channel', '📋 List groups', '🔙 Admin panel'],
    ur: ['➕ گروپ یا چینل شامل کریں', '📋 گروپس کی فہرست', '🔙 ایڈمن پینل'],
    ar: ['➕ إضافة مجموعة أو قناة', '📋 قائمة المجموعات', '🔙 لوحة الإدارة']
  };
  const b = labels[actor.language] || labels.ps;
  return replyKeyboard([[{ text: b[0] }], [{ text: b[1] }], [{ text: b[2] }]]);
}
async function showRequiredChannelList(chatId, actor, notice) {
  const chats = await db.select().from(required_chats).where(eq(required_chats.is_active, 1)).all();
  const rows = chats.map(row => {
    const info = requiredChatInfo(row);
    return [{ text: (info.type === 'channel' ? '📢 ' : '👥 ') + String(info.title || row.chat_id).slice(0, 48),
      callback_data: 'admin:channels:item:' + encodeURIComponent(String(row.chat_id)) }];
  });
  rows.push([{ text: '🔙 بېرته', callback_data: 'admin:channels:back' }]);
  const title = actor.language === 'en' ? '📢 Required groups and channels' :
    actor.language === 'fa' ? '📢 گروه‌ها و کانال‌های عضویت اجباری' :
    actor.language === 'ur' ? '📢 لازمی گروپس اور چینلز' :
    actor.language === 'ar' ? '📢 مجموعات وقنوات العضوية الإلزامية' : '📢 د غړیتوب ګروپونه او چینلونه';
  const hint = chats.length
    ? (actor.language === 'en' ? 'Choose a group/channel to edit or delete it.' : 'د بدلولو یا حذفولو لپاره د ګروپ یا چینل نوم وټاکه.')
    : (actor.language === 'en' ? 'No groups/channels are configured.' : 'تر اوسه هېڅ ګروپ یا چینل نشته.');
  await sendPrompt(chatId, (notice ? notice + '\n\n' : '') + title + '\n\n' + hint, { inline_keyboard: rows }, actor);
}
async function showRequiredChannelDetail(chatId, actor, chatIdValue, notice) {
  const row = await db.select().from(required_chats).where(eq(required_chats.chat_id, String(chatIdValue))).get();
  if (!row) { await showRequiredChannelList(chatId, actor, actor.language === 'en' ? 'This group/channel no longer exists.' : 'دا ګروپ یا چینل نور شتون نه لري.'); return; }
  const info = requiredChatInfo(row);
  const labels = {
    ps: ['✏️ بدلول', '🗑 حذفول', '🔙 لېست ته بېرته', '📢 ګروپ/چینل', '🔗 لینک'],
    fa: ['✏️ ویرایش', '🗑 حذف', '🔙 بازگشت به فهرست', '📢 گروه/کانال', '🔗 پیوند'],
    en: ['✏️ Edit', '🗑 Delete', '🔙 Back to list', '📢 Group/channel', '🔗 Link'],
    ur: ['✏️ تبدیل کریں', '🗑 حذف کریں', '🔙 فہرست پر واپس', '📢 گروپ/چینل', '🔗 لنک'],
    ar: ['✏️ تعديل', '🗑 حذف', '🔙 العودة للقائمة', '📢 المجموعة/القناة', '🔗 الرابط']
  };
  const b = labels[actor.language] || labels.ps;
  const text = (notice ? notice + '\n\n' : '') + b[3] + ': ' + info.title + '\n🆔 ID: ' + row.chat_id + '\n' + b[4] + ': ' + (row.invite_link || '—');
  await sendPrompt(chatId, text, { inline_keyboard: [
    [{ text: b[0], callback_data: 'admin:channels:edit:' + encodeURIComponent(String(row.chat_id)) },
     { text: b[1], callback_data: 'admin:channels:delete:' + encodeURIComponent(String(row.chat_id)) }],
    [{ text: b[2], callback_data: 'admin:channels:list' }]
  ] }, actor);
}
async function handleAdminCallback(query, actor, data, actorId, chatId) {
  const requestedAction = String(data).split(':')[1];
  if (!(await isAdmin(actorId)) && !['main', 'rank', 'rank_menu'].includes(requestedAction)) {
    await sendPrompt(chatId, (ADMIN_UI[actor.language] || ADMIN_UI.ps).noAccess, mainKeyboard(actor, false), actor);
    return;
  }
  const p = data.split(':'), ui = ADMIN_UI[actor.language] || ADMIN_UI.ps;
  if (p[1] === 'main') { await showMain(chatId, actor); return; }
  if (p[1] === 'panel') {
    actor.state = 'admin_menu'; await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
    await sendPrompt(chatId, ui.intro, adminKeyboard(actor), actor); return;
  }
  if (p[1] === 'manage_admins') {
    actor.state = 'admin_management_menu'; await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
    await sendPrompt(chatId, ui.managementIntro, adminManagementKeyboard(actor), actor); return;
  }
  if (p[1] === 'channels') {
    const action = p[2] || '';
    let selectedId = '';
    try { selectedId = decodeURIComponent(p.slice(3).join(':')); } catch (e) { selectedId = ''; }
    if (action === 'list') { await showRequiredChannelList(chatId, actor); return; }
    if (action === 'back') {
      actor.state = 'admin_channels_menu';
      await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
      const intro = actor.language === 'en' ? '📢 Required membership management:' : '📢 د اجباري غړیتوب اداره:';
      await sendPrompt(chatId, intro, await requiredChannelAdminKeyboard(actor), actor);
      return;
    }
    if (!selectedId || !/^-?\d+$/.test(selectedId)) return;
    if (action === 'item') { await showRequiredChannelDetail(chatId, actor, selectedId); return; }
    if (action === 'edit') {
      const prompt = actor.language === 'en' ? 'Send the new numeric ID of the group/channel:' : 'د دې ګروپ یا چینل نوی عددي ID راولېږه:';
      actor.state = 'waiting_edit_channel_id:' + selectedId;
      await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
      await sendPrompt(chatId, prompt, { force_reply: true }, actor);
      return;
    }
    if (action === 'delete') {
      const question = actor.language === 'en' ? 'Are you sure you want to delete this group/channel?' : 'ایا ډاډه یې چې دا ګروپ یا چینل حذف کړې؟';
      const yes = actor.language === 'en' ? '✅ Yes, delete' : '✅ هو، حذف یې کړه';
      const no = actor.language === 'en' ? '❌ Cancel' : '❌ لغوه';
      await sendPrompt(chatId, question, { inline_keyboard: [
        [{ text: yes, callback_data: 'admin:channels:delete_confirm:' + encodeURIComponent(selectedId) }],
        [{ text: no, callback_data: 'admin:channels:item:' + encodeURIComponent(selectedId) }]
      ] }, actor);
      return;
    }
    if (action === 'delete_confirm') {
      const existing = await db.select().from(required_chats).where(eq(required_chats.chat_id, selectedId)).get();
      if (!existing) { await showRequiredChannelList(chatId, actor, actor.language === 'en' ? 'This group/channel was already deleted.' : 'دا ګروپ یا چینل مخکې حذف شوی دی.'); return; }
      await db.delete(required_chats).where(eq(required_chats.chat_id, selectedId)).run();
      const remaining = await db.select().from(required_chats).where(eq(required_chats.chat_id, selectedId)).get();
      if (remaining) { await showRequiredChannelDetail(chatId, actor, selectedId, actor.language === 'en' ? 'Deletion could not be verified; please retry.' : 'حذف تایید نه شو؛ بیا هڅه وکړه.'); return; }
      await showRequiredChannelList(chatId, actor, actor.language === 'en' ? '✅ Group/channel deleted.' : '✅ ګروپ یا چینل حذف شو.');
      return;
    }
    return;
  }
  if (p[1] === 'setting') {
    const key = p[2];
    const allowed = ['welcome_reward_stars','welcome_reward_points','welcome_reward_likes','referral_reward_stars','referral_reward_points','referral_reward_likes','connection_search_seconds','connection_idle_minutes','connection_max_minutes','connection_cost_stars','game_min_stars','game_fee_stars','game_win_points','game_wait_seconds'];
    if (!allowed.includes(key)) return;
    actor.state = 'admin_set_setting:' + key;
    await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
    const prompt = actor.language === 'en' ? 'Send the new numeric value. Decimal star values such as 0.5 are allowed; time values must be whole numbers.' : 'د دې تنظیم نوی عدد راولېږه. د ستورو لپاره اعشاري عدد لکه 0.5 منل کېږي؛ د وخت لپاره صحیح عدد ولیکه.';
    await sendPrompt(chatId, prompt, { force_reply: true }, actor); return;
  }
  if (p[1] === 'reward') {
    const field = p[2];
    if (!['stars','points','likes'].includes(field)) return;
    actor.state = 'admin_set_referral_reward:' + field;
    await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
    const label = { stars: '⭐ Stars', points: '🏆 Points', likes: '❤️ Likes' }[field];
    await sendPrompt(chatId, 'Send the new whole-number amount for ' + label + ' per successful referral. Zero is allowed.', { force_reply: true }, actor); return;
  }
  if (p[1] === 'rank') {
    const kind = p[2];
    if (!['points','referrals','follows','likes'].includes(kind)) return;
    const allUsers = await db.select().from(users).all();
    const followRows = kind === 'follows' ? await db.select().from(favorites).all() : [];
    const counts = new Map();
    for (const row of followRows) counts.set(Number(row.favorite_telegram_id), (counts.get(Number(row.favorite_telegram_id)) || 0) + 1);
    const config = {
      points: { title: '🏆 تر ټولو ډېرې نمرې', value: row => Number(row.points || 0), label: 'نمرې' },
      referrals: { title: '📨 تر ټولو ډېر ریفرلونه', value: row => Number(row.referral_count || 0), label: 'ریفرلونه' },
      follows: { title: '👥 تر ټولو ډېر فالو شوي کسان', value: row => Number(counts.get(Number(row.telegram_id)) || 0), label: 'فالو' },
      likes: { title: '❤️ تر ټولو ډېر لایکونه', value: row => Number(row.likes || 0), label: 'لایکونه' }
    }[kind];
    const ranked = allUsers.map(row => ({ row, score: config.value(row) })).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || Number(a.row.telegram_id) - Number(b.row.telegram_id)).slice(0, 5);
    const escapeHtml = value => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const text = config.title + '\n━━━━━━━━━━━━━━\n\n' + (ranked.length
      ? ranked.map((item, i) => (i + 1) + '. ' + escapeHtml([item.row.name || item.row.first_name || item.row.username || 'کارن', item.row.surname || ''].filter(Boolean).join(' ')) +
        '\n   ' + config.label + ': ' + item.score + '\n   ID: <code>' + Number(item.row.telegram_id) + '</code>').join('\n\n')
      : 'تر اوسه په دې درجه‌بندۍ کې نمره نه شته.');
    await sendPrompt(chatId, text, { inline_keyboard: [[{ text: '🔙 لوړ رتبه کسان', callback_data: 'admin:rank_menu' }], [{ text: '🔙 اصلي مېنو', callback_data: 'admin:main' }]] }, actor, 'HTML');
    return;
  }
  if (p[1] === 'rank_menu') {
    await sendPrompt(chatId, '🏆 لوړ رتبه کسان\n\nلاندې درجه‌بندي وټاکه:', { inline_keyboard: [[{ text: '🏆 تر ټولو ډېرې نمرې', callback_data: 'admin:rank:points' }], [{ text: '📨 تر ټولو ډېر ریفرلونه', callback_data: 'admin:rank:referrals' }], [{ text: '👥 تر ټولو ډېر فالو', callback_data: 'admin:rank:follows' }], [{ text: '❤️ تر ټولو ډېر لایکونه', callback_data: 'admin:rank:likes' }], [{ text: '🔙 اصلي مېنو', callback_data: 'admin:main' }]] }, actor);
    return;
  }
  if (p[1] === 'users' && p[2] === 'page') { await showUserListPage(chatId, actor, Number(p[3])); return; }
  if (p[1] === 'admins' && p[2] === 'page') { await showAdminListPage(chatId, actor, Number(p[3])); return; }

  let targetId = 0;
  if (p[1] === 'open_user' || p[1] === 'photo' || p[1] === 'block' || p[1] === 'unblock' || p[1] === 'send') targetId = Number(p[2]);
  else if (p[1] === 'balance') targetId = Number(p[4]);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return;
  const target = await getUser(targetId);
  if (!target) { await sendPrompt(chatId, ui.userMissing, adminKeyboard(actor), actor); return; }

  if (p[1] === 'open_user') { await showAdminUserSettings(chatId, actor, target); return; }
  if (p[1] === 'photo') {
    actor.state = 'admin_edit_user_photo:' + targetId;
    await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
    const prompt = actor.language === 'en' ? 'Send the new profile photo for this user.' : actor.language === 'fa' ? 'عکس جدید پروفایل کاربر را بفرستید.' : actor.language === 'ur' ? 'صارف کی نئی پروفائل تصویر بھیجیں۔' : actor.language === 'ar' ? 'أرسل صورة الملف الشخصي الجديدة لهذا المستخدم.' : 'د دې کارن نوی پروفایل عکس راولېږه.';
    await sendPrompt(chatId, prompt, { force_reply: true }, actor); return;
  }
  if (p[1] === 'balance') {
    const field = p[2], operation = p[3];
    if (!['stars','points','likes'].includes(field) || !['add','sub'].includes(operation)) return;
    actor.state = 'admin_adjust_balance:' + field + ':' + operation + ':' + targetId;
    await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
    const labels = { stars: '⭐ Stars', points: '🏆 Points', likes: '❤️ Likes' };
    const verb = operation === 'add' ? (actor.language === 'en' ? 'add to' : 'زیاتول') : (actor.language === 'en' ? 'subtract from' : 'کمول');
    await sendPrompt(chatId, actor.language === 'en' ? 'Send the whole-number amount to ' + verb + ' ' + labels[field] + ':' : labels[field] + ' ' + verb + ' لپاره مثبت صحیح عدد راولېږه:', { force_reply: true }, actor); return;
  }
  if (p[1] === 'block' || p[1] === 'unblock') {
    if (p[1] === 'block' && await isAdmin(targetId)) {
      await sendPrompt(chatId, actor.language === 'en' ? '⛔ Administrators cannot be blocked from this panel.' : '⛔ د بوټ مدیران د دې پینل له لارې نه شي مسدودېدای.', adminUserSettingsKeyboard(actor, targetId, target.is_blocked), actor); return;
    }
    const blocking = p[1] === 'block';
    const value = blocking ? 1 : 0;
    await db.update(users).set({ is_blocked: value }).where(eq(users.telegram_id, targetId)).run();
    target.is_blocked = value;
    if (blocking) {
      try {
        const reqs = await db.select().from(connection_requests).all();
        for (const row of reqs.filter(item => (Number(item.requester_id) === targetId || Number(item.recipient_id) === targetId) && ['searching','matching','pending'].includes(item.status))) {
          await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
            .where(and(eq(connection_requests.id, Number(row.id)), eq(connection_requests.status, row.status))).run();
        }
      } catch (e) { reportDiagnostic('callback-handler', 'Could not cancel blocked user connection requests', e); }
      try {
        const sessions = await db.select().from(chat_sessions).all();
        for (const session of sessions.filter(item => item.status === 'connected' && (Number(item.first_user_telegram_id) === targetId || Number(item.second_user_telegram_id) === targetId))) {
          await endConnection(session, 'user_blocked');
        }
      } catch (e) { reportDiagnostic('callback-handler', 'Could not end blocked user connection', e); }
      try {
        const games = await db.select().from(game_sessions).all();
        // Never cancel a playing game here: its settlement may already be in progress.
        // Only cancel offers that have not entered the settlement state.
        for (const game of games.filter(item => (Number(item.player_id) === targetId || Number(item.opponent_id) === targetId) && ['waiting','pending'].includes(item.status))) {
          await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
            .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, game.status))).run();
        }
      } catch (e) { reportDiagnostic('callback-handler', 'Could not cancel blocked user games', e); }
      try { await api.sendMessage({ chat_id: targetId, text: target.language === 'en' ? '⛔ Your account has been restricted by an administrator.' : '⛔ ستا حساب د اډمین له خوا محدود شو.' }); } catch (e) {}
    } else {
      try { await api.sendMessage({ chat_id: targetId, text: target.language === 'en' ? '✅ Your account restriction has been removed.' : '✅ ستا د حساب محدودیت لرې شو.' }); } catch (e) {}
    }
    await showAdminUserSettings(chatId, actor, target); return;
  }
  if (p[1] === 'send') {
    actor.state = 'admin_send_user_message:' + targetId;
    await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
    const prompt = actor.language === 'en' ? 'Send any message, photo, video, document, sticker, voice or other Telegram content for this user.' : actor.language === 'fa' ? 'هر نوع پیام، عکس، ویدیو، فایل یا محتوای تلگرام را برای کاربر بفرستید.' : actor.language === 'ur' ? 'صارف کے لیے کوئی بھی پیغام، تصویر، ویڈیو یا فائل بھیجیں۔' : actor.language === 'ar' ? 'أرسل أي رسالة أو صورة أو فيديو أو ملف إلى المستخدم.' : 'کارن ته هر ډول پیغام، عکس، ویډیو، فایل یا نور ټیلیګرام مواد راولېږه.';
    await sendPrompt(chatId, prompt, { force_reply: true }, actor); return;
  }
}
async function handleSettingsCallback(query, actor, data, actorId, chatId) {
  const p = data.split(':');
  if (p[1] === 'main') { await showMain(chatId, actor); return; }
  if (p[1] === 'open') {
    actor.state = 'settings_menu'; await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
    const labels = { ps: '⚙️ د تنظیماتو یوه برخه وټاکه:', fa: '⚙️ یکی از بخش‌های تنظیمات را انتخاب کنید:', en: '⚙️ Choose a settings section:', ur: '⚙️ ترتیبات کا حصہ منتخب کریں:', ar: '⚙️ اختر قسم الإعدادات:' };
    const b = { ps: ['👤 د پروفایل تنظیمات','❤️ د پالو ملګرو تنظیمات','🔙 اصلي مېنو'], fa: ['👤 تنظیمات پروفایل','❤️ تنظیمات دوستان محبوب','🔙 منوی اصلی'], en: ['👤 Profile settings','❤️ Favorite friends settings','🔙 Main menu'], ur: ['👤 پروفائل کی ترتیبات','❤️ پسندیدہ دوستوں کی ترتیبات','🔙 مرکزی مینو'], ar: ['👤 إعدادات الملف الشخصي','❤️ إعدادات الأصدقاء المفضلين','🔙 القائمة الرئيسية'] };
    const pair = b[actor.language] || b.ps;
    await sendPrompt(chatId, labels[actor.language] || labels.ps, { keyboard: [[{text:pair[0]},{text:pair[1]}],[{text:pair[2]}]], resize_keyboard:true }, actor); return;
  }
  if (p[1] === 'visibility') {
    const visibility = p[2];
    if (!['everyone','followers'].includes(visibility)) return;
    await db.update(users).set({ profile_visibility: visibility, state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
    actor.profile_visibility = visibility; actor.state = 'ready';
    await sendPrompt(chatId, visibility === 'followers' ? '🔒 ستا بشپړ پروفایل به یوازې ستا پالو ملګرو ته ښکاري؛ نورو ته به یوازې نوم او جنسیت ښکاري.' : '🌐 ستا پروفایل ټولو ته ښکاره دی، خو د ستورو بیلانس هېڅکله نورو ته نه ښکاري.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
  }

  if (p[1] === 'favorites' && p[2] === 'page') { await showFavoriteSettings(chatId, actor, Number(p[3])); return; }
  if (p[1] === 'unfavorite') {
    const targetId = Number(p[2]), page = Number(p[3]) || 0;
    if (Number.isSafeInteger(targetId) && targetId > 0) {
      const rows = await db.select().from(favorites).where(eq(favorites.user_telegram_id, actorId)).all();
      const row = rows.find(item => Number(item.favorite_telegram_id) === targetId);
      if (row) await db.delete(favorites).where(eq(favorites.id, Number(row.id))).run();
    }
    await showFavoriteSettings(chatId, actor, page); return;
  }
}

async function blockedPair(firstId, secondId) {
  const rows = await db.select().from(user_blocks).all();
  return rows.some(row => (Number(row.blocker_telegram_id) === Number(firstId) && Number(row.blocked_telegram_id) === Number(secondId)) ||
    (Number(row.blocker_telegram_id) === Number(secondId) && Number(row.blocked_telegram_id) === Number(firstId)));
}
async function publicProfileText(target, viewerId) {
  const viewer = await getUser(viewerId);
  const p = mt(viewer).sessionText;
  const name = [target.name || target.first_name || p.fallbackName, target.surname || ''].filter(Boolean).join(' ');
  const gender = target.gender === 'female' ? p.female : target.gender === 'male' ? p.male : p.genderUnset;
  if (target.profile_visibility === 'followers' && !(await isFollowing(viewerId, target.telegram_id))) {
    return '👤 ' + p.name + ': ' + name + '\n\n⚧ ' + p.gender + ': ' + gender + '\n\n' + p.privateProfile;
  }
  const country = COUNTRIES.find(item => item.code === target.country), language = LANGUAGES.find(item => item.code === target.language);
  const favCount = await db.$count(favorites, eq(favorites.favorite_telegram_id, Number(target.telegram_id)));
  return '👤 ' + p.name + ': ' + name + '\n\n⚧ ' + p.gender + ': ' + gender +
    '\n\n🌍 ' + p.country + ': ' + (country ? country.label : '—') +
    '\n\n🎂 ' + p.age + ': ' + (target.age || '—') + '\n\n🗣️ ' + p.language + ': ' + (language ? language.label : target.language || '—') +
    '\n\n📢 ' + p.channel + ': ' + (target.channel_username || '—') + '\n\n📨 ' + p.referrals + ': ' + Number(target.referral_count || 0) +
    '\n\n👥 ' + p.favorites + ': ' + favCount + '\n\n🏆 ' + p.points + ': ' + Number(target.points || 0) + '\n\n❤️ ' + p.likes + ': ' + Number(target.likes || 0);
}
function sessionControlLabels(user) {
  const p = mt(user).sessionText;
  return { profile: p.controlProfile, end: p.controlEnd, delete: p.controlDelete };
}
function sessionControlKeyboard(user) {
  const b = sessionControlLabels(user);
  return { keyboard: [[{ text: b.profile }, { text: b.end }], [{ text: b.delete }]], resize_keyboard: true };
}
function sessionEndedKeyboard(user, admin) {
  const markup = mainKeyboard(user, admin);
  markup.keyboard.unshift([{ text: sessionControlLabels(user).delete }]);
  return markup;
}
function sessionKeyboard(targetId, sessionId, following, liked, user) {
  const p = mt(user).sessionText;
  return { inline_keyboard: [[
    { text: following ? p.followed : p.follow, callback_data: 'session:follow:' + targetId + ':' + sessionId },
    { text: liked ? p.unlike : p.like, callback_data: 'session:like:' + targetId + ':' + sessionId }
  ]] };
}
async function showSessionProfile(session, viewerId) {
  const targetId = otherSessionUser(session, viewerId), target = await getUser(targetId), viewer = await getUser(viewerId);
  if (!target || !viewer) return;
  const following = await isFollowing(viewerId, targetId);
  const likes = await db.select().from(user_likes).where(eq(user_likes.liker_id, Number(viewerId))).all();
  const liked = likes.some(row => Number(row.liked_id) === targetId);
  const fullProfileAllowed = target.profile_visibility !== 'followers' || following;
  const text = mt(viewer).sessionText.active + '\n\n' + await publicProfileText(target, viewerId);
  const markup = sessionKeyboard(targetId, session.id, following, liked, viewer);
  if (fullProfileAllowed && target.profile_photo_id) {
    try {
      await ensureInlinePromptTracking();
      const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users)
        .where(eq(users.telegram_id, Number(viewerId))).get();
      const previousId = Number(latest && latest.last_prompt_id || 0);
      if (previousId > 0) await safeDelete(viewerId, previousId);
      const sent = await api.sendPhoto({
        chat_id: Number(viewerId), photo: target.profile_photo_id,
        caption: text.slice(0, 1024), reply_markup: styleKeyboardMarkup(markup)
      });
      const sentId = Number(sent && sent.message_id || 0);
      await db.update(users).set({ last_prompt_id: sentId }).where(eq(users.telegram_id, Number(viewerId))).run();
      viewer.last_prompt_id = sentId;
      return;
    } catch (photoError) {
      console.warn('Could not send connection partner profile photo; falling back to text', {
        viewerId: Number(viewerId), targetId, photoError
      });
    }
  }
  await sendPrompt(viewerId, text, markup, viewer);
}
async function availableRatingButtons(raterId, ratedId, sessionId) {
  const allRatings = await db.select().from(user_ratings).all();
  const alreadyGiven = allRatings
    .filter(row => Number(row.rater_id) === Number(raterId) && Number(row.rated_id) === Number(ratedId))
    .reduce((sum, row) => sum + Math.max(0, Number(row.rating) || 0), 0);
  const remaining = Math.max(0, 5 - alreadyGiven);
  const buttons = [];
  for (let rating = 1; rating <= remaining; rating++) {
    buttons.push({ text: '⭐ ' + rating, callback_data: 'session:rate:' + ratedId + ':' + rating + ':' + sessionId });
  }
  return buttons;
}
async function endConnection(session, reason) {
  if (!session || session.status !== 'connected') return;
  const endedAt = new Date().toISOString();
  const ended = await db.update(chat_sessions).set({ status: 'ended', ended_at: endedAt, end_reason: reason || 'ended' })
    .where(and(eq(chat_sessions.id, Number(session.id)), eq(chat_sessions.status, 'connected')))
    .returning({ id: chat_sessions.id }).run();
  let endVerified = Boolean(ended && Array.isArray(ended.rows) && ended.rows.length > 0);
  if (!endVerified) {
    const persisted = await db.select().from(chat_sessions).where(eq(chat_sessions.id, Number(session.id))).get();
    endVerified = Boolean(persisted && persisted.status === 'ended' && String(persisted.ended_at || '') === endedAt);
  }
  if (!endVerified) return;
  for (const pair of [{ id: Number(session.first_user_telegram_id), partnerId: Number(session.second_user_telegram_id) },
    { id: Number(session.second_user_telegram_id), partnerId: Number(session.first_user_telegram_id) }]) {
    const user = await getUser(pair.id), partner = await getUser(pair.partnerId);
    if (!user) continue;
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, pair.id)).run();
    const p = tx(user).sessionText;
    const name = partner ? [partner.name || partner.first_name || p.fallbackName, partner.surname || ''].filter(Boolean).join(' ') : p.fallbackName;
    const following = await isFollowing(pair.id, pair.partnerId);
    const ratingButtons = await availableRatingButtons(pair.id, pair.partnerId, session.id);
    const rows = [];
    if (ratingButtons.length) rows.push(ratingButtons);
    if (!following) rows.push([{ text: p.follow + ' ' + name, callback_data: 'session:follow:' + pair.partnerId + ':' + session.id }]);
    rows.push([{ text: p.mainMenu, callback_data: 'settings:main' }]);
    try {
      await sendPrompt(pair.id, p.ended + '\n\n' + p.partnerName + name + '\n\n' + p.afterEnd, { inline_keyboard: rows }, user);
    } catch (e) {}
    try {
      const keyboard = sessionEndedKeyboard(user, await isAdmin(pair.id));
      await api.sendMessage({
        chat_id: pair.id,
        text: p.deleteHint,
        reply_markup: styleKeyboardMarkup(keyboard)
      });
    } catch (keyboardError) {
      reportDiagnostic('callback-handler', 'Could not show post-connection reply keyboard', { sessionId: Number(session.id), userId: pair.id, keyboardError });
    }
  }
}
async function expireUserTimedActions(userId, options = {}) {
  const id = Number(userId), user = await getUser(id);
  if (!user) return false;
  const now = Date.now();
  let expired = false, notifiedActor = false;
  const session = await activeSessionFor(id);
  if (session) {
    const idleMinutes = Number(await getSetting('connection_idle_minutes', 5));
    const maxMinutes = Number(await getSetting('connection_max_minutes', 40));
    const last = Date.parse(session.last_activity_at || session.connected_at || session.created_at || '');
    const start = Date.parse(session.connected_at || session.created_at || '');
    if ((Number.isFinite(last) && now - last >= idleMinutes * 60000) || (Number.isFinite(start) && now - start >= maxMinutes * 60000)) {
      await endConnection(session, Number.isFinite(last) && now - last >= idleMinutes * 60000 ? 'idle_timeout' : 'max_duration');
      expired = true; notifiedActor = true;
    }
  }
  // Callback actions such as game buttons must still enforce connection timeouts,
  // without running game/request cleanup before the game callback's own state claim.
  if (options && options.connectionOnly) return expired;
  const connectionWait = Math.max(1, Number(await getSetting('connection_search_seconds', 120)) || 120);
  const requests = await db.select().from(connection_requests).all();
  // Recover searches left in the temporary "matching" state if a previous invocation crashed.
  // Expire any associated offers too, so recipients cannot accept an orphaned offer later.
  for (const stuck of requests.filter(row => Number(row.requester_id) === id && row.status === 'matching')) {
    const stamp = Date.parse(stuck.updated_at || stuck.created_at || '');
    if (Number.isFinite(stamp) && now - stamp < connectionWait * 1000) continue;
    const expiredSearch = await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
      .where(and(eq(connection_requests.id, Number(stuck.id)), eq(connection_requests.status, 'matching')))
      .returning({ id: connection_requests.id }).run();
    if (!expiredSearch || !Array.isArray(expiredSearch.rows) || expiredSearch.rows.length === 0) continue;
    stuck.status = 'expired';
    for (const offer of requests.filter(row => Number(row.requester_id) === id && row.status === 'pending')) {
      const expiredOffer = await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(offer.id)), eq(connection_requests.status, 'pending')))
        .returning({ id: connection_requests.id }).run();
      if (!expiredOffer || !Array.isArray(expiredOffer.rows) || expiredOffer.rows.length === 0) continue;
      offer.status = 'expired';
      if (Number(offer.recipient_id) > 0) {
        try { await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د تخنیکي ځنډ له امله لغوه شوه.' }); } catch (e) {}
      }
    }
    if (user.state === 'searching_connection') await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run();
    expired = true;
  }

  for (const search of requests.filter(row => Number(row.requester_id) === id && row.status === 'searching' && !row.recipient_id)) {
    const age = now - Date.parse(search.created_at || '');
    if (Number.isFinite(age) && age < connectionWait * 1000) continue;
    await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(search.id))).run();
    search.status = 'expired';
    for (const offer of requests.filter(row => Number(row.requester_id) === id && row.status === 'pending')) {
      await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(offer.id))).run();
      offer.status = 'expired';
      if (Number(offer.recipient_id) > 0) try { await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}
    }
    if (user.state === 'searching_connection') await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run();
    expired = true;
  }
  for (const offer of requests.filter(row => Number(row.recipient_id) === id && row.status === 'pending')) {
    const sourceSearch = requests.find(row => Number(row.requester_id) === Number(offer.requester_id) && row.status === 'searching' && !row.recipient_id);
    const sourceAge = sourceSearch ? now - Date.parse(sourceSearch.created_at || '') : NaN;
    if (sourceSearch && Number.isFinite(sourceAge) && sourceAge < connectionWait * 1000) continue;
    await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(offer.id))).run();
    offer.status = 'expired';
    if (sourceSearch) {
      await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(sourceSearch.id))).run();
      sourceSearch.status = 'expired';
      const requester = await getUser(sourceSearch.requester_id);
      if (requester) {
        if (requester.state === 'searching_connection') await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, Number(requester.telegram_id))).run();
        try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: '⌛ د ملګري لټون وخت پای ته ورسېد؛ غوښتنه لغوه شوه. بیا هڅه وکړه.' }); } catch (e) {}
      }
      for (const otherOffer of requests.filter(row => Number(row.requester_id) === Number(sourceSearch.requester_id) && row.status === 'pending')) {
        await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(otherOffer.id))).run();
        otherOffer.status = 'expired';
        if (Number(otherOffer.recipient_id) > 0 && Number(otherOffer.recipient_id) !== id) try { await api.sendMessage({ chat_id: Number(otherOffer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}
      }
    }
    expired = true;
  }
  const gameWait = Math.max(1, Number(await getSetting('game_wait_seconds', 120)) || 120);
  const games = await db.select().from(game_sessions).all();
  for (const game of games) {
    const isOwnGame = Number(game.player_id) === id;
    const isIncomingOffer = Number(game.opponent_id) === id && game.status === 'pending';
    // On the user's next interaction, clear stale games (including a "playing"
    // row left behind by a crashed serverless invocation) after the configured timeout.
    if (!['waiting', 'pending', 'playing'].includes(game.status) || (!isOwnGame && !isIncomingOffer && Number(game.opponent_id) !== id)) continue;
    const timerStart = game.status === 'waiting' ? (game.created_at || game.updated_at) : (game.updated_at || game.created_at);
    const age = now - Date.parse(timerStart || '');
    if (Number.isFinite(age) && age < gameWait * 1000) continue;
    const ownerCondition = isOwnGame ? eq(game_sessions.player_id, id) : eq(game_sessions.opponent_id, id);
    const cancelled = await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, game.status), ownerCondition))
      .returning({ id: game_sessions.id }).run();
    if (!cancelled || !Array.isArray(cancelled.rows) || cancelled.rows.length === 0) continue;
    game.status = 'cancelled';
    for (const playerId of [Number(game.player_id), Number(game.opponent_id || 0)]) {
      if (playerId > 0 && playerId !== id) try { await api.sendMessage({ chat_id: playerId, text: '⌛ پخوانی ګېم د انتظار د وخت له تېرېدو وروسته لغوه شو. مهرباني وکړه نوی ګېم پیل کړه.' }); } catch (e) {}
    }
    expired = true;
  }
  if (expired && !notifiedActor) {
    try { await sendPrompt(id, '⌛ ستا پخوانی عمل د وخت د تېرېدو له امله لغوه شو. دا پیغام یوازې د لغوه کولو لپاره و؛ اوس بیا هڅه کولای شې.', mainKeyboard(user, await isAdmin(id)), user); }
    catch (e) { try { await api.sendMessage({ chat_id: id, text: '⌛ ستا پخوانی عمل د وخت د تېرېدو له امله لغوه شو. بیا هڅه وکړه.' }); } catch (ignored) {} }
  }
  return expired;
}
async function tryOfferSearches() {
  const requests = await db.select().from(connection_requests).all(), allUsers = await db.select().from(users).all();
  const sessions = await db.select().from(chat_sessions).all(), blocks = await db.select().from(user_blocks).all(), favs = await db.select().from(favorites).all();
  const games = await db.select().from(game_sessions).all();
  const now = Date.now(), wait = Math.max(1, Number(await getSetting('connection_search_seconds', 120)) || 120);
  // Expire abandoned searches globally so stale requests cannot block future searches.
  for (const staleSearch of requests.filter(row => ['searching', 'matching'].includes(row.status) && !row.recipient_id)) {
    // A process interruption after searching -> matching must not leave the user
    // permanently blocked. Matching is short-lived, so age it from updated_at.
    const stamp = staleSearch.status === 'matching'
      ? (staleSearch.updated_at || staleSearch.created_at)
      : staleSearch.created_at;
    const staleAge = now - Date.parse(stamp || '');
    if (Number.isFinite(staleAge) && staleAge < wait * 1000) continue;
    const conditions = [
      eq(connection_requests.id, Number(staleSearch.id)),
      eq(connection_requests.status, staleSearch.status)
    ];
    if (staleSearch.updated_at != null) conditions.push(eq(connection_requests.updated_at, staleSearch.updated_at));
    const expiredSearch = await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
      .where(and(...conditions))
      .returning({ id: connection_requests.id }).run();
    if (!expiredSearch || !Array.isArray(expiredSearch.rows) || expiredSearch.rows.length === 0) continue;
    staleSearch.status = 'expired';
    await db.update(users).set({ state: 'ready' }).where(and(eq(users.telegram_id, Number(staleSearch.requester_id)), eq(users.state, 'searching_connection'))).run();
    for (const staleOffer of requests.filter(row =>
      Number(row.requester_id) === Number(staleSearch.requester_id) &&
      row.status === 'pending' &&
      String(row.created_at || '') >= String(staleSearch.created_at || '')
    )) {
      const expiredOffer = await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(staleOffer.id)), eq(connection_requests.status, 'pending')))
        .returning({ id: connection_requests.id }).run();
      if (expiredOffer && Array.isArray(expiredOffer.rows) && expiredOffer.rows.length > 0) {
        staleOffer.status = 'expired';
        if (Number(staleOffer.recipient_id) > 0) try { await api.sendMessage({ chat_id: Number(staleOffer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}
      }
    }
    try { await api.sendMessage({ chat_id: Number(staleSearch.requester_id), text: '⌛ د ملګري لټون وخت پای ته ورسېد؛ غوښتنه لغوه شوه. بیا هڅه وکړه.' }); } catch (e) {}
  }
  for (const search of requests.filter(row => row.status === 'searching' && !row.recipient_id)) {
    const age = now - Date.parse(search.created_at || '');
    if (!Number.isFinite(age) || age >= wait * 1000) continue;
    if (requests.some(row => Number(row.requester_id) === Number(search.requester_id) && row.status === 'pending' && row.recipient_id &&
      Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < wait * 1000) ||
        requests.some(row => Number(row.recipient_id) === Number(search.requester_id) && row.status === 'pending' &&
      Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < wait * 1000)) continue;
    const requester = allUsers.find(row => Number(row.telegram_id) === Number(search.requester_id));
    if (!requester || Number(requester.is_blocked) === 1) continue;
    if (games.some(row => ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
        (Number(row.player_id) === Number(search.requester_id) || Number(row.opponent_id) === Number(search.requester_id)))) continue;
    const tried = new Set(requests.filter(row => Number(row.requester_id) === Number(search.requester_id) && row.recipient_id && Number(row.id) > Number(search.id)).map(row => Number(row.recipient_id)));
    const candidates = allUsers.filter(candidate => {
      const cid = Number(candidate.telegram_id);
      if (cid === Number(search.requester_id) || Number(candidate.is_blocked) === 1 || !candidate.country || !candidate.gender || !candidate.age) return false;
      if (games.some(row => ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
          (Number(row.player_id) === cid || Number(row.opponent_id) === cid))) return false;
      const active = Date.parse(candidate.last_active_at || '');
      if (!Number.isFinite(active) || now - active > wait * 1000 || tried.has(cid)) return false;
      if (blocks.some(row => (Number(row.blocker_telegram_id) === cid && Number(row.blocked_telegram_id) === Number(search.requester_id)) ||
        (Number(row.blocker_telegram_id) === Number(search.requester_id) && Number(row.blocked_telegram_id) === cid))) return false;
      const connected = sessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === cid || Number(row.second_user_telegram_id) === cid));
      // A recipient who is already connected cannot accept a second session; do not send an unusable offer.
      if (connected) return false;
      if (requests.some(row => ['searching', 'matching', 'pending'].includes(row.status) &&
          (Number(row.requester_id) === cid || Number(row.recipient_id) === cid))) return false;
      if (search.request_type === 'find' && search.gender_filter !== 'auto' && candidate.gender !== search.gender_filter) return false;
      if (search.request_type === 'find' && search.language_filter !== 'auto' && candidate.language !== search.language_filter) return false;
      return true;
    });
    if (!candidates.length) continue;
    const rank = item => {
      const cid = Number(item.telegram_id);
      if (sessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === cid || Number(row.second_user_telegram_id) === cid))) return 1;
      if (favs.some(row => Number(row.user_telegram_id) === Number(search.requester_id) && Number(row.favorite_telegram_id) === cid)) return 2;
      return 0;
    };
    candidates.sort((a,b) => rank(a)-rank(b) || Date.parse(b.last_active_at || '')-Date.parse(a.last_active_at || ''));
    const candidate = candidates[0];
    const claimAt = new Date().toISOString();
    const claim = await db.update(connection_requests).set({ status: 'matching', updated_at: claimAt })
      .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'searching')))
      .returning({ id: connection_requests.id }).run();
    let claimVerified = Boolean(claim && Array.isArray(claim.rows) && claim.rows.length > 0);
    if (!claimVerified) {
      // Like game acceptance, verify the exact persisted state transition when
      // this Serverless adapter applies UPDATE but omits RETURNING rows.
      const persistedClaim = await db.select().from(connection_requests).where(eq(connection_requests.id, Number(search.id))).get();
      claimVerified = Boolean(persistedClaim &&
        persistedClaim.status === 'matching' &&
        String(persistedClaim.updated_at || '') === claimAt);
    }
    if (!claimVerified) continue;
    let offer;
    let offerCreatedAt = null;
    try {
      const nowIso = new Date().toISOString();
      offerCreatedAt = nowIso;
      const inserted = await db.insert(connection_requests).values({
        requester_id: Number(search.requester_id), recipient_id: Number(candidate.telegram_id), status: 'pending',
        request_type: search.request_type, gender_filter: search.gender_filter, language_filter: search.language_filter,
        created_at: nowIso, updated_at: nowIso
      }).returning().run();
      offer = inserted && Array.isArray(inserted.rows) ? inserted.rows[0] : null;
      if (!offer || !Number.isSafeInteger(Number(offer.id)) || Number(offer.id) <= 0) {
        const persistedRequests = await db.select().from(connection_requests).all();
        const matchingOffers = persistedRequests.filter(row =>
          Number(row.requester_id) === Number(search.requester_id) &&
          Number(row.recipient_id) === Number(candidate.telegram_id) &&
          row.status === 'pending' &&
          row.request_type === search.request_type &&
          String(row.created_at || '') === nowIso &&
          Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0
        );
        if (matchingOffers.length > 0) {
          matchingOffers.sort((a, b) => Number(b.id) - Number(a.id));
          offer = matchingOffers[0];
          console.info('Verified connection offer insert after empty RETURNING result', {
            searchId: Number(search.id), offerId: Number(offer.id), candidateId: Number(candidate.telegram_id)
          });
        }
      }
      if (!offer || !Number.isSafeInteger(Number(offer.id)) || Number(offer.id) <= 0) {
        throw new Error('Connection offer insert returned no usable row after persisted-row verification');
      }
      const releaseAt = new Date().toISOString();
      const released = await db.update(connection_requests).set({ status: 'searching', updated_at: releaseAt })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'matching'), eq(connection_requests.updated_at, claimAt)))
        .returning({ id: connection_requests.id }).run();
      let releaseVerified = Boolean(released && Array.isArray(released.rows) && released.rows.length > 0);
      if (!releaseVerified) {
        const persistedRelease = await db.select().from(connection_requests).where(eq(connection_requests.id, Number(search.id))).get();
        releaseVerified = Boolean(persistedRelease &&
          persistedRelease.status === 'searching' &&
          String(persistedRelease.updated_at || '') === releaseAt);
      }
      if (!releaseVerified) {
        const latestOffer = await db.select().from(connection_requests).where(eq(connection_requests.id, Number(offer.id))).get();
        if (latestOffer && latestOffer.status === 'pending') {
          await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
            .where(and(eq(connection_requests.id, Number(offer.id)), eq(connection_requests.status, 'pending'))).run();
        }
        reportDiagnostic('callback-handler', 'Could not release claimed connection search', { searchId: search.id, offerId: offer.id });
        continue;
      }
      requests.push(offer);
    } catch (error) {
      try {
        const releaseAt = new Date().toISOString();
        await db.update(connection_requests).set({ status: 'searching', updated_at: releaseAt })
          .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'matching'), eq(connection_requests.updated_at, claimAt)))
          .run();
      } catch (releaseError) {
        reportDiagnostic('callback-handler', 'Failed to release connection search after offer creation error', { searchId: search.id, error: releaseError });
      }
      reportDiagnostic('callback-handler', 'Failed to create connection offer', { searchId: search.id, requesterId: search.requester_id, candidateId: candidate.telegram_id, offerCreatedAt, error });
      continue;
    }
    try { await api.sendMessage({ chat_id: Number(candidate.telegram_id),
      text: '🎲 یو ناڅاپي کس د اړیکې غوښتنه کړې ده.\n\nد غوښتونکي هېڅ معلومات نه ښکاري. که ومنې، اړیکه به وصل شي؛ که رد یې کړې، بل کس ته به غوښتنه ولاړه شي.',
      reply_markup: styleKeyboardMarkup({ inline_keyboard: [[{ text: '✅ غوښتنه منل', callback_data: 'conn:accept:' + offer.id }, { text: '❌ ردول', callback_data: 'conn:reject:' + offer.id }]] }) }); }
    catch (error) {
      reportDiagnostic('callback-handler', 'Failed to send connection offer to candidate', { searchId: search.id, offerId: offer.id, candidateId: candidate.telegram_id, error });
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() }).where(and(eq(connection_requests.id, Number(offer.id)), eq(connection_requests.status, 'pending'))).run();
    }
  }
}
async function startConnectionSearch(userId, type) {
  let stage = 'load-user';
  try {
  const user = await getUser(userId);
  stage = 'load-cost-setting';
  const cost = Number(await getSetting('connection_cost_stars', 1));
  if (!user) return;
  if (!Number.isFinite(cost) || cost < 0) {
    await sendPrompt(userId, '⚠️ د اړیکې د ستورو تنظیم ناسم دی. له اډمین سره اړیکه ونیسه.', mainKeyboard(user, await isAdmin(userId)), user);
    return;
  }
  if (Number(user.stars || 0) < cost) { await sendPrompt(userId, '⭐ د اړیکې لپاره ' + cost + ' ستوري پکار دي. ستا بیلانس: ' + Number(user.stars || 0), mainKeyboard(user, await isAdmin(userId)), user); return; }
  stage = 'check-active-session';
  if (await activeSessionFor(userId)) { await sendPrompt(userId, '⚠️ ته لا له یوه کس سره په اړیکه کې یې. لومړی اړیکه پای ته ورسوه.', mainKeyboard(user, await isAdmin(userId)), user); return; }
  stage = 'expire-stale-games';
  const gameWaitSeconds = Math.max(1, Number(await getSetting('game_wait_seconds', 120)) || 120);
  const gameRowsBeforeCleanup = await db.select().from(game_sessions).all();
  const cleanupNow = Date.now();
  for (const gameRow of gameRowsBeforeCleanup) {
    if (!['waiting', 'pending'].includes(gameRow.status)) continue;
    if (Number(gameRow.player_id) !== Number(userId) && Number(gameRow.opponent_id) !== Number(userId)) continue;
    const stamp = gameRow.status === 'waiting'
      ? (gameRow.created_at || gameRow.updated_at)
      : (gameRow.updated_at || gameRow.created_at);
    const age = cleanupNow - Date.parse(stamp || '');
    if (Number.isFinite(age) && age < gameWaitSeconds * 1000) continue;
    const expiredGame = await db.update(game_sessions)
      .set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(gameRow.id)), eq(game_sessions.status, gameRow.status)))
      .returning({ id: game_sessions.id }).run();
    if (expiredGame && Array.isArray(expiredGame.rows) && expiredGame.rows.length > 0) {
      console.info('Expired stale game request while starting connection search', {
        userId: Number(userId), gameId: Number(gameRow.id), previousStatus: gameRow.status, ageMs: age
      });
      const otherId = Number(gameRow.player_id) === Number(userId)
        ? Number(gameRow.opponent_id || 0)
        : Number(gameRow.player_id || 0);
      if (gameRow.status === 'pending' && otherId > 0 && otherId !== Number(userId)) {
        try { await api.sendMessage({ chat_id: otherId, text: '⌛ د ګېم غوښتنې وخت پای ته رسېدلی؛ دا ګېم نور فعال نه دی.' }); }
        catch (notifyError) {
          console.warn('Could not notify other player about expired game request', { gameId: Number(gameRow.id), otherId, notifyError });
        }
      }
    }
  }
  stage = 'load-active-games';
  const activeGames = await db.select().from(game_sessions).all();
  if (activeGames.some(row => ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
      (Number(row.player_id) === Number(userId) || Number(row.opponent_id) === Number(userId)))) {
    await sendPrompt(userId, '⚠️ ته لا د ګېم په بهیر کې یې. که ګېم لا د انتظار په حالت کې وي، د انتظار وخت پای ته رسېدو وروسته بیا هڅه وکړه؛ که د تصفیې ستونزه وي، له اډمین سره اړیکه ونیسه.', mainKeyboard(user, await isAdmin(userId)), user);
    return;
  }
  stage = 'load-active-requests';
  const requests = await db.select().from(connection_requests).all();
  if (requests.some(row => ['searching', 'matching', 'pending'].includes(row.status) &&
      (Number(row.requester_id) === Number(userId) || Number(row.recipient_id) === Number(userId)))) {
    await sendPrompt(userId, '🔎 ستا د ملګري لټون یا د اړیکې غوښتنه لا فعاله ده. لومړی یې پای ته ورسوه، بیا نوی لټون پیل کړه.', { inline_keyboard: [[{ text: '❌ لټون لغوه کول', callback_data: 'conn:cancel_search' }]] }, user);
    return;
  }
  let search = null, searchCreatedAt = null, startupStage = 'claim-user-state';
  try {
    // Claim the user's ready state before inserting. Two rapid button presses can
    // both pass the read-only preflight; this compare-and-set lets only one start.
    // Use last_active_at as a per-attempt marker so an empty/malformed RETURNING
    // result can be verified exactly, like game acceptance verifies updated_at.
    const initialClaimAt = new Date().toISOString();
    let stateClaim = await db.update(users).set({
      state: 'searching_connection',
      last_active_at: initialClaimAt
    })
      .where(and(eq(users.telegram_id, Number(userId)), eq(users.state, 'ready')))
      .returning({ telegram_id: users.telegram_id }).run();
    if (!stateClaim || !Array.isArray(stateClaim.rows) || stateClaim.rows.length === 0) {
      const persistedClaim = await getUser(userId);
      const thisClaimWon = persistedClaim &&
        persistedClaim.state === 'searching_connection' &&
        String(persistedClaim.last_active_at || '') === initialClaimAt;
      if (thisClaimWon) {
        stateClaim = { rows: [{ telegram_id: Number(userId) }] };
        console.info('Verified connection search claim after empty RETURNING result', {
          userId: Number(userId), claimStage: 'initial', state: persistedClaim.state
        });
      }
    }
    if (!stateClaim || !Array.isArray(stateClaim.rows) || stateClaim.rows.length === 0) {
      // A Serverless invocation can stop after claiming the state but before inserting
      // its request. Do not use timers here; this runtime does not expose setTimeout.
      // Recovery is allowed only after checking current database records.
      let recoverySnapshot = null;
      const resetDiagnostics = { conditionalResetRows: null, stateAfterConditionalReset: null, fallbackResetRows: null, stateAfterFallbackReset: null };
      try {
        const [latestUser, latestRequests, latestGames, latestSession] = await Promise.all([
          getUser(userId),
          db.select().from(connection_requests).all(),
          db.select().from(game_sessions).all(),
          activeSessionFor(userId)
        ]);
        const activeRequests = latestRequests.filter(row =>
          ['searching', 'matching', 'pending'].includes(row.status) &&
          (Number(row.requester_id) === Number(userId) || Number(row.recipient_id) === Number(userId))
        );
        const activeGames = latestGames.filter(row =>
          ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
          (Number(row.player_id) === Number(userId) || Number(row.opponent_id) === Number(userId))
        );
        recoverySnapshot = { latestUser, activeRequests, activeGames, latestSession };
        console.warn('Connection search state claim rejected; checking for an orphaned state', {
          userId: Number(userId),
          currentState: latestUser && latestUser.state,
          activeRequests: activeRequests.map(row => ({ id: Number(row.id), status: row.status, requesterId: Number(row.requester_id), recipientId: Number(row.recipient_id || 0) })),
          activeGames: activeGames.map(row => ({ id: Number(row.id), status: row.status })),
          hasActiveSession: Boolean(latestSession)
        });
      } catch (diagnosticError) {
        reportDiagnostic('callback-handler', 'Could not inspect rejected connection search claim', { userId: Number(userId), diagnosticError });
      }

      // A stale searching_connection state cannot safely be reclaimed in the same
      // callback: another Serverless invocation may still be between claim and insert.
      // Clear only when the latest snapshot proves there is no request, game, or session,
      // then ask the user to start again in a fresh callback.
      if (recoverySnapshot &&
          recoverySnapshot.latestUser && recoverySnapshot.latestUser.state === 'searching_connection' &&
          recoverySnapshot.activeRequests.length === 0 &&
          recoverySnapshot.activeGames.length === 0 &&
          !recoverySnapshot.latestSession) {
        const resetResult = await db.update(users).set({ state: 'ready' })
          .where(and(eq(users.telegram_id, Number(userId)), eq(users.state, 'searching_connection')))
          .returning({ telegram_id: users.telegram_id }).run();
        let verifiedUser = await getUser(userId);
        resetDiagnostics.conditionalResetRows = resetResult && Array.isArray(resetResult.rows) ? resetResult.rows.length : 'unknown-result-shape';
        resetDiagnostics.stateAfterConditionalReset = verifiedUser && verifiedUser.state;
        console.info('Checked orphaned connection search state recovery', {
          userId: Number(userId),
          resetRows: resetDiagnostics.conditionalResetRows,
          stateAfterReset: resetDiagnostics.stateAfterConditionalReset
        });
        if ((!resetResult || !Array.isArray(resetResult.rows) || resetResult.rows.length === 0) &&
            verifiedUser && verifiedUser.state === 'searching_connection') {
          // If the conditional reset matched no row, refresh all durable work once more
          // before deciding whether a plain state reset is safe.
          const [requestsAtFallback, gamesAtFallback, sessionAtFallback] = await Promise.all([
            db.select().from(connection_requests).all(),
            db.select().from(game_sessions).all(),
            activeSessionFor(userId)
          ]);
          const activeRequestAtFallback = requestsAtFallback.some(row =>
            ['searching', 'matching', 'pending'].includes(row.status) &&
            (Number(row.requester_id) === Number(userId) || Number(row.recipient_id) === Number(userId))
          );
          const activeGameAtFallback = gamesAtFallback.some(row =>
            ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
            (Number(row.player_id) === Number(userId) || Number(row.opponent_id) === Number(userId))
          );
          if (!activeRequestAtFallback && !activeGameAtFallback && !sessionAtFallback) {
            const fallbackReset = await db.update(users).set({ state: 'ready' })
              .where(eq(users.telegram_id, Number(userId)))
              .returning({ telegram_id: users.telegram_id }).run();
            resetDiagnostics.fallbackResetRows = fallbackReset && Array.isArray(fallbackReset.rows) ? fallbackReset.rows.length : 'unknown-result-shape';
            console.info('Fallback reset for orphaned connection state', {
              userId: Number(userId),
              resetRows: resetDiagnostics.fallbackResetRows,
              activeRequestAtFallback,
              activeGameAtFallback,
              hasActiveSessionAtFallback: Boolean(sessionAtFallback)
            });
          } else {
            console.warn('Skipped fallback reset because durable work appeared', {
              userId: Number(userId), activeRequestAtFallback, activeGameAtFallback,
              hasActiveSessionAtFallback: Boolean(sessionAtFallback)
            });
          }
        }
        // Match the working game-acceptance pattern: never trust UPDATE/RETURNING alone.
        // Re-read the persisted user state after both conditional and fallback updates.
        verifiedUser = await getUser(userId);
        resetDiagnostics.stateAfterFallbackReset = verifiedUser && verifiedUser.state;
        console.info('Verified connection state after recovery writes', {
          userId: Number(userId),
          stateAfterConditionalReset: resetDiagnostics.stateAfterConditionalReset,
          stateAfterFallbackReset: resetDiagnostics.stateAfterFallbackReset,
          conditionalResetRows: resetDiagnostics.conditionalResetRows,
          fallbackResetRows: resetDiagnostics.fallbackResetRows
        });
        if (verifiedUser && verifiedUser.state === 'ready') {
          user.state = 'ready';
          // Continue this callback instead of making the user repeat the same action.
          // Re-check durable work after reset, then use CAS again before creating a request.
          const [requestsAfterReset, gamesAfterReset, sessionAfterReset] = await Promise.all([
            db.select().from(connection_requests).all(),
            db.select().from(game_sessions).all(),
            activeSessionFor(userId)
          ]);
          const hasActiveRequest = requestsAfterReset.some(row =>
            ['searching', 'matching', 'pending'].includes(row.status) &&
            (Number(row.requester_id) === Number(userId) || Number(row.recipient_id) === Number(userId))
          );
          const hasActiveGame = gamesAfterReset.some(row =>
            ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
            (Number(row.player_id) === Number(userId) || Number(row.opponent_id) === Number(userId))
          );
          if (!hasActiveRequest && !hasActiveGame && !sessionAfterReset) {
            const retryClaimAt = new Date().toISOString();
            stateClaim = await db.update(users).set({
              state: 'searching_connection',
              last_active_at: retryClaimAt
            })
              .where(and(eq(users.telegram_id, Number(userId)), eq(users.state, 'ready')))
              .returning({ telegram_id: users.telegram_id }).run();
            if (!stateClaim || !Array.isArray(stateClaim.rows) || stateClaim.rows.length === 0) {
              // Game acceptance uses updated_at to prove this exact callback won.
              // Here last_active_at is the existing user-row marker; no schema change is needed.
              const persistedRetryClaim = await getUser(userId);
              const thisRetryWon = persistedRetryClaim &&
                persistedRetryClaim.state === 'searching_connection' &&
                String(persistedRetryClaim.last_active_at || '') === retryClaimAt;
              if (thisRetryWon) {
                stateClaim = { rows: [{ telegram_id: Number(userId) }] };
                console.info('Verified recovered connection claim after empty RETURNING result', {
                  userId: Number(userId), claimStage: 'recovery', state: persistedRetryClaim.state
                });
              }
            }
            if (stateClaim && Array.isArray(stateClaim.rows) && stateClaim.rows.length > 0) {
              user.state = 'searching_connection';
              console.info('Recovered stale connection state and reclaimed search', { userId: Number(userId) });
            }
          }
        }
      }

      if (!stateClaim || !Array.isArray(stateClaim.rows) || stateClaim.rows.length === 0) {
        const latestUser = await getUser(userId);
        if (latestUser && latestUser.state === 'searching_connection') {
          // The user-facing message alone cannot distinguish an orphaned state from
          // a concurrent active request/game/session. Send the exact snapshot to the
          // admin so the next fix is based on database evidence, not guesses.
          reportDiagnostic('callback-handler', 'Connection search state claim still blocked after recovery attempt', {
            userId: Number(userId),
            latestUserState: latestUser.state,
            snapshotUserState: recoverySnapshot && recoverySnapshot.latestUser && recoverySnapshot.latestUser.state,
            activeRequests: recoverySnapshot ? recoverySnapshot.activeRequests.map(row => ({
              id: Number(row.id), status: row.status,
              requesterId: Number(row.requester_id), recipientId: Number(row.recipient_id || 0)
            })) : 'snapshot-unavailable',
            activeGames: recoverySnapshot ? recoverySnapshot.activeGames.map(row => ({
              id: Number(row.id), status: row.status,
              playerId: Number(row.player_id), opponentId: Number(row.opponent_id || 0)
            })) : 'snapshot-unavailable',
            hasActiveSession: recoverySnapshot ? Boolean(recoverySnapshot.latestSession) : 'snapshot-unavailable',
            recoveryAction: 'Could not reclaim searching_connection state; see snapshot above',
            resetDiagnostics: resetDiagnostics || 'reset-not-attempted'
          });
        }
        await sendPrompt(userId, latestUser && latestUser.state === 'searching_connection'
          ? '⌛ د لټون حالت لا هم په ډیټابېس کې فعال ښکاري. د ستونزې د معلومولو لپاره اډمین ته راپور ولېږل شو؛ لږ وروسته بیا هڅه وکړه.'
          : '⌛ د لټون حالت بدل شوی دی. لږ شېبه وروسته بیا هڅه وکړه.',
          mainKeyboard(user, await isAdmin(userId)), user);
        return;
      }
    }
    user.state = 'searching_connection';
    startupStage = 'insert-search';
    const now = new Date().toISOString();
    searchCreatedAt = now;
    const inserted = await db.insert(connection_requests).values({
      requester_id: Number(userId), recipient_id: null, status: 'searching', request_type: type,
      gender_filter: type === 'find' ? user.search_gender || 'auto' : 'auto',
      language_filter: type === 'find' ? user.search_language || 'auto' : 'auto',
      created_at: now, updated_at: now
    }).returning().run();
    search = inserted && Array.isArray(inserted.rows) ? inserted.rows[0] : null;
    if (!search || !Number.isSafeInteger(Number(search.id)) || Number(search.id) <= 0) {
      // Mirror game acceptance: some Serverless DB adapters persist a write but
      // return no usable RETURNING row. Re-read and verify this exact insert marker.
      const persistedRequests = await db.select().from(connection_requests).all();
      const persistedSearches = persistedRequests.filter(row =>
        Number(row.requester_id) === Number(userId) &&
        row.recipient_id == null &&
        String(row.created_at || '') === now &&
        row.request_type === type &&
        ['searching', 'matching'].includes(row.status) &&
        Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0
      );
      if (persistedSearches.length > 0) {
        persistedSearches.sort((a, b) => Number(b.id) - Number(a.id));
        search = persistedSearches[0];
        console.info('Verified connection search insert after empty RETURNING result', {
          userId: Number(userId), searchId: Number(search.id), status: search.status
        });
      }
    }
    if (!search || !Number.isSafeInteger(Number(search.id)) || Number(search.id) <= 0) {
      throw new Error('Connection search insert returned no usable row after persisted-row verification');
    }

    startupStage = 'send-search-prompt';
    await sendPrompt(userId, '🔎 د ملګري لټون پیل شو.\n\n⏳ د مناسب کس لټون تر ۲ دقیقو دوام کوي. که وخت تېر شي، د ستا راتلونکي پیغام یا تڼۍ پر مهال به لټون لغوه شي.\n\n⭐ د منلو پر مهال به ' + cost + ' ستوری کم شي.',
      { inline_keyboard: [[{ text: '❌ لټون لغوه کول', callback_data: 'conn:cancel_search:' + Number(search.id) }]] }, user);
  } catch (error) {
    reportDiagnostic('callback-handler', 'Failed to start connection search', {
      userId: Number(userId), type, stage: startupStage,
      error: error && (error.stack || error.message || String(error))
    });
    // If the insert persisted but RETURNING was unusable, recover its exact row
    // marker before cleanup so a failed startup cannot leave an orphaned search.
    if ((!search || !Number.isSafeInteger(Number(search.id)) || Number(search.id) <= 0) && searchCreatedAt) {
      try {
        const persistedRequests = await db.select().from(connection_requests).all();
        const persistedSearches = persistedRequests.filter(row =>
          Number(row.requester_id) === Number(userId) &&
          row.recipient_id == null &&
          String(row.created_at || '') === searchCreatedAt &&
          row.request_type === type &&
          ['searching', 'matching'].includes(row.status) &&
          Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0
        );
        if (persistedSearches.length > 0) {
          persistedSearches.sort((a, b) => Number(b.id) - Number(a.id));
          search = persistedSearches[0];
          console.info('Recovered persisted connection search for startup cleanup', {
            userId: Number(userId), searchId: Number(search.id), status: search.status
          });
        }
      } catch (recoveryError) {
        reportDiagnostic('callback-handler', 'Could not recover persisted search row after insert failure', {
          userId: Number(userId), type, searchCreatedAt, recoveryError
        });
      }
    }
    if (search && Number(search.id) > 0) {
      try {
        // The matcher may have claimed this row while the startup prompt was being sent.
        // Clean up both pre-offer states with compare-and-set updates; never overwrite a
        // row that has already advanced to connected.
        for (const status of ['searching', 'matching']) {
          await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
            .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, status))).run();
        }
        // Offers created by the matcher for this just-created search are separate rows.
        // If prompt delivery failed, leaving one pending makes the next search look active.
        const relatedOffers = (await db.select().from(connection_requests).all()).filter(row =>
          Number(row.requester_id) === Number(userId) &&
          row.status === 'pending' &&
          String(row.created_at || '') >= String(search.created_at || '')
        );
        for (const offer of relatedOffers) {
          const cancelledOffer = await db.update(connection_requests)
            .set({ status: 'cancelled', updated_at: new Date().toISOString() })
            .where(and(eq(connection_requests.id, Number(offer.id)), eq(connection_requests.status, 'pending')))
            .returning({ id: connection_requests.id }).run();
          if (cancelledOffer && Array.isArray(cancelledOffer.rows) && cancelledOffer.rows.length > 0) {
            try {
              await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د تخنیکي ستونزې له امله لغوه شوه.' });
            } catch (notifyError) {
              console.warn('Could not notify recipient about cleaned-up connection offer', {
                searchId: Number(search.id), offerId: Number(offer.id), recipientId: Number(offer.recipient_id), notifyError
              });
            }
          }
        }
      } catch (cleanupError) {
        reportDiagnostic('callback-handler', 'Could not clean up failed connection search', { userId: Number(userId), searchId: search.id, cleanupError });
      }
    }
    try { await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, Number(userId))).run(); } catch (stateError) {
      reportDiagnostic('callback-handler', 'Could not restore user state after failed connection search', { userId: Number(userId), stateError });
    }
    user.state = 'ready';
    try {
      await api.sendMessage({
        chat_id: Number(userId),
        text: '⚠️ د ملګري لټون پیل نه شو. غوښتنه خوندي نه ده فعاله پاتې شوې؛ لږ وروسته بیا هڅه وکړه. که بیا تکرار شو، اډمین ته خبر ورکړه.'
      });
    } catch (notifyError) {
      reportDiagnostic('callback-handler', 'Could not notify user about connection search startup failure', { userId: Number(userId), notifyError });
    }
    return;
  }
  try { await tryOfferSearches(); } catch (error) {
    reportDiagnostic('callback-handler', 'Connection search matching failed after request creation', {
      userId: Number(userId), searchId: Number(search.id), type, error: error && (error.stack || error.message || String(error))
    });
    try {
      await api.sendMessage({
        chat_id: Number(userId),
        text: '⚠️ لټون پیل شو، خو د سیال لټولو پر مهال ستونزه وشوه. لږ وروسته بیا هڅه وکړه.'
      });
    } catch (notifyError) {
      reportDiagnostic('callback-handler', 'Could not notify user about matchmaking failure', { userId: Number(userId), notifyError });
    }
  }
  } catch (error) {
    reportDiagnostic('callback-handler', 'Connection search preflight failed', {
      userId: Number(userId), type, stage,
      error: error && (error.stack || error.message || String(error))
    });
    throw error;
  }
}
async function showConnectedPair(session) {
  const first = await getUser(session.first_user_telegram_id), second = await getUser(session.second_user_telegram_id);
  if (!first || !second) return;
  await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, Number(first.telegram_id))).run();
  await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, Number(second.telegram_id))).run();
  try { await api.sendMessage({ chat_id: Number(first.telegram_id), text: '✅ غوښتنه ومنل شوه! اړیکه وصل شوه.\n\n⭐ له غوښتونکي څخه د اړیکې قیمت کم شوی دی.' }); } catch (e) {}
  try { await api.sendMessage({ chat_id: Number(second.telegram_id), text: '✅ غوښتنه ومنل شوه! اړیکه وصل شوه.\n\nاوس کولای شئ یو بل ته پیغامونه واستوئ.' }); } catch (e) {}
  await showSessionProfile(session, Number(first.telegram_id));
  await showSessionProfile(session, Number(second.telegram_id));
  for (const user of [first, second]) {
    try {
      await api.sendMessage({
        chat_id: Number(user.telegram_id),
        text: '⌨️ د اړیکې چټک کنټرولونه:',
        reply_markup: styleKeyboardMarkup(sessionControlKeyboard(user))
      });
    } catch (keyboardError) {
      reportDiagnostic('callback-handler', 'Could not show connection reply keyboard', {
        sessionId: Number(session.id), userId: Number(user.telegram_id), keyboardError
      });
    }
  }
}
async function resolveUserGame(game) {
  // The caller must win the pending -> playing claim before any dice or balance work.
  if (!game || game.status !== 'playing' || !game.opponent_id) return;
  const player = await getUser(game.player_id), opponent = await getUser(game.opponent_id);
  if (!player || !opponent) {
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    for (const item of [player, opponent]) {
      if (item) try { await api.sendMessage({ chat_id: Number(item.telegram_id), text: '⚠️ ګېم لغوه شو، ځکه یو لوبغاړی نور موجود نه دی. فیس نه دی اخیستل شوی.' }); } catch (e) {}
    }
    return;
  }
  const fee = Number(game.fee_stars ?? await getSetting('game_fee_stars', 0.5));
  const winStars = Number(game.win_stars ?? await getSetting('game_min_stars', 3.5));
  const points = Number(game.points_award ?? await getSetting('game_win_points', 1));
  if (![fee, winStars, points].every(Number.isFinite) || fee < 0 || winStars <= 0 || fee >= winStars || points < 0 || !Number.isInteger(points)) {
    await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    const notice = '⚠️ د ګېم مالي تنظیمات ناسم دي؛ د ستورو حساب ونه شو. له اډمین سره اړیکه ونیسه.';
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: notice }); } catch (e) {}
    try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: notice }); } catch (e) {}
    return;
  }
  if (Number(player.stars || 0) < winStars || Number(opponent.stars || 0) < winStars) {
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د لوبې لپاره د یوه لوبغاړي بیلانس کافي نه دی.' }); } catch (e) {}
    try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: '⚠️ د لوبې لپاره د یوه لوبغاړي بیلانس کافي نه دی.' }); } catch (e) {}
    return;
  }
  let pDice, oDice;
  try {
    pDice = await api.sendDice({ chat_id: Number(player.telegram_id), emoji: '🎲' });
    oDice = await api.sendDice({ chat_id: Number(opponent.telegram_id), emoji: '🎲' });
  } catch (error) {
    // Dice delivery occurs before balance changes, so cancellation here is safe.
    reportDiagnostic('callback-handler', 'User game dice delivery failed before settlement', { gameId: game.id, error });
    try {
      await db.update(game_sessions)
        .set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing')))
        .run();
    } catch (stateError) {
      reportDiagnostic('callback-handler', 'Could not cancel game after dice delivery failure', { gameId: game.id, stateError });
    }
    const notice = '⚠️ د ګېم د تاس اچولو پر مهال تخنیکي ستونزه وه. ګېم لغوه شو؛ تر دې مرحلې فیس نه دی کم شوی. وروسته بیا هڅه وکړه.';
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: notice }); } catch (e) {}
    try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: notice }); } catch (e) {}
    return;
  }
  const playerBalance = Number(player.stars || 0), opponentBalance = Number(opponent.stars || 0);
  const pRoll = Number(pDice && pDice.dice && pDice.dice.value || 0), oRoll = Number(oDice && oDice.dice && oDice.dice.value || 0);
  if (![pRoll, oRoll].every(value => Number.isInteger(value) && value >= 1 && value <= 6)) {
    await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    const notice = '⚠️ د تاس پایله تایید نه شوه؛ د ستورو حساب ونه شو. له اډمین سره اړیکه ونیسه.';
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: notice }); } catch (e) {}
    try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: notice }); } catch (e) {}
    return;
  }
  let pFinal = playerBalance - fee, oFinal = opponentBalance - fee, result = '🤝 مساوي! دواړه یوازې د لوبې فیس ورکوي.';
  const playerPoints = Number(player.points || 0), opponentPoints = Number(opponent.points || 0);
  let playerPointsFinal = playerPoints, opponentPointsFinal = opponentPoints;
  if (pRoll > oRoll) {
    pFinal = playerBalance + winStars - fee; oFinal = opponentBalance - winStars;
    playerPointsFinal += points;
    result = '🏆 ' + (player.name || player.first_name || 'لومړي لوبغاړي') + ' وګټله؛ خالصه جایزه ' + (winStars - fee) + ' ستوري ده.';
  } else if (oRoll > pRoll) {
    oFinal = opponentBalance + winStars - fee; pFinal = playerBalance - winStars;
    opponentPointsFinal += points;
    result = '🏆 ' + (opponent.name || opponent.first_name || 'دویم لوبغاړي') + ' وګټله؛ خالصه جایزه ' + (winStars - fee) + ' ستوري ده.';
  }

  // Compare-and-set each balance so a concurrent admin adjustment or other update is never overwritten.
  let playerUpdate = await db.update(users).set({ stars: pFinal, points: playerPointsFinal })
    .where(and(
      eq(users.telegram_id, Number(player.telegram_id)),
      eq(users.stars, Number(player.stars || 0)),
      eq(users.points, playerPoints)
    )).returning({ telegram_id: users.telegram_id }).run();
  if (!playerUpdate || !Array.isArray(playerUpdate.rows) || playerUpdate.rows.length === 0) {
    // Verify persisted values: this adapter can apply UPDATE while omitting RETURNING rows.
    const persistedPlayer = await getUser(Number(player.telegram_id));
    const playerUpdateActuallyApplied = persistedPlayer &&
      Number(persistedPlayer.stars || 0) === pFinal &&
      Number(persistedPlayer.points || 0) === playerPointsFinal;
    if (!playerUpdateActuallyApplied) {
      await notifyRuntimeError('callback:game-player-balance-conflict', new Error('Player compare-and-set balance update did not persist expected values'), {
        gameId: Number(game.id), playerId: Number(player.telegram_id), opponentId: Number(opponent.telegram_id),
        expectedPlayerStars: Number(player.stars || 0), actualPlayerStars: persistedPlayer && persistedPlayer.stars,
        targetPlayerStars: pFinal, expectedPlayerPoints: playerPoints,
        actualPlayerPoints: persistedPlayer && persistedPlayer.points, targetPlayerPoints: playerPointsFinal,
        playerRoll: pRoll, opponentRoll: oRoll
      });
      await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
        .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
      const notice = '⚠️ د لوبې د ستورو حساب د بیلانس د اختلاف له امله ودرول شو؛ اډمین ته راپور واستول شو. له اډمین سره اړیکه ونیسه.';
      try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: notice }); } catch (e) {}
      try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: notice }); } catch (e) {}
      return;
    }
    playerUpdate = { rows: [{ telegram_id: Number(player.telegram_id) }] };
  }
  let opponentUpdate = null;
  try {
    opponentUpdate = await db.update(users).set({ stars: oFinal, points: opponentPointsFinal })
      .where(and(
        eq(users.telegram_id, Number(opponent.telegram_id)),
        eq(users.stars, Number(opponent.stars || 0)),
        eq(users.points, opponentPoints)
      )).returning({ telegram_id: users.telegram_id }).run();
    if (!opponentUpdate || !Array.isArray(opponentUpdate.rows) || opponentUpdate.rows.length === 0) {
      const persistedOpponent = await getUser(Number(opponent.telegram_id));
      if (persistedOpponent &&
          Number(persistedOpponent.stars || 0) === oFinal &&
          Number(persistedOpponent.points || 0) === opponentPointsFinal) {
        opponentUpdate = { rows: [{ telegram_id: Number(opponent.telegram_id) }] };
      }
    }
  } catch (opponentUpdateError) {
    reportDiagnostic('callback-handler', 'Opponent balance update failed during game settlement', { gameId: game.id, opponentId: opponent.telegram_id, opponentUpdateError });
  }
  if (!opponentUpdate || !Array.isArray(opponentUpdate.rows) || opponentUpdate.rows.length === 0) {
    const persistedOpponent = await getUser(Number(opponent.telegram_id));
    await notifyRuntimeError('callback:game-opponent-balance-conflict', new Error('Opponent compare-and-set balance update did not persist expected values'), {
      gameId: Number(game.id), playerId: Number(player.telegram_id), opponentId: Number(opponent.telegram_id),
      expectedOpponentStars: Number(opponent.stars || 0), actualOpponentStars: persistedOpponent && persistedOpponent.stars,
      targetOpponentStars: oFinal, expectedOpponentPoints: opponentPoints,
      actualOpponentPoints: persistedOpponent && persistedOpponent.points, targetOpponentPoints: opponentPointsFinal,
      playerRoll: pRoll, opponentRoll: oRoll
    });
    // Compensate only if the first balance still equals the value written by this settlement.
    try {
      await db.update(users).set({ stars: Number(player.stars || 0), points: playerPoints })
        .where(and(
          eq(users.telegram_id, Number(player.telegram_id)),
          eq(users.stars, pFinal),
          eq(users.points, playerPointsFinal)
        )).run();
    } catch (rollbackError) {
      reportDiagnostic('callback-handler', 'Could not compensate partial game settlement', { gameId: game.id, rollbackError });
    }
    await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    const notice = '⚠️ د یوه لوبغاړي بیلانس د تصفیې پر مهال بدل شو؛ حساب خوندي کولو لپاره ودرول شو. له اډمین سره اړیکه ونیسه.';
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: notice }); } catch (e) {}
    try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: notice }); } catch (e) {}
    return;
  }
  const completed = await db.update(game_sessions).set({ status: 'completed', player_roll: pRoll, opponent_roll: oRoll, updated_at: new Date().toISOString() })
    .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing')))
    .returning({ id: game_sessions.id }).run();
  if (!completed || !Array.isArray(completed.rows) || completed.rows.length === 0) {
    const persistedGame = await db.select().from(game_sessions).where(eq(game_sessions.id, Number(game.id))).get();
    if (!persistedGame || persistedGame.status !== 'completed') {
      await notifyRuntimeError('callback:game-completion-not-confirmed', new Error('Balance updates succeeded but game completion was not confirmed'), {
        gameId: Number(game.id), observedStatus: persistedGame && persistedGame.status,
        playerId: Number(player.telegram_id), opponentId: Number(opponent.telegram_id),
        playerStars: pFinal, opponentStars: oFinal, playerRoll: pRoll, opponentRoll: oRoll
      });
      await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
        .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
      const notice = '⚠️ د ستورو حساب وشو، خو د لوبې پایله تایید نه شوه؛ اډمین ته راپور واستول شو. له اډمین سره اړیکه ونیسه.';
      try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: notice }); } catch (e) {}
      try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: notice }); } catch (e) {}
      return;
    }
  }
  for (const pair of [{ id: Number(player.telegram_id), mine: pRoll, other: oRoll, balance: pFinal }, { id: Number(opponent.telegram_id), mine: oRoll, other: pRoll, balance: oFinal }]) {
    try { await api.sendMessage({ chat_id: pair.id, text: '🎲 د ګېم پایله\n\nستا 🎲: ' + pair.mine + '\n\nد سیال 🎲: ' + pair.other + '\n\n' + result + '\n\n⭐ اوسنی بیلانس: ' + pair.balance }); } catch (e) {}
  }
}
async function handleConnectionCallback(query, actor, data, actorId, chatId) {
  const p = data.split(':');
  if (p[1] === 'confirm') {
    const requestType = p[2] === 'find' ? 'find' : 'random';
    try {
      await startConnectionSearch(actorId, requestType);
    } catch (error) {
      reportDiagnostic('callback-handler', 'Connection confirmation handler failed before search startup completed', {
        actorId, requestType, callbackData: data,
        error: error && (error.stack || error.message || String(error))
      });
      try {
        await sendPrompt(chatId,
          '⚠️ د اړیکې غوښتنه پیل نه شوه، ځکه د لټون د چمتو کولو پر مهال ستونزه وشوه. ستوري باید لا نه وي کم شوي. لږ وروسته بیا هڅه وکړه.',
          mainKeyboard(actor, await isAdmin(actorId)), actor);
      } catch (notifyError) {
        reportDiagnostic('callback-handler', 'Could not show connection startup error to user', { actorId, notifyError });
        try {
          await api.sendMessage({
            chat_id: Number(chatId),
            text: '⚠️ د اړیکې غوښتنه پیل نه شوه. لږ وروسته بیا هڅه وکړه.'
          });
        } catch (fallbackError) {
          reportDiagnostic('callback-handler', 'Could not send fallback connection startup notice', { actorId, fallbackError });
        }
      }
    }
    return;
  }
  if (p[1] === 'cancel') {
    const rows = await db.select().from(connection_requests).where(eq(connection_requests.requester_id, actorId)).all();
    for (const row of rows.filter(item => ['searching', 'matching', 'pending'].includes(item.status))) {
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(row.id)), eq(connection_requests.status, row.status))).run();
    }
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
    actor.state = 'ready'; await showMain(chatId, actor, '❌ لټون لغوه شو.'); return;
  }
  if (p[1] === 'cancel_search') {
    // Cancel this user's own search/offers, and allow a recipient to dismiss an
    // incoming pending offer from the same button. Never cancel a connected session.
    const rows = await db.select().from(connection_requests).all();
    const notifyRequesters = new Set();
    let cancelledCount = 0;
    for (const row of rows.filter(item =>
      ['searching', 'matching', 'pending'].includes(item.status) &&
      ((Number(item.requester_id) === actorId) ||
       (item.status === 'pending' && Number(item.recipient_id) === actorId))
    )) {
      const cancelled = await db.update(connection_requests)
        .set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(
          eq(connection_requests.id, Number(row.id)),
          eq(connection_requests.status, row.status),
          ...(row.status === 'pending' && Number(row.recipient_id) === actorId
            ? [eq(connection_requests.recipient_id, actorId)]
            : [eq(connection_requests.requester_id, actorId)])
        ))
        .returning({ id: connection_requests.id }).run();
      let cancellationVerified = Boolean(cancelled && Array.isArray(cancelled.rows) && cancelled.rows.length > 0);
      if (!cancellationVerified) {
        const persistedCancellation = await db.select().from(connection_requests).where(eq(connection_requests.id, Number(row.id))).get();
        cancellationVerified = Boolean(persistedCancellation && persistedCancellation.status === 'cancelled');
      }
      if (!cancellationVerified) continue;
      cancelledCount++;
      if (row.status === 'pending' && Number(row.requester_id) !== actorId) {
        notifyRequesters.add(Number(row.requester_id));
      }
    }
    for (const requesterId of notifyRequesters) {
      try {
        await api.sendMessage({ chat_id: requesterId, text: '⌛ مقابل لوري د اړیکې غوښتنه لغوه کړه؛ د هغه غوښتنه نور فعاله نه ده.' });
      } catch (error) {
        console.warn('Could not notify requester after recipient cancelled offer', { actorId, requesterId, error });
      }
    }
    const remaining = await db.select().from(connection_requests).all();
    const stillActive = remaining.some(row =>
      ['searching', 'matching', 'pending'].includes(row.status) &&
      (Number(row.requester_id) === actorId || Number(row.recipient_id) === actorId)
    );
    if (!stillActive) {
      await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
      actor.state = 'ready';
    }
    try { await tryOfferSearches(); } catch (error) {
      reportDiagnostic('callback-handler', 'Could not restart connection matching after cancellation', { actorId, error });
    }
    await showMain(chatId, actor, cancelledCount
      ? '❌ لټون/غوښتنه لغوه شوه. اوس نوی لټون پیلولای شې.'
      : '⌛ فعاله غوښتنه ونه موندل شوه. اوس بیا لټون پیلولای شې.');
    return;
  }
  if (p[1] === 'reject' || p[1] === 'accept') {
    const offerId = Number(p[2]), rows = await db.select().from(connection_requests).all();
    const offer = rows.find(row => Number(row.id) === offerId && Number(row.recipient_id) === actorId && row.status === 'pending');
    if (!offer) {
      const observedOffer = rows.find(row => Number(row.id) === offerId);
      const terminalStatuses = ['cancelled', 'rejected', 'expired', 'accepted', 'connected'];
      if (observedOffer && terminalStatuses.includes(String(observedOffer.status || ''))) {
        const message = observedOffer.status === 'cancelled'
          ? '⌛ دا غوښتنه مخکې لغوه شوې ده؛ نور اقدام ته اړتیا نشته.'
          : observedOffer.status === 'rejected'
            ? '⌛ دا غوښتنه مخکې رد شوې ده.'
            : observedOffer.status === 'expired'
              ? '⌛ د دې غوښتنې وخت پای ته رسېدلی دی.'
              : '⌛ دا غوښتنه مخکې پروسس شوې ده.';
        await sendPrompt(chatId, message, mainKeyboard(actor, await isAdmin(actorId)), actor);
        return;
      }
      reportDiagnostic('callback-handler', 'Connection accept/reject callback did not find a pending offer', {
        offerId, actorId,
        observedStatus: observedOffer && observedOffer.status,
        observedRecipientId: observedOffer && Number(observedOffer.recipient_id),
        observedRequesterId: observedOffer && Number(observedOffer.requester_id),
        callbackAction: p[1]
      });
      await sendPrompt(chatId, '⌛ دا غوښتنه نوره فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    const search = rows.find(row => Number(row.requester_id) === Number(offer.requester_id) && row.status === 'searching' && !row.recipient_id);
    if (p[1] === 'reject') {
      const rejectedAt = new Date().toISOString();
      const rejected = await db.update(connection_requests).set({ status: 'rejected', updated_at: rejectedAt })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'pending'), eq(connection_requests.recipient_id, actorId)))
        .returning({ id: connection_requests.id }).run();
      let rejectionVerified = Boolean(rejected && Array.isArray(rejected.rows) && rejected.rows.length > 0);
      if (!rejectionVerified) {
        const persistedOffer = await db.select().from(connection_requests).where(eq(connection_requests.id, offerId)).get();
        rejectionVerified = Boolean(persistedOffer && persistedOffer.status === 'rejected' &&
          Number(persistedOffer.recipient_id) === actorId && String(persistedOffer.updated_at || '') === rejectedAt);
      }
      if (!rejectionVerified) {
        const latestOffer = await db.select().from(connection_requests).where(eq(connection_requests.id, offerId)).get();
        reportDiagnostic('callback-handler', 'Connection offer rejection could not be verified', {
          offerId, actorId, observedStatus: latestOffer && latestOffer.status,
          observedUpdatedAt: latestOffer && latestOffer.updated_at, rejectedAt
        });
        await sendPrompt(chatId, '⌛ دا غوښتنه نور فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor);
        return;
      }
      try { await tryOfferSearches(); } catch (error) { reportDiagnostic('callback-handler', 'Connection retry after rejection failed', { offerId: offerId, actorId: actorId, error: error }); }
      return;
    }
    if (!search) { await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, offerId)).run(); await sendPrompt(chatId, '⌛ د غوښتونکي لټون پای ته رسېدلی.', mainKeyboard(actor, await isAdmin(actorId)), actor); return; }
    const requester = await getUser(offer.requester_id), cost = Number(await getSetting('connection_cost_stars', 1));
    if (requester && await blockedPair(Number(requester.telegram_id), actorId)) {
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'pending'))).run();
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'searching'))).run();
      const notice = '⚠️ د دواړو کارنانو ترمنځ بلاک موجود دی؛ اړیکه نه شي جوړېدای.';
      try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: notice }); } catch (e) {}
      await sendPrompt(chatId, notice, mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'pending'))).run();
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'searching'))).run();
      const notice = '⚠️ د اړیکې د ستورو تنظیم ناسم دی؛ اړیکه جوړه نه شوه. له اډمین سره اړیکه ونیسه.';
      try { await api.sendMessage({ chat_id: Number(offer.requester_id), text: notice }); } catch (e) {}
      await sendPrompt(chatId, notice, mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    if (!requester || Number(requester.stars || 0) < cost) {
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, offerId)).run();
      if (requester) try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: '⚠️ د اړیکې لپاره ستوري نور کافي نه دي. لټون پای ته ورسېد.' }); } catch (e) {}
      try { await tryOfferSearches(); } catch (error) { reportDiagnostic('callback-handler', 'Connection retry after insufficient balance failed', { offerId: offerId, actorId: actorId, error: error }); }
      return;
    }
    const activeGames = await db.select().from(game_sessions).all();
    const gameConflict = activeGames.some(row => ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
      (Number(row.player_id) === Number(requester.telegram_id) || Number(row.opponent_id) === Number(requester.telegram_id) ||
       Number(row.player_id) === actorId || Number(row.opponent_id) === actorId));
    if (gameConflict) {
      await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'pending'))).run();
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'searching'))).run();
      await sendPrompt(chatId, '⚠️ د غوښتونکي یا ستا ګېم لا فعال دی. دا د اړیکې غوښتنه بنده شوه؛ د ګېم تر پای وروسته بیا هڅه وکړه.', mainKeyboard(actor, await isAdmin(actorId)), actor);
      try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: '⚠️ د ګېم د فعال حالت له امله د اړیکې لټون لغوه شو. د ګېم تر پای وروسته بیا هڅه وکړه.' }); } catch (e) {}
      return;
    }
    const requesterSession = await activeSessionFor(requester.telegram_id);
    const recipientSession = await activeSessionFor(actorId);
    if (requesterSession || recipientSession) {
      await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'pending'))).run();
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'searching'))).run();
      const notice = '⚠️ یو کارن لا له بل چا سره په فعاله اړیکه کې دی؛ نوې اړیکه نه ده جوړه شوې. د اوسنۍ اړیکې تر ختمېدو وروسته بیا هڅه وکړه.';
      try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: notice }); } catch (e) {}
      await sendPrompt(chatId, notice, mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    const offerClaimAt = new Date().toISOString();
    const offerClaim = await db.update(connection_requests).set({ status: 'matching', updated_at: offerClaimAt })
      .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'pending'), eq(connection_requests.recipient_id, actorId)))
      .returning({ id: connection_requests.id }).run();
    let offerClaimVerified = Boolean(offerClaim && Array.isArray(offerClaim.rows) && offerClaim.rows.length > 0);
    if (!offerClaimVerified) {
      const persistedOffer = await db.select().from(connection_requests).where(eq(connection_requests.id, offerId)).get();
      offerClaimVerified = Boolean(persistedOffer && persistedOffer.status === 'matching' &&
        Number(persistedOffer.recipient_id) === actorId && String(persistedOffer.updated_at || '') === offerClaimAt);
    }
    if (!offerClaimVerified) {
      const latestOffer = await db.select().from(connection_requests).where(eq(connection_requests.id, offerId)).get();
      reportDiagnostic('callback-handler', 'Connection offer claim could not be verified', {
        offerId, actorId, observedStatus: latestOffer && latestOffer.status,
        observedUpdatedAt: latestOffer && latestOffer.updated_at, offerClaimAt
      });
      await sendPrompt(chatId, '⌛ دا غوښتنه نور فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    const searchClaimAt = new Date().toISOString();
    const searchClaim = await db.update(connection_requests).set({ status: 'connected', updated_at: searchClaimAt })
      .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'searching'), eq(connection_requests.requester_id, Number(requester.telegram_id))))
      .returning({ id: connection_requests.id }).run();
    let searchClaimVerified = Boolean(searchClaim && Array.isArray(searchClaim.rows) && searchClaim.rows.length > 0);
    if (!searchClaimVerified) {
      const persistedSearch = await db.select().from(connection_requests).where(eq(connection_requests.id, Number(search.id))).get();
      searchClaimVerified = Boolean(persistedSearch && persistedSearch.status === 'connected' &&
        Number(persistedSearch.requester_id) === Number(requester.telegram_id) &&
        String(persistedSearch.updated_at || '') === searchClaimAt);
    }
    if (!searchClaimVerified) {
      const latestSearch = await db.select().from(connection_requests).where(eq(connection_requests.id, Number(search.id))).get();
      reportDiagnostic('callback-handler', 'Connection source search claim could not be verified', {
        offerId, searchId: Number(search.id), actorId,
        observedStatus: latestSearch && latestSearch.status,
        observedUpdatedAt: latestSearch && latestSearch.updated_at, searchClaimAt
      });
      await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'matching'))).run();
      await sendPrompt(chatId, '⌛ د غوښتونکي لټون پای ته رسېدلی؛ دا غوښتنه نوره فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    let debited = null, debitError = null;
    const debitAt = new Date().toISOString();
    const expectedBalanceAfterDebit = Number(requester.stars || 0) - cost;
    try {
      debited = await db.update(users).set({
        stars: expectedBalanceAfterDebit,
        state: 'ready',
        last_active_at: debitAt
      })
        .where(and(eq(users.telegram_id, Number(requester.telegram_id)), eq(users.stars, Number(requester.stars || 0))))
        .returning({ telegram_id: users.telegram_id }).run();
    } catch (error) {
      debitError = error;
      reportDiagnostic('callback-handler', 'Connection requester debit returned an error; verifying persisted balance before deciding', {
        offerId, requesterId: requester.telegram_id, debitAt, error
      });
    }
    let debitVerified = Boolean(debited && Array.isArray(debited.rows) && debited.rows.length > 0);
    if (!debitVerified) {
      // Serverless DB adapters may commit an UPDATE but return no usable RETURNING rows.
      // Verify this exact debit using its timestamp marker before treating it as a failure.
      const persistedRequester = await getUser(Number(requester.telegram_id));
      debitVerified = Boolean(persistedRequester &&
        Number(persistedRequester.stars) === expectedBalanceAfterDebit &&
        persistedRequester.state === 'ready' &&
        String(persistedRequester.last_active_at || '') === debitAt);
      if (debitVerified) {
        console.info('Verified connection requester debit after empty RETURNING/error result', {
          offerId, requesterId: Number(requester.telegram_id), debitAt
        });
      }
    }
    if (!debitVerified) {
      const persistedRequester = await getUser(Number(requester.telegram_id));
      reportDiagnostic('callback-handler', 'Connection requester debit could not be verified; connection acceptance aborted', {
        offerId, requesterId: Number(requester.telegram_id),
        expectedBalanceAfterDebit,
        observedBalance: persistedRequester && Number(persistedRequester.stars),
        observedState: persistedRequester && persistedRequester.state,
        observedLastActiveAt: persistedRequester && persistedRequester.last_active_at,
        debitAt, debitError
      });
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'connected'))).run();
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'matching'))).run();
      const notice = '⚠️ د ستورو د کمولو عملیات تایید نه شول؛ اړیکه جوړه نه شوه. که ستوري کم شوي وي، له اډمین سره اړیکه ونیسه.';
      try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: notice }); } catch (e) {}
      await sendPrompt(chatId, notice, mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    // Recheck after the debit: another callback may have connected either user while this request was being accepted.
    const racedRequesterSession = await activeSessionFor(Number(requester.telegram_id));
    const racedRecipientSession = await activeSessionFor(actorId);
    if (racedRequesterSession || racedRecipientSession) {
      let refunded = false;
      try {
        const refund = await db.update(users).set({ stars: Number(requester.stars || 0), state: 'ready' })
          .where(and(
            eq(users.telegram_id, Number(requester.telegram_id)),
            eq(users.stars, Number(requester.stars || 0) - cost)
          )).returning({ telegram_id: users.telegram_id }).run();
        refunded = Boolean(refund && Array.isArray(refund.rows) && refund.rows.length > 0);
      } catch (refundError) {
        reportDiagnostic('callback-handler', 'Could not refund connection request after session race', { offerId, requesterId: requester.telegram_id, refundError });
      }
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'connected'))).run();
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'matching'))).run();
      const notice = refunded
        ? '⚠️ بلې اړیکې مخکې وصل شو؛ دا غوښتنه لغوه شوه او ستوري بېرته ستانه شول.'
        : '⚠️ بلې اړیکې مخکې وصل شو؛ دا غوښتنه لغوه شوه، خو د ستورو د بېرته ستنولو حالت تایید نه شو. له اډمین سره اړیکه ونیسه.';
      try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: notice }); } catch (e) {}
      await sendPrompt(chatId, notice, mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    await db.update(connection_requests).set({ status: 'accepted', updated_at: new Date().toISOString() })
      .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'matching'))).run();
    const now = new Date().toISOString();
    let sessionPersisted = false;
    let sessionInsertError = null;
    try {
      const createdSession = await db.insert(chat_sessions).values({
        first_user_telegram_id: Number(requester.telegram_id), second_user_telegram_id: actorId, status: 'connected',
        created_at: now, connected_at: now, last_activity_at: now, ended_at: null, end_reason: null
      }).returning({ id: chat_sessions.id }).run();
      sessionPersisted = Boolean(createdSession && Array.isArray(createdSession.rows) && createdSession.rows.length > 0);
    } catch (error) {
      sessionInsertError = error;
      reportDiagnostic('callback-handler', 'Connection session insert returned an error; verifying persisted session before refund', {
        offerId, searchId: search.id, requesterId: requester.telegram_id, actorId, now, error
      });
    }
    // Some serverless DB adapters commit INSERT but return no usable RETURNING row.
    // Never refund based only on the insert result: verify the exact persisted session.
    if (!sessionPersisted) {
      try {
        const persistedSessions = await db.select().from(chat_sessions).all();
        sessionPersisted = persistedSessions.some(row =>
          Number(row.first_user_telegram_id) === Number(requester.telegram_id) &&
          Number(row.second_user_telegram_id) === actorId &&
          row.status === 'connected' &&
          String(row.created_at || '') === now &&
          String(row.connected_at || '') === now &&
          String(row.last_activity_at || '') === now
        );
      } catch (verifyError) {
        reportDiagnostic('callback-handler', 'Could not verify connection session after insert result', {
          offerId, searchId: search.id, requesterId: requester.telegram_id, actorId, now,
          sessionInsertError, verifyError
        });
      }
    }
    if (!sessionPersisted) {
      reportDiagnostic('callback-handler', 'Could not create or verify connection session after requester debit', {
        offerId, searchId: search.id, requesterId: requester.telegram_id, actorId, now, sessionInsertError
      });
      // Compensating refund is compare-and-set guarded and independently verified.
      // The timestamp marker prevents this refund from overwriting a newer user update.
      let refunded = false;
      const refundAt = new Date().toISOString();
      try {
        await db.update(users).set({
          stars: Number(requester.stars || 0),
          state: 'ready',
          last_active_at: refundAt
        }).where(and(
          eq(users.telegram_id, Number(requester.telegram_id)),
          eq(users.stars, expectedBalanceAfterDebit),
          eq(users.last_active_at, debitAt)
        )).returning({ telegram_id: users.telegram_id }).run();
      } catch (refundError) {
        reportDiagnostic('callback-handler', 'Connection request refund update returned an error; verifying persisted balance', {
          offerId, requesterId: requester.telegram_id, refundAt, refundError
        });
      }
      try {
        const persistedRequester = await getUser(Number(requester.telegram_id));
        refunded = Boolean(persistedRequester &&
          Number(persistedRequester.stars) === Number(requester.stars || 0) &&
          persistedRequester.state === 'ready' &&
          String(persistedRequester.last_active_at || '') === refundAt);
      } catch (verifyRefundError) {
        reportDiagnostic('callback-handler', 'Could not verify connection request refund', {
          offerId, requesterId: requester.telegram_id, refundAt, verifyRefundError
        });
      }
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'connected'))).run();
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, offerId), eq(connection_requests.status, 'accepted'))).run();
      await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
      const notice = refunded
        ? '⚠️ اړیکه د تخنیکي ستونزې له امله جوړه نه شوه؛ ستوري بېرته ستانه شول. بیا هڅه وکړه.'
        : '⚠️ اړیکه جوړه نه شوه او د ستورو د بېرته ستنولو حالت تایید نه شو. مهرباني وکړه له اډمین سره اړیکه ونیسه.';
      try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: notice }); } catch (e) {}
      await sendPrompt(chatId, notice, mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    // Only after the new session is persisted, cancel any other active requests involving either participant.
    const participantIds = new Set([Number(requester.telegram_id), actorId]);
    for (const row of rows.filter(item =>
      Number(item.id) !== offerId && Number(item.id) !== Number(search.id) &&
      ['searching', 'matching', 'pending'].includes(item.status) &&
      (participantIds.has(Number(item.requester_id)) || participantIds.has(Number(item.recipient_id)))
    )) {
      const cancelledOther = await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(row.id)), eq(connection_requests.status, row.status)))
        .returning({ id: connection_requests.id }).run();
      if (!cancelledOther || !Array.isArray(cancelledOther.rows) || cancelledOther.rows.length === 0) continue;
      const externalParty = participantIds.has(Number(row.requester_id)) ? Number(row.recipient_id || 0) : Number(row.requester_id || 0);
      if (externalParty > 0 && !participantIds.has(externalParty)) {
        try { await api.sendMessage({ chat_id: externalParty, text: '⌛ دا د اړیکې غوښتنه لغوه شوه، ځکه یو ګډونوال له بل کس سره وصل شو.' }); } catch (e) {}
      }
    }
    const sessions = await db.select().from(chat_sessions).all();
    const session = sessions.filter(row => row.status === 'connected' && ((Number(row.first_user_telegram_id) === Number(requester.telegram_id) && Number(row.second_user_telegram_id) === actorId) || (Number(row.first_user_telegram_id) === actorId && Number(row.second_user_telegram_id) === Number(requester.telegram_id)))).sort((a,b)=>Number(b.id)-Number(a.id))[0];
    actor.state = 'ready'; await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
    await showConnectedPair(session);
    return;
  }
}
async function handleFindCallback(query, actor, data, actorId, chatId) {
  const p = data.split(':');
  if (p[1] === 'cancel') { await showMain(chatId, actor, '❌ لغوه شو.'); return; }
  if (p[1] === 'gender') {
    if (!['male','female','auto'].includes(p[2])) return;
    await db.update(users).set({ search_gender: p[2], state: 'find_choose_language' }).where(eq(users.telegram_id, actorId)).run();
    actor.search_gender = p[2]; actor.state = 'find_choose_language';
    await sendPrompt(chatId, '🌐 د کومې ژبې ملګری غواړې؟', { inline_keyboard: [[{ text: 'پښتو', callback_data: 'find:language:ps' }, { text: 'دري', callback_data: 'find:language:fa' }], [{ text: 'English', callback_data: 'find:language:en' }, { text: 'اردو', callback_data: 'find:language:ur' }], [{ text: 'العربية', callback_data: 'find:language:ar' }], [{ text: '🌐 اتومات', callback_data: 'find:language:auto' }], [{ text: '❌ لغوه', callback_data: 'find:cancel' }]] }, actor); return;
  }
  if (p[1] === 'language') {
    if (!['ps','fa','en','ur','ar','auto'].includes(p[2])) return;
    await db.update(users).set({ search_language: p[2], state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
    actor.search_language = p[2]; actor.state = 'ready';
    const cost = Number(await getSetting('connection_cost_stars', 1));
    if (Number(actor.stars || 0) < cost) { await sendPrompt(chatId, '⭐ د ملګري لټون لپاره ' + cost + ' ستوري پکار دي. ستا بیلانس: ' + Number(actor.stars || 0), mainKeyboard(actor, await isAdmin(actorId)), actor); return; }
    const gender = actor.search_gender === 'male' ? 'نارینه' : actor.search_gender === 'female' ? 'ښځینه' : 'اتومات';
    const language = p[2] === 'auto' ? 'اتومات' : (LANGUAGES.find(item => item.code === p[2]) || {}).label || p[2];
    await sendPrompt(chatId, '🔎 د ملګري لټون تایید کړه.\n\n👤 جنسیت: ' + gender + '\n\n🌐 ژبه: ' + language + '\n\n⭐ د اړیکې پر منلو به ' + cost + ' ستوری کم شي.', { inline_keyboard: [[{ text: '✅ تایید او لټون پیلول', callback_data: 'conn:confirm:find' }, { text: '❌ لغوه', callback_data: 'conn:cancel' }]] }, actor); return;
  }
}
async function adjustUserLikes(targetId, delta) {
  // Keep reward/admin-adjusted likes while applying one actual like/unlike.
  // Compare-and-set avoids overwriting a concurrent reward or admin adjustment.
  for (let attempt = 0; attempt < 4; attempt++) {
    const latest = await getUser(targetId);
    if (!latest) return false;
    const current = Number(latest.likes || 0);
    if (!Number.isFinite(current)) return false;
    const next = Math.max(0, current + delta);
    const updated = await db.update(users).set({ likes: next })
      .where(and(
        eq(users.telegram_id, Number(targetId)),
        eq(users.likes, current)
      ))
      .returning({ telegram_id: users.telegram_id }).run();
    if (updated && Array.isArray(updated.rows) && updated.rows.length > 0) return true;
    // A successful write may still return an empty RETURNING result in this runtime.
    // Read immediately before retrying, or one click could increment/decrement repeatedly.
    const persisted = await getUser(targetId);
    if (persisted && Number(persisted.likes || 0) === next) return true;
    if (!persisted) return false;
  }
  reportDiagnostic('callback-handler', 'Could not update likes counter after concurrent changes', { targetId, delta });
  return false;
}

async function handleSessionCallback(query, actor, data, actorId, chatId) {
  const p = data.split(':'), action = p[1], targetId = Number(p[2]), sessionId = Number(p[p.length - 1]);
  if (action === 'end') {
    const id = Number(p[2]), session = await db.select().from(chat_sessions).where(eq(chat_sessions.id, id)).get();
    if (session && session.status === 'connected' && (Number(session.first_user_telegram_id) === actorId || Number(session.second_user_telegram_id) === actorId)) await endConnection(session, 'user_ended');
    return;
  }
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return;
  const target = await getUser(targetId);
  if (!target) return;
  if (targetId === actorId && ['follow', 'like', 'rate'].includes(action)) {
    await sendPrompt(chatId, '⚠️ دا عمل پر خپل پروفایل نه شي ترسره کېدای.', mainKeyboard(actor, await isAdmin(actorId)), actor);
    return;
  }
  if (action === 'follow') {
    const rows = await db.select().from(favorites).where(eq(favorites.user_telegram_id, actorId)).all();
    if (!rows.some(row => Number(row.favorite_telegram_id) === targetId)) await db.insert(favorites).values({ user_telegram_id: actorId, favorite_telegram_id: targetId, created_at: new Date().toISOString() }).run();
    const session = await db.select().from(chat_sessions).where(eq(chat_sessions.id, sessionId)).get();
    if (session && session.status === 'connected') await showSessionProfile(session, actorId);
    else await sendPrompt(chatId, '❤️ کارن فالو شو.\n\n' + await publicProfileText(target, actorId), mainKeyboard(actor, await isAdmin(actorId)), actor);
    return;
  }
  if (action === 'like') {
    const rows = await db.select().from(user_likes).where(eq(user_likes.liker_id, actorId)).all();
    const existing = rows.filter(row => Number(row.liked_id) === targetId);
    if (existing.length) {
      for (const row of existing) {
        await db.delete(user_likes).where(eq(user_likes.id, Number(row.id))).run();
      }
      await adjustUserLikes(targetId, -1);
    } else {
      await db.insert(user_likes).values({ liker_id: actorId, liked_id: targetId, created_at: new Date().toISOString() }).run();
      await adjustUserLikes(targetId, 1);
    }
    const session = await db.select().from(chat_sessions).where(eq(chat_sessions.id, sessionId)).get();
    if (session && session.status === 'connected') await showSessionProfile(session, actorId);
    return;
  }
  if (action === 'rate') {
    const rating = Number(p[3]);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
    const ratingSession = await db.select().from(chat_sessions).where(eq(chat_sessions.id, sessionId)).get();
    const sessionParticipants = ratingSession
      ? [Number(ratingSession.first_user_telegram_id), Number(ratingSession.second_user_telegram_id)]
      : [];
    if (!ratingSession || ratingSession.status !== 'ended' ||
        !sessionParticipants.includes(actorId) || !sessionParticipants.includes(targetId) || targetId === actorId) {
      await sendPrompt(chatId, '⚠️ د نمرو ورکولو لپاره باید همدا ستا له تېر ملګري سره پای ته رسېدلې اړیکه وي.', mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    const allRatings = await db.select().from(user_ratings).all();
    const thisSessionRating = allRatings.some(row =>
      Number(row.session_id) === sessionId &&
      Number(row.rater_id) === actorId &&
      Number(row.rated_id) === targetId
    );
    if (thisSessionRating) {
      await sendPrompt(chatId, '⭐ په دې اړیکه کې دې مخکې نمره ورکړې ده.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
    }
    const alreadyGiven = allRatings
      .filter(row => Number(row.rater_id) === actorId && Number(row.rated_id) === targetId)
      .reduce((sum, row) => sum + Math.max(0, Number(row.rating) || 0), 0);
    const remaining = Math.max(0, 5 - alreadyGiven);
    if (remaining < 1 || rating > remaining) {
      await sendPrompt(chatId, remaining > 0
        ? '⚠️ دې کارن ته ټولټال یوازې ' + remaining + ' نمرې نورې ورکولای شې.'
        : '⭐ دې کارن ته دې د ټول عمر ۵ نمرې پوره کړې دي؛ نورې نمرې نه شې ورکولای.',
        mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    await db.insert(user_ratings).values({ session_id: sessionId, rater_id: actorId, rated_id: targetId, rating, created_at: new Date().toISOString() }).run();
    await db.update(users).set({ points: Number(target.points || 0) + rating }).where(eq(users.telegram_id, targetId)).run();
    await sendPrompt(chatId, '✅ ' + rating + ' نمرې دې کارن ته ورکړې. دې کارن ته دې ټولټال ' + (alreadyGiven + rating) + ' له ۵ نمرې ورکړې دي.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
  }
  if (action === 'profile') {
    const session = await db.select().from(chat_sessions).where(eq(chat_sessions.id, sessionId)).get();
    if (session && session.status === 'connected') await showSessionProfile(session, actorId);
    else await sendPrompt(chatId, await publicProfileText(target, actorId), mainKeyboard(actor, await isAdmin(actorId)), actor);
    return;
  }
  if (action === 'delete_recent') {
    const cutoff = Date.now() - 10 * 60000, rows = await db.select().from(chat_messages).all();
    let deleted = 0;
    for (const row of rows.filter(item => Number(item.sender_id) === targetId && Number(item.recipient_id) === actorId && Number(item.session_id) === sessionId && Date.parse(item.created_at || '') >= cutoff && Number(item.recipient_message_id) > 0)) {
      let wasDeleted = false;
      try {
        await api.deleteMessage({ chat_id: actorId, message_id: Number(row.recipient_message_id) });
        wasDeleted = true;
        deleted += 1;
      } catch (e) {}
      // Keep the Telegram message ID if deletion failed, so the database does not claim it was removed.
      if (wasDeleted) await db.update(chat_messages).set({ recipient_message_id: 0 }).where(eq(chat_messages.id, Number(row.id))).run();
    }
    await sendPrompt(chatId, '🗑 د وروستیو ۱۰ دقیقو د ملګري ' + deleted + ' لېږل شوي پیغامونه حذف شول. د Telegram د محدودیت له امله د کارن خپل اصلي پیغامونه نه حذف کېږي.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
  }
}
async function handleGameCallback(query, actor, data, actorId, chatId) {
  const p = data.split(':'), action = p[1], gameId = Number(p[2]);
  let rows = await db.select().from(game_sessions).all(), game = rows.find(row => Number(row.id) === gameId);
  if (action === 'cancel') {
    // The cancel button is handled before the general callback expiry pass.
    // Expire this user's stale game here too, then re-read persisted state.
    try { await expireUserTimedActions(actorId); }
    catch (error) { await notifyRuntimeError('callback:expire-before-game-cancel', error, { userId: actorId, gameId }); }
    rows = await db.select().from(game_sessions).all();
    game = rows.find(row => Number(row.id) === gameId);
    // Cancel only this user's own waiting/pending games, and only if the status
    // has not changed since we read it. Never cancel a game already in settlement.
    let cancelledCount = 0;
    const notifiedOpponents = new Set();
    // Re-read twice to catch a waiting -> pending transition racing this cancel.
    for (let pass = 0; pass < 2; pass++) {
      const currentRows = pass === 0 ? rows : await db.select().from(game_sessions).all();
      for (const row of currentRows.filter(item =>
        Number(item.player_id) === actorId && ['waiting', 'pending'].includes(item.status)
      )) {
        const cancelled = await db.update(game_sessions)
          .set({ status: 'cancelled', updated_at: new Date().toISOString() })
          .where(and(
            eq(game_sessions.id, Number(row.id)),
            eq(game_sessions.player_id, actorId),
            eq(game_sessions.status, row.status)
          ))
          .returning({ id: game_sessions.id }).run();
        if (!cancelled || !Array.isArray(cancelled.rows) || cancelled.rows.length === 0) continue;
        cancelledCount++;
        if (row.status === 'pending' && Number(row.opponent_id) > 0) {
          notifiedOpponents.add(Number(row.opponent_id));
        }
      }
    }
    for (const opponentId of notifiedOpponents) {
      try {
        await api.sendMessage({
          chat_id: opponentId,
          text: '⌛ د ګېم غوښتونکی خپله غوښتنه لغوه کړه. دا ګېم نور فعال نه دی.'
        });
      } catch (error) {
        reportDiagnostic('callback-handler', 'Could not notify opponent about cancelled game', { actorId, opponentId, error });
      }
    }
    const latestRows = await db.select().from(game_sessions).all();
    const stillPlaying = latestRows.some(row =>
      Number(row.player_id) === actorId && row.status === 'playing'
    );
    const stillPending = latestRows.some(row =>
      Number(row.player_id) === actorId && ['waiting', 'pending'].includes(row.status)
    );
    if (stillPlaying) {
      await showMain(chatId, actor, '⚠️ ګېم لا پیل شوی دی؛ د خوندیتوب لپاره یې له دې تڼۍ لغوه کول نه شو کولای.');
    } else if (stillPending) {
      await showMain(chatId, actor, '⚠️ د ګېم غوښتنه لا فعاله ده. لږ شېبه وروسته بیا د لغوه کولو هڅه وکړه.');
    } else if (cancelledCount > 0) {
      await showMain(chatId, actor, '❌ ګېم لغوه شو. اوس نوی ګېم پیل کولای شې.');
    } else {
      await showMain(chatId, actor, '⌛ ستا لپاره فعاله ګېم غوښتنه ونه موندل شوه. اوس نوی ګېم پیل کولای شې.');
    }
    return;
  }
  if (!game || !['waiting','pending'].includes(game.status)) { await sendPrompt(chatId, '⌛ دا ګېم نور فعال نه دی.', mainKeyboard(actor, await isAdmin(actorId)), actor); return; }
  // An old pending offer must not be accepted after its matchmaking window expires.
  if (game.status === 'pending') {
    const waitSeconds = Math.max(1, Number(await getSetting('game_wait_seconds', 120)) || 120);
    const offerAge = Date.now() - Date.parse(game.updated_at || game.created_at || '');
    if (!Number.isFinite(offerAge) || offerAge >= waitSeconds * 1000) {
      const expired = await db.update(game_sessions)
        .set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(game_sessions.id, gameId), eq(game_sessions.status, 'pending'), eq(game_sessions.opponent_id, Number(game.opponent_id))))
        .returning({ id: game_sessions.id }).run();
      if (expired && Array.isArray(expired.rows) && expired.rows.length > 0) {
        for (const targetId of [Number(game.player_id), Number(game.opponent_id)]) {
          if (!targetId) continue;
          try { await api.sendMessage({ chat_id: targetId, text: '⌛ د ګېم غوښتنې وخت پای ته رسېدلی؛ دا ګېم نور فعال نه دی. نوې غوښتنه پیلولای شې.' }); } catch (e) {}
        }
      }
      await sendPrompt(chatId, '⌛ د دې ګېم وخت پای ته رسېدلی یا ګېم نور فعال نه دی.', mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
  }
  if (action === 'reject' && Number(game.opponent_id) === actorId) {
    const rejectedAt = new Date().toISOString();
    const rejected = await db.update(game_sessions).set({ status: 'rejected', updated_at: rejectedAt })
      .where(and(eq(game_sessions.id, gameId), eq(game_sessions.status, 'pending'), eq(game_sessions.opponent_id, actorId)))
      .returning({ id: game_sessions.id }).run();
    let rejectionVerified = Boolean(rejected && Array.isArray(rejected.rows) && rejected.rows.length > 0);
    if (!rejectionVerified) {
      const persistedGame = await db.select().from(game_sessions).where(eq(game_sessions.id, gameId)).get();
      rejectionVerified = Boolean(persistedGame && persistedGame.status === 'rejected' &&
        Number(persistedGame.opponent_id) === actorId && String(persistedGame.updated_at || '') === rejectedAt);
    }
    if (!rejectionVerified) {
      const latestGame = await db.select().from(game_sessions).where(eq(game_sessions.id, gameId)).get();
      reportDiagnostic('callback-handler', 'Game rejection could not be verified', {
        gameId, actorId, observedStatus: latestGame && latestGame.status,
        observedUpdatedAt: latestGame && latestGame.updated_at, rejectedAt
      });
      await sendPrompt(chatId, '⌛ دا ګېم نور فعال نه دی؛ ښايي مخکې منل شوی یا لغوه شوی وي.', mainKeyboard(actor, await isAdmin(actorId)), actor);
      return;
    }
    const latestGames = await db.select().from(game_sessions).all();
     const latestRequests = await db.select().from(connection_requests).all();
     const playerId = Number(game.player_id);
     const hasOtherActiveGame = latestGames.some(row => Number(row.id) !== gameId &&
       ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
       (Number(row.player_id) === playerId || Number(row.opponent_id) === playerId));
     const hasConnectionActivity = latestRequests.some(row =>
       ['searching', 'pending', 'matching'].includes(row.status) &&
       (Number(row.requester_id) === playerId || Number(row.recipient_id) === playerId));
     const player = await getUser(game.player_id);
     if (!hasOtherActiveGame && !hasConnectionActivity) {
       await db.insert(game_sessions).values({
         player_id: playerId, opponent_id: null, status: 'waiting',
         created_at: rejectedAt, updated_at: rejectedAt,
         fee_stars: Number(game.fee_stars ?? await getSetting('game_fee_stars', 0.5)),
         win_stars: Number(game.win_stars ?? await getSetting('game_min_stars', 3.5)),
         points_award: Number(game.points_award ?? await getSetting('game_win_points', 1))
       }).run();
       if (player) await sendPrompt(Number(player.telegram_id), '❌ سیال غوښتنه رد کړه؛ د بل سیال لټون روان دی.\\n\\nکه غواړې، لټون لغوه کولای شې.', { inline_keyboard: [[{ text: '❌ ګېم لغوه کول', callback_data: 'game:cancel' }]] }, player);
     } else if (player) {
       await sendPrompt(Number(player.telegram_id), '❌ سیال غوښتنه رد کړه؛ خو ستا بله اړیکه یا ګېم لا فعال دی، نو نوی ګېم ونه جوړ شو.', mainKeyboard(player, await isAdmin(playerId)), player);
     }
     await sendPrompt(chatId, '❌ د ګېم غوښتنه رد شوه.', mainKeyboard(actor, await isAdmin(actorId)), actor);
    try { await tryMatchGames(); } catch (error) { reportDiagnostic('callback-handler', 'Game rematch after rejection failed', { gameId: gameId, actorId: actorId, error: error }); }
    return;
  }
  if (action === 'accept' && Number(game.opponent_id) === actorId) {
    try {
      const connectionRequests = await db.select().from(connection_requests).all();
      const latestGames = await db.select().from(game_sessions).all();
      const activeSessionForPlayer = await activeSessionFor(Number(game.player_id));
      const activeSessionForOpponent = await activeSessionFor(actorId);
      const hasConnectionRequest = connectionRequests.some(row => ['searching', 'pending', 'matching'].includes(row.status) &&
        (Number(row.requester_id) === Number(game.player_id) || Number(row.recipient_id) === Number(game.player_id) ||
         Number(row.requester_id) === actorId || Number(row.recipient_id) === actorId));
      const hasOtherActiveGame = latestGames.some(row => Number(row.id) !== gameId &&
        ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
        (Number(row.player_id) === Number(game.player_id) || Number(row.opponent_id) === Number(game.player_id) ||
         Number(row.player_id) === actorId || Number(row.opponent_id) === actorId));
      const pairBlocked = await blockedPair(Number(game.player_id), actorId);
      if (activeSessionForPlayer || activeSessionForOpponent || hasConnectionRequest || hasOtherActiveGame || pairBlocked) {
        const cancelled = await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
          .where(and(eq(game_sessions.id, gameId), eq(game_sessions.status, 'pending'), eq(game_sessions.opponent_id, actorId)))
          .returning({ id: game_sessions.id }).run();
        if (!cancelled || !Array.isArray(cancelled.rows) || cancelled.rows.length === 0) {
          await sendPrompt(chatId, '⌛ د ګېم حالت د کتنې پر مهال بدل شو؛ غوښتنه په خپله لغوه نه شوه. مهرباني وکړه حالت تازه وګوره.', mainKeyboard(actor, await isAdmin(actorId)), actor);
          return;
        }
        const notice = pairBlocked
          ? '⚠️ د دواړو لوبغاړو ترمنځ بلاک موجود دی؛ ګېم لغوه شو. بیا هڅه وکړه.'
          : '⚠️ یو لوبغاړی د بلې اړیکې یا ګېم په بهیر کې دی؛ د ټکر د مخنیوي لپاره ګېم لغوه شو. بیا هڅه وکړه.';
        try { await api.sendMessage({ chat_id: Number(game.player_id), text: notice }); } catch (e) {}
        try { await api.sendMessage({ chat_id: actorId, text: notice }); } catch (e) {}
        return;
      }
      const acceptedAt = new Date().toISOString();
      // Atomic claim: only one callback can move this pending game to playing.
      const claimed = await db.update(game_sessions)
        .set({ status: 'playing', updated_at: acceptedAt })
        .where(and(
          eq(game_sessions.id, gameId),
          eq(game_sessions.status, 'pending'),
          eq(game_sessions.opponent_id, actorId)
        ))
        .returning({ id: game_sessions.id }).run();
      // Some serverless DB adapters apply UPDATE but return an empty RETURNING
      // result. Verify the persisted row before treating that as a failed accept.
      let playing = null;
      if (claimed && Array.isArray(claimed.rows) && claimed.rows.length > 0) {
        playing = await db.select().from(game_sessions).where(eq(game_sessions.id, gameId)).get();
      } else {
        playing = await db.select().from(game_sessions).where(eq(game_sessions.id, gameId)).get();
        const thisAcceptWon = playing &&
          playing.status === 'playing' &&
          Number(playing.opponent_id) === actorId &&
          String(playing.updated_at || '') === acceptedAt;
        if (!thisAcceptWon) {
          await sendPrompt(chatId, '⌛ دا ګېم نور فعال نه دی یا مخکې منل شوی دی.', mainKeyboard(actor, await isAdmin(actorId)), actor);
          return;
        }
      }
      if (!playing || playing.status !== 'playing' || Number(playing.opponent_id) !== actorId) {
        await notifyRuntimeError('callback:game-accept-state-verification', new Error('Accepted game state could not be verified'), {
          gameId, actorId, observedStatus: playing && playing.status,
          observedUpdatedAt: playing && playing.updated_at, acceptedAt
        });
        await sendPrompt(chatId, '⚠️ د ګېم حالت تایید نه شو؛ فیس نه دی قصداً اخیستل شوی. مهرباني وکړه له اډمین سره اړیکه ونیسه.', mainKeyboard(actor, await isAdmin(actorId)), actor);
        return;
      }
      await resolveUserGame(playing);
    } catch (error) {
      reportDiagnostic('callback-handler', 'User game acceptance/resolution failed', { gameId, actorId, error });
      // Do not mark a possibly partially settled game as cancelled: that could enable a second charge.
      try {
        await db.update(game_sessions)
          .set({ status: 'settlement_error', updated_at: new Date().toISOString() })
          .where(and(eq(game_sessions.id, gameId), eq(game_sessions.status, 'playing')))
          .run();
      } catch (stateError) {
        reportDiagnostic('callback-handler', 'Could not mark game settlement error', { gameId, actorId, stateError });
      }
      const notice = '⚠️ د ګېم پر مهال تخنیکي ستونزه رامنځته شوه. د فیس او پایلې حالت لا نه دی تایید شوی؛ مهرباني وکړه ګېم بیا مه منئ او له اډمین سره اړیکه ونیسه.';
      try { await api.sendMessage({ chat_id: Number(game.player_id), text: notice }); } catch (e) {}
      try { if (game.opponent_id) await api.sendMessage({ chat_id: Number(game.opponent_id), text: notice }); } catch (e) {}
    }
    return;
  }
}

async function handleCallback(query) {
  if (!query || !query.from || !query.message || !query.message.chat || !query.data) return;
  const id = Number(query.from.id);
  const chatId = Number(query.message.chat.id);
  if (!Number.isSafeInteger(id) || id <= 0 || query.message.chat.type !== 'private') return;
  try { await api.answerCallbackQuery({ callback_query_id: query.id }); } catch (e) {}
  const data = String(query.data);
  if ((data.startsWith('reg:') || data.startsWith('admin:') || data.startsWith('settings:') || data.startsWith('conn:') || data.startsWith('find:') || data.startsWith('game:')) && query.message.message_id) {
    await safeDelete(chatId, query.message.message_id);
  }
  let user = await getUser(id);
  if (!user || Number(user.is_blocked) === 1) return;
  try { await db.update(users).set({ last_active_at: new Date().toISOString() }).where(eq(users.telegram_id, id)).run(); } catch (e) {}
  // Every user action must enforce active-connection timeouts. For game callbacks,
  // check only connection sessions here; full game/request cleanup remains after the
  // game callback's own state claim to avoid racing an accept/reject action.
  if (data.startsWith('game:')) {
    try { await expireUserTimedActions(id, { connectionOnly: true }); }
    catch (error) { await notifyRuntimeError('callback:connection-timeout', error, { userId: id, callbackData: data }); }
    await handleGameCallback(query, user, data, id, chatId);
    return;
  }
  try { await expireUserTimedActions(id); } catch (error) { await notifyRuntimeError('callback:expire-user-actions', error, { userId: id, callbackData: data }); }
  if (data.startsWith('admin:')) { await handleAdminCallback(query, user, data, id, chatId); return; }
  if (data.startsWith('settings:')) { await handleSettingsCallback(query, user, data, id, chatId); return; }
  if (data.startsWith('conn:')) { await handleConnectionCallback(query, user, data, id, chatId); return; }
  if (data.startsWith('find:')) { await handleFindCallback(query, user, data, id, chatId); return; }
  if (data.startsWith('session:')) { await handleSessionCallback(query, user, data, id, chatId); return; }
  if (data.startsWith('game:')) { await handleGameCallback(query, user, data, id, chatId); return; }
  if (!data.startsWith('reg:')) return;
  const parts = data.split(':');
  const kind = parts[1];
  const value = parts[2];

  if (kind === 'lang') {
    const language = LANGUAGES.find(item => item.code === value);
    if (!language) return;
    const nextState = user.country ? 'ready' : 'check_membership';
    await db.update(users).set({ language: language.code, state: nextState })
      .where(eq(users.telegram_id, id)).run();
    user.language = language.code;
    user.state = nextState;
    if (nextState === 'ready') await showMain(chatId, user, tx(user).saved);
    else await showMembership(chatId, user);
    return;
  }

  if (kind === 'membership' && value === 'check') {
    const previousState = user.state;
    if (previousState !== 'check_membership' && !user.country) {
      user.state = 'check_membership';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
    }
    if (!(await checkMembership(id))) {
      await showMembership(chatId, user, tx(user).membershipFail);
      return;
    }
    if (user.country) {
      const nextState = previousState === 'searching_connection' ? 'searching_connection' : 'ready';
      await db.update(users).set({ state: nextState }).where(eq(users.telegram_id, id)).run();
      user.state = nextState;
      if (nextState === 'searching_connection') {
        await sendPrompt(chatId, tx(user).main, mainKeyboard(user, await isAdmin(id)), user);
      } else await showMain(chatId, user);
      return;
    }
    await db.update(users).set({ state: 'choose_country' }).where(eq(users.telegram_id, id)).run();
    user.state = 'choose_country';
    await showCountry(chatId, user);
    return;
  }

  if (kind === 'country') {
    const country = COUNTRIES.find(item => item.code === value);
    if (!country || !['choose_country', 'settings_country'].includes(user.state)) return;
    const setting = user.state === 'settings_country';
    await db.update(users).set({ country: country.code, state: setting ? 'ready' : 'choose_gender' })
      .where(eq(users.telegram_id, id)).run();
    user.country = country.code;
    user.state = setting ? 'ready' : 'choose_gender';
    if (setting) await showMain(chatId, user, tx(user).saved);
    else await showGender(chatId, user);
    return;
  }

  if (kind === 'gender') {
    if (!['male', 'female'].includes(value) || !['choose_gender', 'settings_gender'].includes(user.state)) return;
    const setting = user.state === 'settings_gender';
    await db.update(users).set({ gender: value, state: setting ? 'ready' : 'choose_age' })
      .where(eq(users.telegram_id, id)).run();
    user.gender = value;
    user.state = setting ? 'ready' : 'choose_age';
    if (setting) await showMain(chatId, user, tx(user).saved);
    else await showAge(chatId, user);
    return;
  }

  if (kind === 'age') {
    const age = Number(value);
    if (!AGES.includes(age) || !['choose_age', 'settings_age'].includes(user.state)) return;
    const setting = user.state === 'settings_age';
    await db.update(users).set({ age: age, state: setting ? 'ready' : 'enter_name' })
      .where(eq(users.telegram_id, id)).run();
    user.age = age;
    user.state = setting ? 'ready' : 'enter_name';
    if (setting) await showMain(chatId, user, tx(user).saved);
    else await sendPrompt(chatId, (user.language === 'en' ? '✍️ Enter your name:' : user.language === 'fa' ? '✍️ نام خود را بنویسید:' : user.language === 'ur' ? '✍️ اپنا نام لکھیں:' : user.language === 'ar' ? '✍️ اكتب اسمك:' : '✍️ خپل نوم ولیکه:'), { force_reply: true }, user);
    return;
  }

  if (kind === 'skip_surname' && ['enter_surname', 'settings_surname'].includes(user.state)) {
    await db.update(users).set({ surname: null, state: 'ready' }).where(eq(users.telegram_id, id)).run();
    user.surname = null;
    user.state = 'ready';
    await showMain(chatId, user, tx(user).ready);
  }
}
export default async function (query) {
  try {
    await handleCallback(query);
  } catch (error) {
    await notifyRuntimeError('handlers/callback_query.js', error, {
      updateType: 'callback_query',
      callbackData: query && query.data,
      userId: query && query.from && query.from.id,
      chatId: query && query.message && query.message.chat && query.message.chat.id
    });
    if (query && query.message && query.message.chat && query.message.chat.id) {
      try { await api.sendMessage({ chat_id: query.message.chat.id, text: '⚠️ تخنیکي ستونزه رامنځته شوه. بیا هڅه وکړه.' }); } catch (e) {}
    }
  } finally {
    // Match only after callback handling has completed its response/state transition.
    const userId = query && query.from && query.from.id;
    const callbackData = query && query.data;
    try { await tryOfferSearches(); } catch (error) { await notifyRuntimeError('callback:connection-matching', error, { userId, callbackData }); }
    try { await tryMatchGames(); } catch (error) { await notifyRuntimeError('callback:game-matching', error, { userId, callbackData }); }
  }
}
