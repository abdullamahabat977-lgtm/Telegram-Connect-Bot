import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users, admins, required_chats, app_settings, favorites } from '../schema.js';

const ROOT_ADMINS = [7851941608, 7003093962];
const LANGUAGES = [
  { code: 'ps', label: 'پښتو' },
  { code: 'fa', label: 'دری' },
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'ar', label: 'العربية' }
];
const COUNTRIES = [
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
const AGES = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
const TEXT = {
  ps: {
    menu: ['🔎 ملګری پیدا کړه', '👥 پالو ملګري', '🎲 ناڅاپي اړیکه', '📨 ملګری رابلل', '👤 زما پروفایل', '🌍 د ژبې بدلول', '⚙️ تنظیمات', '📊 احصائیې', '🛡️ د اډمین پینل'],
    country: '🌍 خپل هېواد وټاکه:', gender: '👤 خپل جنسیت وټاکه:',
    age: '🎂 خپل نږدې عمر وټاکه. عمرونه له ۱۲ څخه تر ۴۰ پورې دي؛ نږدې عمر انتخاب کړه:',
    surname: '📝 تخلص اختیاري دی. که یې نه لیکې، لاندې بټن کېکاږه:',
    skip: 'تخلص نه لیکم', membership: '🔐 د بوټ کارولو لپاره په لاندې ټولو ګروپونو یا چینلونو کې ګډون وکړه، بیا د غړیتوب کتلو بټن کېکاږه:',
    joined: '✅ ګډون مې وکړ، بیا یې وګوره', membershipFail: '⚠️ غړیتوب تایید نه شو. په ټولو ګروپونو کې ګډون وکړه او ډاډ ترلاسه کړه چې بوټ د غړیتوب د کتلو اجازه لري.',
    ready: '🎉 ستا پروفایل جوړ شو!', main: 'اصلي مېنو:', saved: '✅ بدلون ثبت شو.'
  },
  fa: {
    menu: ['🔎 پیدا کردن دوست', '👥 دوستان محبوب', '🎲 ارتباط تصادفی', '📨 دعوت از دوست', '👤 پروفایل من', '🌍 تغییر زبان', '⚙️ تنظیمات', '📊 آمار', '🛡️ پنل مدیریت'],
    country: '🌍 کشور خود را انتخاب کنید:', gender: '👤 جنسیت خود را انتخاب کنید:',
    age: '🎂 نزدیک‌ترین سن خود را از ۱۲ تا ۴۰ سال انتخاب کنید:',
    surname: '📝 نام خانوادگی اختیاری است. برای رد کردن، دکمه زیر را بزنید:',
    skip: 'رد کردن نام خانوادگی', membership: '🔐 برای استفاده از ربات، عضو همه گروه‌ها یا کانال‌های زیر شوید و سپس عضویت را بررسی کنید:',
    joined: '✅ عضو شدم، بررسی کن', membershipFail: '⚠️ عضویت تأیید نشد. عضو همه گروه‌ها شوید و دسترسی بررسی عضویت ربات را بررسی کنید.',
    ready: '🎉 پروفایل شما آماده شد!', main: 'منوی اصلی:', saved: '✅ تغییرات ذخیره شد.'
  },
  en: {
    menu: ['🔎 Find a friend', '👥 Favorite friends', '🎲 Random connection', '📨 Invite a friend', '👤 My profile', '🌍 Change language', '⚙️ Settings', '📊 Statistics', '🛡️ Admin panel'],
    country: '🌍 Choose your country:', gender: '👤 Choose your gender:',
    age: '🎂 Choose the closest age from 12 to 40:',
    surname: '📝 Surname is optional. Press below to skip:',
    skip: 'Skip surname', membership: '🔐 Join every group or channel below to use the bot, then check your membership:',
    joined: '✅ I joined, check again', membershipFail: '⚠️ Membership is not confirmed. Join all listed groups and ensure the bot can check membership.',
    ready: '🎉 Your profile is ready!', main: 'Main menu:', saved: '✅ Changes saved.'
  },
  ur: {
    menu: ['🔎 دوست تلاش کریں', '👥 پسندیدہ دوست', '🎲 اچانک رابطہ', '📨 دوست کو بلائیں', '👤 میرا پروفائل', '🌍 زبان تبدیل کریں', '⚙️ ترتیبات', '📊 اعدادوشمار', '🛡️ ایڈمن پینل'],
    country: '🌍 اپنا ملک منتخب کریں:', gender: '👤 اپنی جنس منتخب کریں:',
    age: '🎂 12 سے 40 سال کے درمیان اپنی قریب ترین عمر منتخب کریں:',
    surname: '📝 خاندانی نام اختیاری ہے۔ چھوڑنے کے لیے نیچے بٹن دبائیں:',
    skip: 'خاندانی نام چھوڑیں', membership: '🔐 بوٹ استعمال کرنے کے لیے نیچے دیے گئے تمام گروپس یا چینلز میں شامل ہوں، پھر تصدیق کریں:',
    joined: '✅ شامل ہوگیا، دوبارہ چیک کریں', membershipFail: '⚠️ رکنیت کی تصدیق نہیں ہوئی۔ تمام گروپس میں شامل ہوں اور بوٹ کی اجازت چیک کریں۔',
    ready: '🎉 آپ کا پروفائل تیار ہے!', main: 'مرکزی مینو:', saved: '✅ تبدیلی محفوظ ہوگئی۔'
  },
  ar: {
    menu: ['🔎 ابحث عن صديق', '👥 الأصدقاء المفضلون', '🎲 اتصال عشوائي', '📨 دعوة صديق', '👤 ملفي الشخصي', '🌍 تغيير اللغة', '⚙️ الإعدادات', '📊 الإحصائيات', '🛡️ لوحة الإدارة'],
    country: '🌍 اختر بلدك:', gender: '👤 اختر جنسك:',
    age: '🎂 اختر عمرك الأقرب من 12 إلى 40 سنة:',
    surname: '📝 اسم العائلة اختياري. اضغط أدناه للتخطي:',
    skip: 'تخطي اسم العائلة', membership: '🔐 لاستخدام البوت، انضم إلى كل مجموعة أو قناة أدناه ثم تحقق من العضوية:',
    joined: '✅ انضممت، تحقق مرة أخرى', membershipFail: '⚠️ لم يتم تأكيد العضوية. انضم إلى جميع المجموعات وتأكد أن البوت يستطيع التحقق.',
    ready: '🎉 ملفك الشخصي جاهز!', main: 'القائمة الرئيسية:', saved: '✅ تم حفظ التغييرات.'
  }
};

function tx(user) {
  return TEXT[user && TEXT[user.language] ? user.language : 'ps'];
}
async function getUser(id) {
  return await db.select().from(users).where(eq(users.telegram_id, Number(id))).get();
}
async function safeDelete(chatId, messageId) {
  if (!messageId) return;
  try { await api.deleteMessage({ chat_id: chatId, message_id: Number(messageId) }); } catch (e) {}
}
let inlinePromptTrackingReady = false;
async function ensureInlinePromptTracking() {
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
async function sendPrompt(chatId, text, markup, user) {
  await ensureInlinePromptTracking();
  if (user) {
    const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users)
      .where(eq(users.telegram_id, Number(user.telegram_id))).get();
    user.last_prompt_id = Number(latest && latest.last_prompt_id || 0);
  }
  if (user && Number(user.last_prompt_id) > 0) await safeDelete(chatId, user.last_prompt_id);
  const sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: markup });
  if (user) {
    const inlineId = markup && Array.isArray(markup.inline_keyboard) && sent && sent.message_id ? sent.message_id : 0;
    await db.update(users).set({ last_prompt_id: inlineId }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = inlineId;
  }
  return sent;
}
function languageKeyboard() {
  return { inline_keyboard: [
    [{ text: 'پښتو', callback_data: 'reg:lang:ps' }, { text: 'دری', callback_data: 'reg:lang:fa' }],
    [{ text: 'English', callback_data: 'reg:lang:en' }, { text: 'اردو', callback_data: 'reg:lang:ur' }],
    [{ text: 'العربية', callback_data: 'reg:lang:ar' }]
  ] };
}
function countryKeyboard() {
  const rows = [];
  for (let i = 0; i < COUNTRIES.length; i += 2) {
    const row = [{ text: COUNTRIES[i].label, callback_data: 'reg:country:' + COUNTRIES[i].code }];
    if (COUNTRIES[i + 1]) row.push({ text: COUNTRIES[i + 1].label, callback_data: 'reg:country:' + COUNTRIES[i + 1].code });
    rows.push(row);
  }
  return { inline_keyboard: rows };
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
function requiredChatInfo(chat) {
  const stored = String(chat.title || '');
  if (stored.startsWith('channel::')) return { type: 'channel', title: stored.slice(9) };
  if (stored.startsWith('group::')) return { type: 'group', title: stored.slice(7) };
  return { type: String(chat.chat_id) === '-1004419974496' ? 'channel' : 'group', title: stored };
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
async function isAdmin(id) {
  if (ROOT_ADMINS.includes(Number(id))) return true;
  return Boolean(await db.select().from(admins).where(eq(admins.telegram_id, Number(id))).get());
}
function mainKeyboard(user, admin) {
  const m = tx(user).menu;
  const rows = [
    [{ text: m[0] }, { text: m[1] }],
    [{ text: m[2] }, { text: m[3] }],
    [{ text: m[4] }, { text: m[5] }],
    [{ text: m[6] }, { text: m[7] }]
  ];
  if (admin) rows.push([{ text: m[8] }]);
  return { keyboard: rows, resize_keyboard: true };
}
function adminKeyboard(user) {
  const b = (ADMIN_UI[user.language] || ADMIN_UI.ps).buttons;
  return { keyboard: [[{ text: b[0] }], [{ text: b[1] }, { text: b[2] }], [{ text: b[3] }, { text: b[4] }], [{ text: b[5] }]], resize_keyboard: true };
}
function adminManagementKeyboard(user) {
  const b = (ADMIN_UI[user.language] || ADMIN_UI.ps).management;
  return { keyboard: [[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }], [{ text: b[3] }]], resize_keyboard: true };
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
  const country = COUNTRIES.find(item => item.code === target.country);
  const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(target.telegram_id)));
  const title = actor.language === 'en' ? '👤 USER SETTINGS' : actor.language === 'fa' ? '👤 تنظیمات کاربر' : actor.language === 'ur' ? '👤 صارف کی ترتیبات' : actor.language === 'ar' ? '👤 إعدادات المستخدم' : '👤 د کارن تنظیمات';
  const text = title + '\n━━━━━━━━━━━━━━\n👤 ' + [target.name || target.first_name || '—', target.surname || ''].filter(Boolean).join(' ') +
    '\n🆔 ' + target.telegram_id + '\n🔗 ' + (target.username ? '@' + target.username : '—') +
    '\n🌍 ' + (country ? country.label : '—') + '\n⚧ ' + (target.gender || '—') + '  🎂 ' + (target.age || '—') +
    '\n📢 ' + (target.channel_username || '—') + '\n📨 Referrals: ' + Number(target.referral_count || 0) +
    '\n👥 Favorites: ' + favCount + '\n⭐ Stars: ' + Number(target.stars || 0) +
    '\n🏆 Points: ' + Number(target.points || 0) + '\n❤️ Likes: ' + Number(target.likes || 0) +
    '\n🖼 Photo: ' + (target.profile_photo_id ? 'saved' : '—') + '\n🚦 Status: ' + (Number(target.is_blocked) === 1 ? 'BLOCKED' : 'Active');
  await sendPrompt(chatId, text, adminSettingsKeyboard(actor, target.telegram_id, target.is_blocked), actor);
}
async function showAdminListPage(chatId, actor, page) {
  const all = await db.select().from(admins).all();
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  const ui = ADMIN_UI[actor.language] || ADMIN_UI.ps;
  let text = '🛡️ ' + ui.management[2] + '\n' + (current + 1) + '/' + pages + '\n\n';
  if (!all.length) text += 'No admins.';
  for (const row of items) {
    const profile = await getUser(row.telegram_id);
    const name = profile ? [profile.name || profile.first_name || 'Admin', profile.surname || ''].filter(Boolean).join(' ') : 'Admin';
    text += '👤 ' + name + '\n🆔 ' + row.telegram_id + '\n🔗 ' + (profile && profile.username ? '@' + profile.username : '—') + '\n\n';
    rows.push([{ text: '📋 Copy ID ' + row.telegram_id, copy_text: { text: String(row.telegram_id) } }]);
  }
  const nav = [];
  if (current > 0) nav.push({ text: '⬅️ Previous', callback_data: 'admin:admins:page:' + (current - 1) });
  if (current < pages - 1) nav.push({ text: 'Next ➡️', callback_data: 'admin:admins:page:' + (current + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: '🏠 Main menu', callback_data: 'admin:main' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, actor);
}
async function showUserListPage(chatId, actor, page) {
  const all = await db.select().from(users).all();
  all.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = '👥 User list\n' + (current + 1) + '/' + pages + '\n━━━━━━━━━━━━━━\n\n';
  if (!all.length) text += 'No users yet.';
  for (const item of items) {
    const name = [item.name || item.first_name || 'User', item.surname || ''].filter(Boolean).join(' ');
    const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(item.telegram_id)));
    text += '👤 ' + name + '\n🆔 ' + item.telegram_id + '\n🔗 ' + (item.username ? '@' + item.username : '—') +
      '\n📨 Referrals: ' + Number(item.referral_count || 0) + '  👥 Favorites: ' + favCount +
      '\n⭐ ' + Number(item.stars || 0) + '  🏆 ' + Number(item.points || 0) + '  ❤️ ' + Number(item.likes || 0) + '\n\n';
    rows.push([{ text: '⚙️ ' + name.slice(0, 28), callback_data: 'admin:open_user:' + item.telegram_id },
      { text: '📋 ID', copy_text: { text: String(item.telegram_id) } }]);
  }
  const nav = [];
  if (current > 0) nav.push({ text: '⬅️ Previous', callback_data: 'admin:users:page:' + (current - 1) });
  if (current < pages - 1) nav.push({ text: 'Next ➡️', callback_data: 'admin:users:page:' + (current + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: '🏠 Main menu', callback_data: 'admin:main' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, actor);
}
async function showFavoriteSettings(chatId, actor, page) {
  const all = await db.select().from(favorites).where(eq(favorites.user_telegram_id, Number(actor.telegram_id))).all();
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = '❤️ Favorite friends\n' + (current + 1) + '/' + pages + '\n\n';
  for (const item of items) {
    const friend = await getUser(item.favorite_telegram_id);
    if (!friend) continue;
    const name = [friend.name || friend.first_name || 'User', friend.surname || ''].filter(Boolean).join(' ');
    text += '👤 ' + name + '\n🆔 ' + friend.telegram_id + '\n🔗 ' + (friend.username ? '@' + friend.username : '—') + '\n\n';
    rows.push([{ text: '❌ Unfollow ' + name.slice(0, 28), callback_data: 'settings:unfavorite:' + friend.telegram_id + ':' + current }]);
  }
  if (!all.length) text += actor.language === 'en' ? 'Your favorites list is empty.' : 'د پالو ملګرو لېست تش دی.';
  const nav = [];
  if (current > 0) nav.push({ text: '⬅️ Previous', callback_data: 'settings:favorites:page:' + (current - 1) });
  if (current < pages - 1) nav.push({ text: 'Next ➡️', callback_data: 'settings:favorites:page:' + (current + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: '⚙️ Settings', callback_data: 'settings:open' }, { text: '🏠 Main menu', callback_data: 'settings:main' }]);
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
async function handleAdminCallback(query, actor, data, actorId, chatId) {
  if (!(await isAdmin(actorId))) {
    await sendPrompt(chatId, (ADMIN_UI[actor.language] || ADMIN_UI.ps).noAccess, mainKeyboard(actor, false), actor);
    return;
  }
  const p = data.split(':');
  const ui = ADMIN_UI[actor.language] || ADMIN_UI.ps;
  if (p[1] === 'panel') {
    actor.state = 'admin_menu';
    await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, actorId)).run();
    await sendPrompt(chatId, ui.intro, adminKeyboard(actor), actor);
    return;
  }
  let targetId = 0;
  if (p[1] === 'open_user') targetId = Number(p[2]);
  else if (p[1] === 'edit') targetId = Number(p[3]);
  else if (p[1] === 'setcountry' || p[1] === 'setgender' || p[1] === 'setage') targetId = Number(p[3]);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return;
  const target = await getUser(targetId);
  if (!target) {
    await sendPrompt(chatId, ui.userMissing, adminKeyboard(actor), actor);
    return;
  }
  if (p[1] === 'open_user') {
    await showAdminUserSettings(chatId, actor, target);
    return;
  }
  if (p[1] === 'edit') {
    const field = p[2];
    if (field === 'country') {
      const rows = [];
      for (let i = 0; i < COUNTRIES.length; i += 2) {
        const row = [{ text: COUNTRIES[i].label, callback_data: 'admin:setcountry:' + COUNTRIES[i].code + ':' + targetId }];
        if (COUNTRIES[i + 1]) row.push({ text: COUNTRIES[i + 1].label, callback_data: 'admin:setcountry:' + COUNTRIES[i + 1].code + ':' + targetId });
        rows.push(row);
      }
      rows.push([{ text: '🔙', callback_data: 'admin:open_user:' + targetId }]);
      await sendPrompt(chatId, tx(actor).country, { inline_keyboard: rows }, actor);
    } else if (field === 'gender') {
      const genderLabels = {
        ps: ['نارینه', 'ښځینه'], fa: ['مرد', 'زن'], en: ['Male', 'Female'],
        ur: ['مرد', 'عورت'], ar: ['ذكر', 'أنثى']
      };
      const pair = genderLabels[actor.language] || genderLabels.ps;
      await sendPrompt(chatId, tx(actor).gender, { inline_keyboard: [[
        { text: pair[0], callback_data: 'admin:setgender:male:' + targetId },
        { text: pair[1], callback_data: 'admin:setgender:female:' + targetId }
      ], [{ text: '🔙', callback_data: 'admin:open_user:' + targetId }]] }, actor);
    } else if (field === 'age') {
      const rows = [];
      for (let i = 0; i < AGES.length; i += 3) rows.push(AGES.slice(i, i + 3).map(age => ({ text: String(age), callback_data: 'admin:setage:' + age + ':' + targetId })));
      rows.push([{ text: '🔙', callback_data: 'admin:open_user:' + targetId }]);
      await sendPrompt(chatId, tx(actor).age, { inline_keyboard: rows }, actor);
    } else if (field === 'name' || field === 'surname') {
      actor.state = 'admin_edit_user_' + field + ':' + targetId;
      await db.update(users).set({ state: actor.state }).where(eq(users.telegram_id, actorId)).run();
      const prompt = field === 'name' ? (actor.language === 'en' ? 'Enter the new name:' : actor.language === 'fa' ? 'نام جدید را بنویسید:' : actor.language === 'ur' ? 'نیا نام لکھیں:' : actor.language === 'ar' ? 'اكتب الاسم الجديد:' : 'د کارن نوی نوم ولیکه:') :
        (actor.language === 'en' ? 'Enter the new surname, or send /skip to clear it:' : actor.language === 'fa' ? 'نام خانوادگی جدید را بنویسید:' : actor.language === 'ur' ? 'نیا خاندانی نام لکھیں:' : actor.language === 'ar' ? 'اكتب اسم العائلة الجديد:' : 'د کارن نوی تخلص ولیکه:');
      await sendPrompt(chatId, prompt, { force_reply: true }, actor);
    }
    return;
  }
  if (p[1] === 'setcountry') {
    const country = COUNTRIES.find(item => item.code === p[2]);
    if (!country) return;
    await db.update(users).set({ country: country.code }).where(eq(users.telegram_id, targetId)).run();
    target.country = country.code;
  } else if (p[1] === 'setgender') {
    if (!['male', 'female'].includes(p[2])) return;
    await db.update(users).set({ gender: p[2] }).where(eq(users.telegram_id, targetId)).run();
    target.gender = p[2];
  } else if (p[1] === 'setage') {
    const age = Number(p[2]);
    if (!AGES.includes(age)) return;
    await db.update(users).set({ age }).where(eq(users.telegram_id, targetId)).run();
    target.age = age;
  }
  await showAdminUserSettings(chatId, actor, target);
}
async function handleCallback(query) {
  if (!query || !query.from || !query.message || !query.message.chat || !query.data) return;
  const id = Number(query.from.id);
  const chatId = Number(query.message.chat.id);
  if (!Number.isSafeInteger(id) || id <= 0 || query.message.chat.type !== 'private') return;
  try { await api.answerCallbackQuery({ callback_query_id: query.id }); } catch (e) {}
  const data = String(query.data);
  if ((data.startsWith('reg:') || data.startsWith('admin:')) && query.message.message_id) {
    await safeDelete(chatId, query.message.message_id);
  }
  let user = await getUser(id);
  if (!user || Number(user.is_blocked) === 1) return;
  if (data.startsWith('admin:')) {
    await handleAdminCallback(query, user, data, id, chatId);
    return;
  }
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
    if (user.state !== 'check_membership') {
      if (!user.country) {
        user.state = 'check_membership';
        await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      } else {
        await showMain(chatId, user);
        return;
      }
    }
    if (await checkMembership(id)) {
      await db.update(users).set({ state: 'choose_country' }).where(eq(users.telegram_id, id)).run();
      user.state = 'choose_country';
      await showCountry(chatId, user);
    } else await showMembership(chatId, user, tx(user).membershipFail);
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
    console.error('Random Connect callback_query handler error', error);
    if (query && query.message && query.message.chat && query.message.chat.id) {
      try { await api.sendMessage({ chat_id: query.message.chat.id, text: '⚠️ تخنیکي ستونزه رامنځته شوه. بیا هڅه وکړه.' }); } catch (e) {}
    }
  }
}
