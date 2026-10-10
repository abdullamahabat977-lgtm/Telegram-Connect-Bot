import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users, admins, required_chats } from '../schema.js';

const ROOT_ADMINS = [7851941608, 7003093962];
const LANGUAGES = [
  { code: 'ps', label: 'پښتو' },
  { code: 'fa', label: 'دری' },
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'ar', label: 'العربية' }
];
const COUNTRIES = [
  { code: 'AF', label: '🇦🇫 افغانستان / Afghanistan' },
  { code: 'PK', label: '🇵🇰 پاکستان / Pakistan' },
  { code: 'IN', label: '🇮🇳 هند / India' },
  { code: 'IR', label: '🇮🇷 ایران / Iran' },
  { code: 'TJ', label: '🇹🇯 تاجکستان / Tajikistan' },
  { code: 'TR', label: '🇹🇷 ترکیه / Türkiye' },
  { code: 'AE', label: '🇦🇪 امارات / UAE' },
  { code: 'SA', label: '🇸🇦 سعودي عربستان / Saudi Arabia' },
  { code: 'GB', label: '🇬🇧 بریتانیا / United Kingdom' },
  { code: 'US', label: '🇺🇸 امریکا / United States' },
  { code: 'OTHER', label: '🌍 بل هېواد / Other' }
];
const AGES = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
const TEXT = {
  ps: {
    country: '🌍 خپل هېواد وټاکه:', gender: '👤 خپل جنسیت وټاکه:',
    age: '🎂 خپل نږدې عمر وټاکه. عمرونه له ۱۲ څخه تر ۴۰ پورې دي؛ نږدې عمر انتخاب کړه:',
    surname: '📝 تخلص اختیاري دی. که یې نه لیکې، لاندې بټن کېکاږه:',
    skip: 'تخلص نه لیکم', membership: '🔐 د بوټ کارولو لپاره په لاندې ټولو ګروپونو یا چینلونو کې ګډون وکړه، بیا د غړیتوب کتلو بټن کېکاږه:',
    joined: '✅ ګډون مې وکړ، بیا یې وګوره', membershipFail: '⚠️ غړیتوب تایید نه شو. په ټولو ګروپونو کې ګډون وکړه او ډاډ ترلاسه کړه چې بوټ د غړیتوب د کتلو اجازه لري.',
    ready: '🎉 ستا پروفایل جوړ شو!', main: 'اصلي مېنو:', saved: '✅ بدلون ثبت شو.'
  },
  fa: {
    country: '🌍 کشور خود را انتخاب کنید:', gender: '👤 جنسیت خود را انتخاب کنید:',
    age: '🎂 نزدیک‌ترین سن خود را از ۱۲ تا ۴۰ سال انتخاب کنید:',
    surname: '📝 نام خانوادگی اختیاری است. برای رد کردن، دکمه زیر را بزنید:',
    skip: 'رد کردن نام خانوادگی', membership: '🔐 برای استفاده از ربات، عضو همه گروه‌ها یا کانال‌های زیر شوید و سپس عضویت را بررسی کنید:',
    joined: '✅ عضو شدم، بررسی کن', membershipFail: '⚠️ عضویت تأیید نشد. عضو همه گروه‌ها شوید و دسترسی بررسی عضویت ربات را بررسی کنید.',
    ready: '🎉 پروفایل شما آماده شد!', main: 'منوی اصلی:', saved: '✅ تغییرات ذخیره شد.'
  },
  en: {
    country: '🌍 Choose your country:', gender: '👤 Choose your gender:',
    age: '🎂 Choose the closest age from 12 to 40:',
    surname: '📝 Surname is optional. Press below to skip:',
    skip: 'Skip surname', membership: '🔐 Join every group or channel below to use the bot, then check your membership:',
    joined: '✅ I joined, check again', membershipFail: '⚠️ Membership is not confirmed. Join all listed groups and ensure the bot can check membership.',
    ready: '🎉 Your profile is ready!', main: 'Main menu:', saved: '✅ Changes saved.'
  },
  ur: {
    country: '🌍 اپنا ملک منتخب کریں:', gender: '👤 اپنی جنس منتخب کریں:',
    age: '🎂 12 سے 40 سال کے درمیان اپنی قریب ترین عمر منتخب کریں:',
    surname: '📝 خاندانی نام اختیاری ہے۔ چھوڑنے کے لیے نیچے بٹن دبائیں:',
    skip: 'خاندانی نام چھوڑیں', membership: '🔐 بوٹ استعمال کرنے کے لیے نیچے دیے گئے تمام گروپس یا چینلز میں شامل ہوں، پھر تصدیق کریں:',
    joined: '✅ شامل ہوگیا، دوبارہ چیک کریں', membershipFail: '⚠️ رکنیت کی تصدیق نہیں ہوئی۔ تمام گروپس میں شامل ہوں اور بوٹ کی اجازت چیک کریں۔',
    ready: '🎉 آپ کا پروفائل تیار ہے!', main: 'مرکزی مینو:', saved: '✅ تبدیلی محفوظ ہوگئی۔'
  },
  ar: {
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
async function sendPrompt(chatId, text, markup, user) {
  if (user && Number(user.last_prompt_id) > 0) await safeDelete(chatId, user.last_prompt_id);
  const sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: markup });
  if (user && sent && sent.message_id) {
    await db.update(users).set({ last_prompt_id: sent.message_id })
      .where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = sent.message_id;
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
async function showMembership(chatId, user, prefix) {
  const t = tx(user);
  const chats = await db.select().from(required_chats).where(eq(required_chats.is_active, 1)).all();
  let text = (prefix ? prefix + '\n\n' : '') + t.membership + '\n\n';
  for (const chat of chats) text += '• ' + chat.title + '\n' + chat.invite_link + '\n\n';
  await sendPrompt(chatId, text, { inline_keyboard: [[{ text: t.joined, callback_data: 'reg:membership:check' }]] }, user);
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
async function showMain(chatId, user, message) {
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
async function handleCallback(query) {
  if (!query || !query.from || !query.message || !query.message.chat || !query.data) return;
  const id = Number(query.from.id);
  const chatId = Number(query.message.chat.id);
  if (!Number.isSafeInteger(id) || id <= 0 || query.message.chat.type !== 'private') return;
  try { await api.answerCallbackQuery({ callback_query_id: query.id }); } catch (e) {}
  const data = String(query.data);
  if (!data.startsWith('reg:')) return;
  let user = await getUser(id);
  if (!user || Number(user.is_blocked) === 1) return;
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
    else await sendPrompt(chatId, (user.language === 'en' ? '✍️ Enter your name:' : user.language === 'fa' ? '✍️ نام خود را بنویسید:' : user.language === 'ur' ? '✍️ اپنا نام لکھیں:' : user.language === 'ar' ? '✍️ اكتب اسمك:' : '✍️ خپل نوم ولیکه:' , { force_reply: true }, user);
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
