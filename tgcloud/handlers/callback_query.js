import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users, admins, required_chats, app_settings, favorites, chat_sessions, connection_requests, chat_messages, user_ratings, user_likes, game_sessions, user_blocks, reports } from '../schema.js';
import { ROOT_ADMINS, LANGUAGES, COUNTRIES, AGES, languageKeyboard, countryKeyboard, ensureInlinePromptTracking, requiredChatInfo, listWords, isFollowing, otherSessionUser } from '../lib/shared.js';

const TEXT = {
  ps: {
    menu: ['🔎 ملګری پیدا کړه', '👥 پالو ملګري', '🎲 ناڅاپي اړیکه', '📨 ملګری رابلل', '👤 زما پروفایل', '🌍 د ژبې بدلول', '⚙️ تنظیمات', '📊 احصائیې', '🛡️ د اډمین پینل', '🎲 ګېم کول', '🏆 لوړ رتبه کسان'],
    country: '🌍 خپل هېواد وټاکه:', gender: '👤 خپل جنسیت وټاکه:',
    age: '🎂 خپل نږدې عمر وټاکه. عمرونه له ۱۲ څخه تر ۴۰ پورې دي؛ نږدې عمر انتخاب کړه:',
    surname: '📝 تخلص اختیاري دی. که یې نه لیکې، لاندې بټن کېکاږه:',
    skip: 'تخلص نه لیکم', membership: '🔐 د بوټ کارولو لپاره په لاندې ټولو ګروپونو یا چینلونو کې ګډون وکړه، بیا د غړیتوب کتلو بټن کېکاږه:',
    joined: '✅ ګډون مې وکړ، بیا یې وګوره', membershipFail: '⚠️ غړیتوب تایید نه شو. په ټولو ګروپونو کې ګډون وکړه او ډاډ ترلاسه کړه چې بوټ د غړیتوب د کتلو اجازه لري.',
    ready: '🎉 ستا پروفایل جوړ شو!', main: 'اصلي مېنو:', saved: '✅ بدلون ثبت شو.'
  },
  fa: {
    menu: ['🔎 پیدا کردن دوست', '👥 دوستان محبوب', '🎲 ارتباط تصادفی', '📨 دعوت از دوست', '👤 پروفایل من', '🌍 تغییر زبان', '⚙️ تنظیمات', '📊 آمار', '🛡️ پنل مدیریت', '🎲 بازی', '🏆 رتبه‌بندی برتر'],
    country: '🌍 کشور خود را انتخاب کنید:', gender: '👤 جنسیت خود را انتخاب کنید:',
    age: '🎂 نزدیک‌ترین سن خود را از ۱۲ تا ۴۰ سال انتخاب کنید:',
    surname: '📝 نام خانوادگی اختیاری است. برای رد کردن، دکمه زیر را بزنید:',
    skip: 'رد کردن نام خانوادگی', membership: '🔐 برای استفاده از ربات، عضو همه گروه‌ها یا کانال‌های زیر شوید و سپس عضویت را بررسی کنید:',
    joined: '✅ عضو شدم، بررسی کن', membershipFail: '⚠️ عضویت تأیید نشد. عضو همه گروه‌ها شوید و دسترسی بررسی عضویت ربات را بررسی کنید.',
    ready: '🎉 پروفایل شما آماده شد!', main: 'منوی اصلی:', saved: '✅ تغییرات ذخیره شد.'
  },
  en: {
    menu: ['🔎 Find a friend', '👥 Favorite friends', '🎲 Random connection', '📨 Invite a friend', '👤 My profile', '🌍 Change language', '⚙️ Settings', '📊 Statistics', '🛡️ Admin panel', '🎲 Play game', '🏆 Top rankings'],
    country: '🌍 Choose your country:', gender: '👤 Choose your gender:',
    age: '🎂 Choose the closest age from 12 to 40:',
    surname: '📝 Surname is optional. Press below to skip:',
    skip: 'Skip surname', membership: '🔐 Join every group or channel below to use the bot, then check your membership:',
    joined: '✅ I joined, check again', membershipFail: '⚠️ Membership is not confirmed. Join all listed groups and ensure the bot can check membership.',
    ready: '🎉 Your profile is ready!', main: 'Main menu:', saved: '✅ Changes saved.'
  },
  ur: {
    menu: ['🔎 دوست تلاش کریں', '👥 پسندیدہ دوست', '🎲 اچانک رابطہ', '📨 دوست کو بلائیں', '👤 میرا پروفائل', '🌍 زبان تبدیل کریں', '⚙️ ترتیبات', '📊 اعدادوشمار', '🛡️ ایڈمن پینل', '🎲 گیم کھیلیں', '🏆 اعلیٰ رینکنگ'],
    country: '🌍 اپنا ملک منتخب کریں:', gender: '👤 اپنی جنس منتخب کریں:',
    age: '🎂 12 سے 40 سال کے درمیان اپنی قریب ترین عمر منتخب کریں:',
    surname: '📝 خاندانی نام اختیاری ہے۔ چھوڑنے کے لیے نیچے بٹن دبائیں:',
    skip: 'خاندانی نام چھوڑیں', membership: '🔐 بوٹ استعمال کرنے کے لیے نیچے دیے گئے تمام گروپس یا چینلز میں شامل ہوں، پھر تصدیق کریں:',
    joined: '✅ شامل ہوگیا، دوبارہ چیک کریں', membershipFail: '⚠️ رکنیت کی تصدیق نہیں ہوئی۔ تمام گروپس میں شامل ہوں اور بوٹ کی اجازت چیک کریں۔',
    ready: '🎉 آپ کا پروفائل تیار ہے!', main: 'مرکزی مینو:', saved: '✅ تبدیلی محفوظ ہوگئی۔'
  },
  ar: {
    menu: ['🔎 ابحث عن صديق', '👥 الأصدقاء المفضلون', '🎲 اتصال عشوائي', '📨 دعوة صديق', '👤 ملفي الشخصي', '🌍 تغيير اللغة', '⚙️ الإعدادات', '📊 الإحصائيات', '🛡️ لوحة الإدارة', '🎲 العب', '🏆 أعلى التصنيفات'],
    country: '🌍 اختر بلدك:', gender: '👤 اختر جنسك:',
    age: '🎂 اختر عمرك الأقرب من 12 إلى 40 سنة:',
    surname: '📝 اسم العائلة اختياري. اضغط أدناه للتخطي:',
    skip: 'تخطي اسم العائلة', membership: '🔐 لاستخدام البوت، انضم إلى كل مجموعة أو قناة أدناه ثم تحقق من العضوية:',
    joined: '✅ انضممت، تحقق مرة أخرى', membershipFail: '⚠️ لم يتم تأكيد العضوية. انضم إلى جميع المجموعات وتأكد أن البوت يستطيع التحقق.',
    ready: '🎉 ملفك الشخصي جاهز!', main: 'القائمة الرئيسية:', saved: '✅ تم حفظ التغييرات.'
  }
};

const ADMIN_UI = {
  ps: {
    buttons: ['👥 د مدیرانو تنظیمات','📢 د غړیتوب ګروپونه','📣 ډله‌ییز اعلان','⚙️ د کارن تنظیمات','👥 د کاروونکو لېست','🔙 اصلي مېنو','🎁 د جایزو تنظیمات','🔗 د اړیکو تنظیمات','🎲 د ګېم تنظیمات','🏆 لوړ رتبه کسان'],
    management: ['➕ مدیر زیاتول','➖ مدیر لرې کول','📋 د مدیرانو لېست','🔙 اډمین پینل'],
    intro: '🛡️ د اډمین پینل:', managementIntro: '👥 د مدیرانو اداره:', noAccess: '⛔ دا برخه یوازې د مجاز مدیرانو لپاره ده.', userMissing: 'دا کارن له بوټ سره نه دی یوځای شوی.'
  },
  fa: {
    buttons: ['👥 مدیریت مدیران','📢 عضویت اجباری','📣 پیام همگانی','⚙️ تنظیمات کاربر','👥 فهرست کاربران','🔙 منوی اصلی','🎁 تنظیمات جوایز','🔗 تنظیمات ارتباطات','🎲 تنظیمات بازی','🏆 رتبه‌بندی برتر'],
    management: ['➕ افزودن مدیر','➖ حذف مدیر','📋 فهرست مدیران','🔙 پنل مدیریت'],
    intro: '🛡️ پنل مدیریت:', managementIntro: '👥 مدیریت مدیران:', noAccess: '⛔ این بخش فقط برای مدیران مجاز است.', userMissing: 'این کاربر هنوز ربات را شروع نکرده است.'
  },
  en: {
    buttons: ['👥 Admin management','📢 Required membership','📣 Broadcast','⚙️ User settings','👥 User list','🔙 Main menu','🎁 Reward settings','🔗 Connection settings','🎲 Game settings','🏆 Top rankings'],
    management: ['➕ Add admin','➖ Remove admin','📋 Admin list','🔙 Admin panel'],
    intro: '🛡️ Admin panel:', managementIntro: '👥 Admin management:', noAccess: '⛔ This section is for authorized admins only.', userMissing: 'This user has not started the bot.'
  },
  ur: {
    buttons: ['👥 ایڈمن مینجمنٹ','📢 لازمی رکنیت','📣 سب کو پیغام','⚙️ صارف کی ترتیبات','👥 صارفین کی فہرست','🔙 مرکزی مینو','🎁 انعامات کی ترتیبات','🔗 رابطے کی ترتیبات','🎲 گیم کی ترتیبات','🏆 اعلیٰ رینک'],
    management: ['➕ ایڈمن شامل کریں','➖ ایڈمن ہٹائیں','📋 ایڈمن فہرست','🔙 ایڈمن پینل'],
    intro: '🛡️ ایڈمن پینل:', managementIntro: '👥 ایڈمن مینجمنٹ:', noAccess: '⛔ یہ حصہ صرف مجاز ایڈمنز کے لیے ہے۔', userMissing: 'اس صارف نے ابھی بوٹ شروع نہیں کیا۔'
  },
  ar: {
    buttons: ['👥 إدارة المديرين','📢 العضوية الإلزامية','📣 رسالة جماعية','⚙️ إعدادات المستخدم','👥 قائمة المستخدمين','🔙 القائمة الرئيسية','🎁 إعدادات المكافآت','🔗 إعدادات الاتصال','🎲 إعدادات اللعبة','🏆 أعلى التصنيفات'],
    management: ['➕ إضافة مدير','➖ إزالة مدير','📋 قائمة المديرين','🔙 لوحة الإدارة'],
    intro: '🛡️ لوحة الإدارة:', managementIntro: '👥 إدارة المديرين:', noAccess: '⛔ هذا القسم للمديرين المصرح لهم فقط.', userMissing: 'هذا المستخدم لم يبدأ البوت بعد.'
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
async function sendPrompt(chatId, text, markup, user, parseMode) {
  await ensureInlinePromptTracking();
  if (user) {
    const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users)
      .where(eq(users.telegram_id, Number(user.telegram_id))).get();
    user.last_prompt_id = Number(latest && latest.last_prompt_id || 0);
  }
  if (user && Number(user.last_prompt_id) > 0) await safeDelete(chatId, user.last_prompt_id);
  const sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: markup, ...(parseMode ? { parse_mode: parseMode } : {}) });
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
    [{ text: m[6] }, { text: m[7] }],
    [{ text: m[9] }, { text: m[10] }]
  ];
  if (admin) rows.push([{ text: m[8] }]);
  return { keyboard: rows, resize_keyboard: true };
}
function adminKeyboard(user) {
  const b = (ADMIN_UI[user.language] || ADMIN_UI.ps).buttons;
  return { keyboard: [[{ text: b[0] }], [{ text: b[1] }, { text: b[2] }], [{ text: b[3] }, { text: b[4] }], [{ text: b[5] }], ...(b[6] ? [[{ text: b[6] }]] : []), ...(b[7] ? [[{ text: b[7] }, { text: b[8] }]] : []), ...(b[9] ? [[{ text: b[9] }]] : [])], resize_keyboard: true };
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
    text += '👤 ' + name + '\n🆔 ' + friend.telegram_id + '\n🔗 ' + (friend.username ? '@' + friend.username : '—') + '\n\n';
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
  if (p[1] === 'setting') {
    const key = p[2];
    const allowed = ['welcome_reward_stars','welcome_reward_points','welcome_reward_likes','referral_reward_stars','referral_reward_points','referral_reward_likes','connection_search_seconds','connection_idle_minutes','connection_max_minutes','connection_cost_stars','game_min_stars','game_opponent_min_stars','game_fee_stars','game_win_stars','game_bot_loss_total_stars','game_win_points','game_wait_seconds'];
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
    await sendPrompt(chatId, text, { inline_keyboard: [[{ text: '🔙 لوړ رتبه کسان', callback_data: 'admin:rank_menu' }], [{ text: '🔙 اډمین پینل', callback_data: (await isAdmin(actorId)) ? 'admin:panel' : 'admin:main' }]] }, actor, 'HTML');
    return;
  }
  if (p[1] === 'rank_menu') {
    await sendPrompt(chatId, '🏆 لوړ رتبه کسان\n\nلاندې درجه‌بندي وټاکه:', { inline_keyboard: [[{ text: '🏆 تر ټولو ډېرې نمرې', callback_data: 'admin:rank:points' }], [{ text: '📨 تر ټولو ډېر ریفرلونه', callback_data: 'admin:rank:referrals' }], [{ text: '👥 تر ټولو ډېر فالو', callback_data: 'admin:rank:follows' }], [{ text: '❤️ تر ټولو ډېر لایکونه', callback_data: 'admin:rank:likes' }], [{ text: '🔙 اصلي مېنو', callback_data: (await isAdmin(actorId)) ? 'admin:panel' : 'admin:main' }]] }, actor);
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
        for (const row of reqs.filter(item => (Number(item.requester_id) === targetId || Number(item.recipient_id) === targetId) && ['searching','pending'].includes(item.status))) {
          await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(row.id))).run();
        }
      } catch (e) { console.error('Could not cancel blocked user connection requests', e); }
      try {
        const sessions = await db.select().from(chat_sessions).all();
        for (const session of sessions.filter(item => item.status === 'connected' && (Number(item.first_user_telegram_id) === targetId || Number(item.second_user_telegram_id) === targetId))) {
          await endConnection(session, 'user_blocked');
        }
      } catch (e) { console.error('Could not end blocked user connection', e); }
      try {
        const games = await db.select().from(game_sessions).all();
        for (const game of games.filter(item => (Number(item.player_id) === targetId || Number(item.opponent_id) === targetId) && ['waiting','pending','playing'].includes(item.status))) {
          await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run();
        }
      } catch (e) { console.error('Could not cancel blocked user games', e); }
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
    const b = { ps: ['👤 د پروفایل تنظیمات','❤️ د پالو ملګرو تنظیمات','🔔 د اړیکې تنظیمات','🔙 اصلي مېنو'], fa: ['👤 تنظیمات پروفایل','❤️ تنظیمات دوستان محبوب','🔔 تنظیمات ارتباط','🔙 منوی اصلی'], en: ['👤 Profile settings','❤️ Favorite friends settings','🔔 Connection settings','🔙 Main menu'], ur: ['👤 پروفائل کی ترتیبات','❤️ پسندیدہ دوستوں کی ترتیبات','🔔 رابطے کی ترتیبات','🔙 مرکزی مینو'], ar: ['👤 إعدادات الملف الشخصي','❤️ إعدادات الأصدقاء المفضلين','🔔 إعدادات الاتصال','🔙 القائمة الرئيسية'] };
    const pair = b[actor.language] || b.ps;
    await sendPrompt(chatId, labels[actor.language] || labels.ps, { keyboard: [[{text:pair[0]}],[{text:pair[1]}],[{text:pair[2]}],[{text:pair[3]}]], resize_keyboard:true }, actor); return;
  }
  if (p[1] === 'visibility') {
    const visibility = p[2];
    if (!['everyone','followers'].includes(visibility)) return;
    await db.update(users).set({ profile_visibility: visibility, state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
    actor.profile_visibility = visibility; actor.state = 'ready';
    await sendPrompt(chatId, visibility === 'followers' ? '🔒 ستا بشپړ پروفایل به یوازې ستا پالو ملګرو ته ښکاري؛ نورو ته به یوازې نوم او جنسیت ښکاري.' : '🌐 ستا پروفایل ټولو ته ښکاره دی، خو د ستورو بیلانس هېڅکله نورو ته نه ښکاري.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
  }
  if (p[1] === 'connection') {
    const mode = p[2];
    if (!['all','followed','none'].includes(mode)) return;
    await db.update(users).set({ connection_request_mode: mode, state: 'settings_menu' }).where(eq(users.telegram_id, actorId)).run();
    actor.connection_request_mode = mode; actor.state = 'settings_menu';
    const messages = {
      all: { ps: '✅ د اړیکې پر مهال د ټولو کسانو غوښتنې انتخاب شوې.', en: '✅ Requests from everyone selected.' },
      followed: { ps: '✅ د اړیکې پر مهال یوازې د پالو ملګرو غوښتنې انتخاب شوې.', en: '✅ Requests from followed friends only selected.' },
      none: { ps: '✅ د اړیکې پر مهال ټولې غوښتنې بندې شوې.', en: '✅ All requests while chatting disabled.' }
    };
    const lang = actor.language === 'en' ? 'en' : 'ps';
    await sendPrompt(chatId, messages[mode][lang] + '\n\n' + (lang === 'en' ? 'This preference is active for incoming connection requests.' : 'دا تنظیم د راتلونکو اړیکو په غوښتنو کې عملي کېږي.'), { keyboard: [[{ text: '👤 د پروفایل تنظیمات' }, { text: '❤️ د پالو ملګرو تنظیمات' }], [{ text: '🔔 د اړیکې تنظیمات' }, { text: '🔙 اصلي مېنو' }]], resize_keyboard: true }, actor); return;
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

async function activeSessionFor(userId) {
  const rows = await db.select().from(chat_sessions).all();
  return rows.find(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === Number(userId) || Number(row.second_user_telegram_id) === Number(userId))) || null;
}
async function blockedPair(firstId, secondId) {
  const rows = await db.select().from(user_blocks).all();
  return rows.some(row => (Number(row.blocker_telegram_id) === Number(firstId) && Number(row.blocked_telegram_id) === Number(secondId)) ||
    (Number(row.blocker_telegram_id) === Number(secondId) && Number(row.blocked_telegram_id) === Number(firstId)));
}
async function publicProfileText(target, viewerId) {
  const name = [target.name || target.first_name || 'کارن', target.surname || ''].filter(Boolean).join(' ');
  const gender = target.gender === 'female' ? 'ښځینه' : target.gender === 'male' ? 'نارینه' : 'نه دی ثبت';
  if (target.profile_visibility === 'followers' && !(await isFollowing(viewerId, target.telegram_id))) {
    return '👤 نوم: ' + name + '\n\n⚧ جنسیت: ' + gender + '\n\n🔒 د بشپړ پروفایل لپاره لومړی دا کارن فالو کړه.';
  }
  const country = COUNTRIES.find(item => item.code === target.country), language = LANGUAGES.find(item => item.code === target.language);
  const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(target.telegram_id)));
  return '👤 نوم: ' + name + '\n\n⚧ جنسیت: ' + gender + '\n\n🌍 هېواد: ' + (country ? country.label : '—') +
    '\n\n🎂 عمر: ' + (target.age || '—') + '\n\n🗣️ ژبه: ' + (language ? language.label : target.language || '—') +
    '\n\n📢 عام چینل: ' + (target.channel_username || '—') + '\n\n📨 ریفرلونه: ' + Number(target.referral_count || 0) +
    '\n\n👥 پالو ملګري: ' + favCount + '\n\n🏆 نمرې: ' + Number(target.points || 0) + '\n\n❤️ لایکونه: ' + Number(target.likes || 0);
}
function sessionKeyboard(targetId, sessionId, following, liked) {
  return { inline_keyboard: [
    [{ text: following ? '❤️ فالو شوی' : '➕ فالو کول', callback_data: 'session:follow:' + targetId + ':' + sessionId },
     { text: liked ? '💔 لایک بېرته اخستل' : '❤️ لایک', callback_data: 'session:like:' + targetId + ':' + sessionId }],
    [{ text: '⭐ 1', callback_data: 'session:rate:' + targetId + ':1:' + sessionId },
     { text: '⭐ 2', callback_data: 'session:rate:' + targetId + ':2:' + sessionId },
     { text: '⭐ 3', callback_data: 'session:rate:' + targetId + ':3:' + sessionId },
     { text: '⭐ 4', callback_data: 'session:rate:' + targetId + ':4:' + sessionId },
     { text: '⭐ 5', callback_data: 'session:rate:' + targetId + ':5:' + sessionId }],
    [{ text: '👤 پروفایل لیدل', callback_data: 'session:profile:' + targetId + ':' + sessionId },
     { text: '🛑 اړیکه پای ته رسول', callback_data: 'session:end:' + sessionId }],
    [{ text: '🚩 راپور', callback_data: 'session:report:' + targetId + ':' + sessionId },
     { text: '🗑 د وروستیو ۱۰ دقیقو پیغامونه حذفول', callback_data: 'session:delete_recent:' + targetId + ':' + sessionId }]
  ] };
}
async function showSessionProfile(session, viewerId) {
  const targetId = otherSessionUser(session, viewerId), target = await getUser(targetId), viewer = await getUser(viewerId);
  if (!target || !viewer) return;
  const following = await isFollowing(viewerId, targetId);
  const likes = await db.select().from(user_likes).where(eq(user_likes.liker_id, Number(viewerId))).all();
  const liked = likes.some(row => Number(row.liked_id) === targetId);
  await sendPrompt(viewerId, '🤝 اړیکه فعاله ده.\n\n' + await publicProfileText(target, viewerId), sessionKeyboard(targetId, session.id, following, liked), viewer);
}
async function endConnection(session, reason) {
  if (!session || session.status !== 'connected') return;
  await db.update(chat_sessions).set({ status: 'ended', ended_at: new Date().toISOString(), end_reason: reason || 'ended' })
    .where(eq(chat_sessions.id, Number(session.id))).run();
  for (const pair of [{ id: Number(session.first_user_telegram_id), partnerId: Number(session.second_user_telegram_id) },
    { id: Number(session.second_user_telegram_id), partnerId: Number(session.first_user_telegram_id) }]) {
    const user = await getUser(pair.id), partner = await getUser(pair.partnerId);
    if (!user) continue;
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, pair.id)).run();
    const name = partner ? [partner.name || partner.first_name || 'کارن', partner.surname || ''].filter(Boolean).join(' ') : 'کارن';
    const following = await isFollowing(pair.id, pair.partnerId);
    const rows = [];
    if (!following) rows.push([{ text: '➕ ' + name + ' فالو کول', callback_data: 'session:follow:' + pair.partnerId + ':' + session.id }]);
    rows.push([{ text: '🚩 راپور کول', callback_data: 'session:report:' + pair.partnerId + ':' + session.id }]);
    rows.push([{ text: '🗑 د وروستیو ۱۰ دقیقو پیغامونه حذفول', callback_data: 'session:delete_recent:' + pair.partnerId + ':' + session.id }]);
    rows.push([{ text: '🔙 اصلي مېنو', callback_data: 'settings:main' }]);
    try { await sendPrompt(pair.id, '🛑 اړیکه پای ته ورسېده.\n\n👤 د تېر ملګري نوم: ' + name + '\n\nراپور، فالو یا د هغه له خوا درلېږل شوي د وروستیو ۱۰ دقیقو پیغامونه حذفول انتخاب کړه.', { inline_keyboard: rows }, user); } catch (e) {}
  }
}
async function expireUserTimedActions(userId) {
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
  const connectionWait = Math.max(1, Number(await getSetting('connection_search_seconds', 120)) || 120);
  const requests = await db.select().from(connection_requests).all();
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
  for (const game of games.filter(row => ['waiting', 'pending', 'playing'].includes(row.status) && (Number(row.player_id) === id || Number(row.opponent_id) === id))) {
    const timerStart = game.status === 'waiting' ? (game.created_at || game.updated_at) : (game.updated_at || game.created_at);
    const age = now - Date.parse(timerStart || '');
    if (Number.isFinite(age) && age < gameWait * 1000) continue;
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run();
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
  const now = Date.now(), wait = Math.max(1, Number(await getSetting('connection_search_seconds', 120)) || 120);
  for (const search of requests.filter(row => row.status === 'searching' && !row.recipient_id)) {
    const age = now - Date.parse(search.created_at || '');
    if (!Number.isFinite(age) || age >= wait * 1000) continue;
    if (requests.some(row => Number(row.requester_id) === Number(search.requester_id) && row.status === 'pending' && row.recipient_id &&
      Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < wait * 1000) ||
        requests.some(row => Number(row.recipient_id) === Number(search.requester_id) && row.status === 'pending' &&
      Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < wait * 1000)) continue;
    const requester = allUsers.find(row => Number(row.telegram_id) === Number(search.requester_id));
    if (!requester || Number(requester.is_blocked) === 1) continue;
    const tried = new Set(requests.filter(row => Number(row.requester_id) === Number(search.requester_id) && row.recipient_id).map(row => Number(row.recipient_id)));
    const candidates = allUsers.filter(candidate => {
      const cid = Number(candidate.telegram_id);
      if (cid === Number(search.requester_id) || Number(candidate.is_blocked) === 1 || !candidate.country || !candidate.gender || !candidate.age) return false;
      const active = Date.parse(candidate.last_active_at || '');
      if (!Number.isFinite(active) || now - active > 120000 || tried.has(cid)) return false;
      if (blocks.some(row => (Number(row.blocker_telegram_id) === cid && Number(row.blocked_telegram_id) === Number(search.requester_id)) ||
        (Number(row.blocker_telegram_id) === Number(search.requester_id) && Number(row.blocked_telegram_id) === cid))) return false;
      if (candidate.connection_request_mode === 'none') return false;
      const connected = sessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === cid || Number(row.second_user_telegram_id) === cid));
      if (connected && candidate.connection_request_mode !== 'all') return false;
      if (requests.some(row => Number(row.recipient_id) === cid && row.status === 'pending' && Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < wait * 1000)) return false;
      if (candidate.connection_request_mode === 'followed' && !favs.some(row => Number(row.user_telegram_id) === cid && Number(row.favorite_telegram_id) === Number(search.requester_id))) return false;
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
    const candidate = candidates[0], nowIso = new Date().toISOString();
    await db.insert(connection_requests).values({ requester_id: Number(search.requester_id), recipient_id: Number(candidate.telegram_id), status: 'pending',
      request_type: search.request_type, gender_filter: search.gender_filter, language_filter: search.language_filter, created_at: nowIso, updated_at: nowIso }).run();
    const all = await db.select().from(connection_requests).all();
    const offer = all.filter(row => Number(row.requester_id) === Number(search.requester_id) && Number(row.recipient_id) === Number(candidate.telegram_id) && row.status === 'pending').sort((a,b)=>Number(b.id)-Number(a.id))[0];
    requests.push(offer);
    try { await api.sendMessage({ chat_id: Number(candidate.telegram_id),
      text: '🎲 یو ناڅاپي کس د اړیکې غوښتنه کړې ده.\n\nد غوښتونکي هېڅ معلومات نه ښکاري. که ومنې، اړیکه به وصل شي؛ که رد یې کړې، بل کس ته به غوښتنه ولاړه شي.',
      reply_markup: { inline_keyboard: [[{ text: '✅ غوښتنه منل', callback_data: 'conn:accept:' + offer.id }, { text: '❌ ردول', callback_data: 'conn:reject:' + offer.id }]] } }); }
    catch (e) { await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(offer.id))).run(); }
  }
}
async function startConnectionSearch(userId, type) {
  const user = await getUser(userId), cost = Number(await getSetting('connection_cost_stars', 1));
  if (!user) return;
  if (Number(user.stars || 0) < cost) { await sendPrompt(userId, '⭐ د اړیکې لپاره ' + cost + ' ستوري پکار دي. ستا بیلانس: ' + Number(user.stars || 0), mainKeyboard(user, await isAdmin(userId)), user); return; }
  if (await activeSessionFor(userId)) { await sendPrompt(userId, '⚠️ ته لا له یوه کس سره په اړیکه کې یې. لومړی اړیکه پای ته ورسوه.', mainKeyboard(user, await isAdmin(userId)), user); return; }
  const requests = await db.select().from(connection_requests).where(eq(connection_requests.requester_id, Number(userId))).all();
  if (requests.some(row => row.status === 'searching' && !row.recipient_id)) { await sendPrompt(userId, '🔎 ستا د ملګري لټون لا روان دی.', { inline_keyboard: [[{ text: '❌ لټون لغوه کول', callback_data: 'conn:cancel_search' }]] }, user); return; }
  const now = new Date().toISOString();
  await db.insert(connection_requests).values({ requester_id: Number(userId), recipient_id: null, status: 'searching', request_type: type,
    gender_filter: type === 'find' ? user.search_gender || 'auto' : 'auto', language_filter: type === 'find' ? user.search_language || 'auto' : 'auto',
    created_at: now, updated_at: now }).run();
  const all = await db.select().from(connection_requests).all();
  const search = all.filter(row => Number(row.requester_id) === Number(userId) && row.status === 'searching' && !row.recipient_id).sort((a,b)=>Number(b.id)-Number(a.id))[0];
  await db.update(users).set({ state: 'searching_connection' }).where(eq(users.telegram_id, Number(userId))).run();
  await sendPrompt(userId, '🔎 د ملګري لټون پیل شو.\n\n⏳ د مناسب کس لټون تر ۲ دقیقو دوام کوي. که وخت تېر شي، د ستا راتلونکي پیغام یا تڼۍ پر مهال به لټون لغوه شي.\n\n⭐ د منلو پر مهال به ' + cost + ' ستوری کم شي.',
    { inline_keyboard: [[{ text: '❌ لټون لغوه کول', callback_data: 'conn:cancel_search:' + search.id }]] }, user);
  await tryOfferSearches();
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
}
async function resolveBotGame(game) {
  if (!game || game.status !== 'waiting') return;
  const player = await getUser(game.player_id);
  if (!player) return;
  const fee = Number(await getSetting('game_fee_stars', 0.5)), winStars = Number(await getSetting('game_win_stars', 3));
  const totalLoss = Number(await getSetting('game_bot_loss_total_stars', 3.5)), points = Number(await getSetting('game_win_points', 1));
  const balance = Number(player.stars || 0);
  if (balance < Number(await getSetting('game_min_stars', 3.5))) {
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run(); return;
  }

  let playerDice, botDice;
  try {
    playerDice = await api.sendDice({ chat_id: Number(player.telegram_id), emoji: '🎲' });
    botDice = await api.sendDice({ chat_id: Number(player.telegram_id), emoji: '🎲' });
  } catch (error) {
    console.error('Bot game dice failed', { gameId: game.id, playerId: player.telegram_id, error: error });
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د ګېم تخنیکي ستونزه وه؛ ګېم لغوه شو او فیس نه دی اخیستل شوی. بیا هڅه وکړه.' }); } catch (e) {}
    return;
  }
  const pRoll = Number(playerDice && playerDice.dice && playerDice.dice.value || 0), bRoll = Number(botDice && botDice.dice && botDice.dice.value || 0);
  let current = balance - fee, outcome = '🤝 مساوي! د لوبې فیس حساب شو؛ اضافي جایزه نشته.';
  if (pRoll > bRoll) {
    current += winStars;
    await db.update(users).set({ stars: current, points: Number(player.points || 0) + points }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
    outcome = '🎉 ته وګټلې! +' + winStars + ' ستوري او +' + points + ' نمره.';
  } else if (bRoll > pRoll) {
    const extra = Math.min(Math.max(0, totalLoss - fee), current);
    current -= extra;
    await db.update(users).set({ stars: current }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
    outcome = '🤖 بوټ وګټله! ټول لګښت: ' + (fee + extra) + ' ستوري.';
  } else await db.update(users).set({ stars: current }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
  await db.update(game_sessions).set({ status: 'completed', player_roll: pRoll, opponent_roll: bRoll, updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run();
  try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '🎲 د ګېم پایله\n\nستا 🎲: ' + pRoll + '\n\nد بوټ 🎲: ' + bRoll + '\n\n' + outcome + '\n\n⭐ اوسنی بیلانس: ' + current }); } catch (e) {}
}
async function tryMatchGames() {
  const games = await db.select().from(game_sessions).all(), allUsers = await db.select().from(users).all(), sessions = await db.select().from(chat_sessions).all();
  const wait = Math.max(1, Number(await getSetting('game_wait_seconds', 120)) || 120), opponentMin = Number(await getSetting('game_opponent_min_stars', 3.5)), now = Date.now();
  for (const game of games.filter(row => row.status === 'waiting' || row.status === 'pending')) {
    const timerStart = game.status === 'pending' ? (game.updated_at || game.created_at) : game.created_at;
    const age = now - Date.parse(timerStart || '');
    if (!Number.isFinite(age) || age >= wait * 1000) continue;
    if (game.status !== 'waiting') continue;
    const isFreshGame = row => { const start = row.status === 'waiting' ? (row.created_at || row.updated_at) : (row.updated_at || row.created_at); const age = now - Date.parse(start || ''); return Number.isFinite(age) && age < wait * 1000; };
    const busy = new Set(games.filter(row => ['pending','playing'].includes(row.status) && isFreshGame(row)).flatMap(row => [Number(row.player_id), Number(row.opponent_id || 0)]).concat(games.filter(row => row.status === 'waiting' && isFreshGame(row)).map(row => Number(row.player_id))));
    const candidates = allUsers.filter(candidate => {
      const id = Number(candidate.telegram_id), active = Date.parse(candidate.last_active_at || '');
      if (id === Number(game.player_id) || id === Number(game.opponent_id || 0) || Number(candidate.is_blocked) === 1 || Number(candidate.stars || 0) < opponentMin) return false;
      if (!Number.isFinite(active) || now - active > 120000 || busy.has(id)) return false;
      if (sessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === id || Number(row.second_user_telegram_id) === id))) return false;
      return true;
    }).sort((a,b)=>Date.parse(b.last_active_at || '')-Date.parse(a.last_active_at || ''));
    if (!candidates.length) continue;
    const candidate = candidates[0];
    await db.update(game_sessions).set({ opponent_id: Number(candidate.telegram_id), status: 'pending', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run();
    game.status = 'pending'; game.opponent_id = Number(candidate.telegram_id);
    try { await api.sendMessage({ chat_id: Number(candidate.telegram_id), text: '🎲 یو فعال کارن غواړي له تا سره د ګېم لوبه وکړي. د منلو یا ردولو انتخاب وکړه.',
      reply_markup: { inline_keyboard: [[{ text: '✅ ګېم منل', callback_data: 'game:accept:' + game.id }, { text: '❌ ردول', callback_data: 'game:reject:' + game.id }]] } }); }
    catch (e) { await db.update(game_sessions).set({ status: 'waiting', opponent_id: null, updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run(); }
  }
}
async function resolveUserGame(game) {
  if (!game || !['pending','playing'].includes(game.status) || !game.opponent_id) return;
  const player = await getUser(game.player_id), opponent = await getUser(game.opponent_id);
  if (!player || !opponent) {
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(eq(game_sessions.id, Number(game.id))).run();
    for (const item of [player, opponent]) {
      if (item) try { await api.sendMessage({ chat_id: Number(item.telegram_id), text: '⚠️ ګېم لغوه شو، ځکه یو لوبغاړی نور موجود نه دی. فیس نه دی اخیستل شوی.' }); } catch (e) {}
    }
    return;
  }
  const fee = Number(await getSetting('game_fee_stars', 0.5)), winStars = Number(await getSetting('game_win_stars', 3)), points = Number(await getSetting('game_win_points', 1));
  if (Number(player.stars || 0) < fee + winStars || Number(opponent.stars || 0) < fee + winStars) {
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د لوبې لپاره د یوه لوبغاړي بیلانس کافي نه دی.' }); } catch (e) {}
    try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: '⚠️ د لوبې لپاره د یوه لوبغاړي بیلانس کافي نه دی.' }); } catch (e) {}
    return;
  }
  const pDice = await api.sendDice({ chat_id: Number(player.telegram_id), emoji: '🎲' });
  const oDice = await api.sendDice({ chat_id: Number(opponent.telegram_id), emoji: '🎲' });
  const playerBalance = Number(player.stars || 0) - fee, opponentBalance = Number(opponent.stars || 0) - fee;
  try { if (pDice && pDice.message_id) await api.copyMessage({ chat_id: Number(opponent.telegram_id), from_chat_id: Number(player.telegram_id), message_id: Number(pDice.message_id) }); } catch (e) {}
  try { if (oDice && oDice.message_id) await api.copyMessage({ chat_id: Number(player.telegram_id), from_chat_id: Number(opponent.telegram_id), message_id: Number(oDice.message_id) }); } catch (e) {}
  const pRoll = Number(pDice && pDice.dice && pDice.dice.value || 0), oRoll = Number(oDice && oDice.dice && oDice.dice.value || 0);
  let pFinal = playerBalance, oFinal = opponentBalance, result = '🤝 مساوي! دواړه یوازې د لوبې فیس ورکوي.';
  if (pRoll > oRoll) {
    pFinal += winStars; oFinal = Math.max(0, oFinal - winStars);
    await db.update(users).set({ stars: pFinal, points: Number(player.points || 0) + points }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
    await db.update(users).set({ stars: oFinal }).where(eq(users.telegram_id, Number(opponent.telegram_id))).run();
    result = '🏆 ' + (player.name || player.first_name || 'لومړي لوبغاړي') + ' وګټله.';
  } else if (oRoll > pRoll) {
    oFinal += winStars; pFinal = Math.max(0, pFinal - winStars);
    await db.update(users).set({ stars: oFinal, points: Number(opponent.points || 0) + points }).where(eq(users.telegram_id, Number(opponent.telegram_id))).run();
    await db.update(users).set({ stars: pFinal }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
    result = '🏆 ' + (opponent.name || opponent.first_name || 'دویم لوبغاړي') + ' وګټله.';
  } else {
    await db.update(users).set({ stars: pFinal }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
    await db.update(users).set({ stars: oFinal }).where(eq(users.telegram_id, Number(opponent.telegram_id))).run();
  }
  await db.update(game_sessions).set({ status: 'completed', player_roll: pRoll, opponent_roll: oRoll, updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run();
  for (const pair of [{ id: Number(player.telegram_id), mine: pRoll, other: oRoll, balance: pFinal }, { id: Number(opponent.telegram_id), mine: oRoll, other: pRoll, balance: oFinal }]) {
    try { await api.sendMessage({ chat_id: pair.id, text: '🎲 د ګېم پایله\n\nستا 🎲: ' + pair.mine + '\n\nد سیال 🎲: ' + pair.other + '\n\n' + result + '\n\n⭐ اوسنی بیلانس: ' + pair.balance }); } catch (e) {}
  }
}
async function handleConnectionCallback(query, actor, data, actorId, chatId) {
  const p = data.split(':');
  if (p[1] === 'confirm') { await startConnectionSearch(actorId, p[2] === 'find' ? 'find' : 'random'); return; }
  if (p[1] === 'cancel') {
    const rows = await db.select().from(connection_requests).where(eq(connection_requests.requester_id, actorId)).all();
    for (const row of rows.filter(item => item.status === 'searching' || item.status === 'pending')) await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(row.id))).run();
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
    actor.state = 'ready'; await showMain(chatId, actor, '❌ لټون لغوه شو.'); return;
  }
  if (p[1] === 'cancel_search') {
    const rows = await db.select().from(connection_requests).where(eq(connection_requests.requester_id, actorId)).all();
    for (const row of rows.filter(item => item.status === 'searching' || item.status === 'pending')) await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(row.id))).run();
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, actorId)).run();
    actor.state = 'ready'; await showMain(chatId, actor, '❌ لټون لغوه شو.'); return;
  }
  if (p[1] === 'reject' || p[1] === 'accept') {
    const offerId = Number(p[2]), rows = await db.select().from(connection_requests).all();
    const offer = rows.find(row => Number(row.id) === offerId && Number(row.recipient_id) === actorId && row.status === 'pending');
    if (!offer) { await sendPrompt(chatId, '⌛ دا غوښتنه نوره فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor); return; }
    const search = rows.find(row => Number(row.requester_id) === Number(offer.requester_id) && row.status === 'searching' && !row.recipient_id);
    if (p[1] === 'reject') {
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, offerId)).run();
      await tryOfferSearches(); return;
    }
    if (!search) { await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, offerId)).run(); await sendPrompt(chatId, '⌛ د غوښتونکي لټون پای ته رسېدلی.', mainKeyboard(actor, await isAdmin(actorId)), actor); return; }
    const requester = await getUser(offer.requester_id), cost = Number(await getSetting('connection_cost_stars', 1));
    if (!requester || Number(requester.stars || 0) < cost) {
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, offerId)).run();
      if (requester) try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: '⚠️ د اړیکې لپاره ستوري نور کافي نه دي. لټون پای ته ورسېد.' }); } catch (e) {}
      await tryOfferSearches(); return;
    }
    const requesterSession = await activeSessionFor(requester.telegram_id);
    if (requesterSession) { await sendPrompt(chatId, '⚠️ غوښتونکی لا له بل کس سره په اړیکه کې دی.', mainKeyboard(actor, await isAdmin(actorId)), actor); return; }
    const oldSession = await activeSessionFor(actorId);
    if (oldSession) await endConnection(oldSession, 'accepted_new_request');
    await db.update(users).set({ stars: Number(requester.stars || 0) - cost, state: 'ready' }).where(eq(users.telegram_id, Number(requester.telegram_id))).run();
    await db.update(connection_requests).set({ status: 'connected', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(search.id))).run();
    await db.update(connection_requests).set({ status: 'accepted', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, offerId)).run();
    for (const row of rows.filter(item => Number(item.requester_id) === Number(requester.telegram_id) && item.status === 'pending' && Number(item.id) !== offerId)) await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(row.id))).run();
    for (const row of rows.filter(item => Number(item.requester_id) === actorId && ['searching','pending'].includes(item.status))) {
      await db.update(connection_requests).set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(eq(connection_requests.id, Number(row.id))).run();
    }
    const now = new Date().toISOString();
    await db.insert(chat_sessions).values({ first_user_telegram_id: Number(requester.telegram_id), second_user_telegram_id: actorId, status: 'connected',
      created_at: now, connected_at: now, last_activity_at: now, ended_at: null, end_reason: null }).run();
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
    } else {
      await db.insert(user_likes).values({ liker_id: actorId, liked_id: targetId, created_at: new Date().toISOString() }).run();
    }
    // Rebuild the displayed counter from the source-of-truth rows so old duplicates or failed updates cannot drift it.
    const currentLikes = await db.select().from(user_likes).where(eq(user_likes.liked_id, targetId)).all();
    await db.update(users).set({ likes: currentLikes.length }).where(eq(users.telegram_id, targetId)).run();
    const session = await db.select().from(chat_sessions).where(eq(chat_sessions.id, sessionId)).get();
    if (session && session.status === 'connected') await showSessionProfile(session, actorId);
    return;
  }
  if (action === 'rate') {
    const rating = Number(p[3]);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
    const rows = await db.select().from(user_ratings).where(eq(user_ratings.session_id, sessionId)).all();
    if (rows.some(row => Number(row.rater_id) === actorId && Number(row.rated_id) === targetId)) {
      await sendPrompt(chatId, '⭐ په دې اړیکه کې دې مخکې نمره ورکړې ده.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
    }
    await db.insert(user_ratings).values({ session_id: sessionId, rater_id: actorId, rated_id: targetId, rating, created_at: new Date().toISOString() }).run();
    await db.update(users).set({ points: Number(target.points || 0) + rating }).where(eq(users.telegram_id, targetId)).run();
    await sendPrompt(chatId, '✅ ' + rating + ' نمرې دې کارن ته ورکړې.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
  }
  if (action === 'profile') {
    const session = await db.select().from(chat_sessions).where(eq(chat_sessions.id, sessionId)).get();
    if (session && session.status === 'connected') await showSessionProfile(session, actorId);
    else await sendPrompt(chatId, await publicProfileText(target, actorId), mainKeyboard(actor, await isAdmin(actorId)), actor);
    return;
  }
  if (action === 'report') {
    await db.insert(reports).values({ reporter_telegram_id: actorId, reported_telegram_id: targetId, reason: 'Random Connect connection report', status: 'pending', created_at: new Date().toISOString() }).run();
    await sendPrompt(chatId, '🚩 راپور ثبت شو. مننه چې خبر دې راکړ.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
  }
  if (action === 'delete_recent') {
    const cutoff = Date.now() - 10 * 60000, rows = await db.select().from(chat_messages).all();
    let deleted = 0;
    for (const row of rows.filter(item => Number(item.sender_id) === targetId && Number(item.recipient_id) === actorId && Number(item.session_id) === sessionId && Date.parse(item.created_at || '') >= cutoff && Number(item.recipient_message_id) > 0)) {
      try { await api.deleteMessage({ chat_id: actorId, message_id: Number(row.recipient_message_id) }); deleted += 1; } catch (e) {}
      await db.update(chat_messages).set({ recipient_message_id: 0 }).where(eq(chat_messages.id, Number(row.id))).run();
    }
    await sendPrompt(chatId, '🗑 د وروستیو ۱۰ دقیقو د ملګري ' + deleted + ' لېږل شوي پیغامونه حذف شول. د Telegram د محدودیت له امله د کارن خپل اصلي پیغامونه نه حذف کېږي.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;
  }
}
async function handleGameCallback(query, actor, data, actorId, chatId) {
  const p = data.split(':'), action = p[1], gameId = Number(p[2]);
  const rows = await db.select().from(game_sessions).all(), game = rows.find(row => Number(row.id) === gameId);
  if (action === 'cancel') {
    for (const row of rows.filter(item => Number(item.player_id) === actorId && ['waiting','pending'].includes(item.status))) await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(row.id))).run();
    await showMain(chatId, actor, '❌ ګېم لغوه شو.'); return;
  }
  if (!game || !['waiting','pending'].includes(game.status)) { await sendPrompt(chatId, '⌛ دا ګېم نور فعال نه دی.', mainKeyboard(actor, await isAdmin(actorId)), actor); return; }
  if (action === 'reject' && Number(game.opponent_id) === actorId) {
    await db.update(game_sessions).set({ status: 'waiting', opponent_id: null, updated_at: new Date().toISOString() }).where(eq(game_sessions.id, gameId)).run();
    await tryMatchGames(); return;
  }
  if (action === 'accept' && Number(game.opponent_id) === actorId) {
    await db.update(game_sessions).set({ status: 'playing', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, gameId)).run();
    const playing = Object.assign({}, game, { status: 'playing' });
    try {
      await resolveUserGame(playing);
    } catch (error) {
      console.error('User game resolution failed', { gameId: gameId, actorId: actorId, error: error });
      await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, gameId)).run();
      try { await api.sendMessage({ chat_id: Number(game.player_id), text: '⚠️ دا ګېم تخنیکي ستونزې له امله بشپړ نه شو. که لوبه نه وي ترسره شوې، فیس نه دی اخیستل شوی.' }); } catch (e) {}
      try { if (game.opponent_id) await api.sendMessage({ chat_id: Number(game.opponent_id), text: '⚠️ دا ګېم تخنیکي ستونزې له امله بشپړ نه شو. بیا هڅه کولای شئ.' }); } catch (e) {}
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
  try { if (await expireUserTimedActions(id)) return; } catch (e) { console.error('User timed-action check failed', e); }
  try { await tryOfferSearches(); } catch (e) { console.error('Connection matching check failed', e); }
  try { await tryMatchGames(); } catch (e) { console.error('Game matching check failed', e); }
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
    console.error('Random Connect callback_query handler error', { data: query && query.data, from: query && query.from && query.from.id, error });
    if (query && query.message && query.message.chat && query.message.chat.id) {
      try { await api.sendMessage({ chat_id: query.message.chat.id, text: '⚠️ تخنیکي ستونزه رامنځته شوه. بیا هڅه وکړه.' }); } catch (e) {}
    }
  }
}
