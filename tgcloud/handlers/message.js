import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../schema.js';

const LANGUAGES = [
  { code: 'ps', label: 'پښتو' },
  { code: 'fa', label: 'دری' },
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'ar', label: 'العربية' },
];

const COUNTRIES = [
  { code: 'AF', label: '🇦🇫 Afghanistan / افغانستان' },
  { code: 'PK', label: '🇵🇰 Pakistan / پاکستان' },
  { code: 'IN', label: '🇮🇳 India / هند / بھارت' },
  { code: 'IR', label: '🇮🇷 Iran / ایران' },
  { code: 'TJ', label: '🇹🇯 Tajikistan / تاجکستان' },
  { code: 'TR', label: '🇹🇷 Türkiye / ترکیه' },
  { code: 'AE', label: '🇦🇪 UAE / امارات' },
  { code: 'SA', label: '🇸🇦 Saudi Arabia / سعودي عربستان' },
  { code: 'GB', label: '🇬🇧 United Kingdom / بریتانیا' },
  { code: 'US', label: '🇺🇸 United States / امریکا' },
  { code: 'OTHER', label: '🌍 Other / نور هېوادونه' },
];

const TEXT = {
  ps: {
    chooseLanguage: '🌐 خپله ژبه وټاکه:',
    chooseCountry: '🌍 خپل هېواد وټاکه:',
    languageSaved: '✅ ژبه دې ثبت شوه.',
    ready: '✅ ستا ژبه او هېواد ثبت شول. د تصادفي ملګري موندلو برخه به په بل پړاو کې فعاله کړو.',
    changeLanguage: '🌐 ژبه بدلول',
    changeCountry: '🌍 هېواد بدلول',
    selectLanguage: 'له تڼیو څخه یوه ژبه وټاکه.',
    selectCountry: 'له تڼیو څخه یو هېواد وټاکه.',
    blocked: 'ستا حساب محدود شوی دی. له ملاتړ سره اړیکه ونیسه.'
  },
  fa: {
    chooseLanguage: '🌐 زبان خود را انتخاب کنید:',
    chooseCountry: '🌍 کشور خود را انتخاب کنید:',
    languageSaved: '✅ زبان شما ذخیره شد.',
    ready: '✅ زبان و کشور شما ذخیره شد. بخش پیدا کردن گفت‌وگوی تصادفی را در مرحله بعد فعال می‌کنیم.',
    changeLanguage: '🌐 تغییر زبان',
    changeCountry: '🌍 تغییر کشور',
    selectLanguage: 'لطفاً یکی از زبان‌ها را با دکمه‌ها انتخاب کنید.',
    selectCountry: 'لطفاً یکی از کشورها را با دکمه‌ها انتخاب کنید.',
    blocked: 'حساب شما محدود شده است. با پشتیبانی تماس بگیرید.'
  },
  en: {
    chooseLanguage: '🌐 Choose your language:',
    chooseCountry: '🌍 Choose your country:',
    languageSaved: '✅ Your language has been saved.',
    ready: '✅ Your language and country are saved. Random partner matching will be enabled in the next stage.',
    changeLanguage: '🌐 Change language',
    changeCountry: '🌍 Change country',
    selectLanguage: 'Please choose a language using the buttons.',
    selectCountry: 'Please choose a country using the buttons.',
    blocked: 'Your account is restricted. Please contact support.'
  },
  ur: {
    chooseLanguage: '🌐 اپنی زبان منتخب کریں:',
    chooseCountry: '🌍 اپنا ملک منتخب کریں:',
    languageSaved: '✅ آپ کی زبان محفوظ ہوگئی۔',
    ready: '✅ آپ کی زبان اور ملک محفوظ ہوگئے۔ اگلے مرحلے میں رینڈم ساتھی تلاش کرنے کا نظام فعال کریں گے۔',
    changeLanguage: '🌐 زبان تبدیل کریں',
    changeCountry: '🌍 ملک تبدیل کریں',
    selectLanguage: 'براہ کرم بٹنوں سے زبان منتخب کریں۔',
    selectCountry: 'براہ کرم بٹنوں سے ملک منتخب کریں۔',
    blocked: 'آپ کا اکاؤنٹ محدود ہے۔ سپورٹ سے رابطہ کریں۔'
  },
  ar: {
    chooseLanguage: '🌐 اختر لغتك:',
    chooseCountry: '🌍 اختر بلدك:',
    languageSaved: '✅ تم حفظ لغتك.',
    ready: '✅ تم حفظ اللغة والبلد. سنفعّل نظام العثور على شريك عشوائي في المرحلة التالية.',
    changeLanguage: '🌐 تغيير اللغة',
    changeCountry: '🌍 تغيير البلد',
    selectLanguage: 'يرجى اختيار لغة باستخدام الأزرار.',
    selectCountry: 'يرجى اختيار بلد باستخدام الأزرار.',
    blocked: 'حسابك مقيّد. يرجى التواصل مع الدعم.'
  }
};

function languageKeyboard() {
  return {
    keyboard: [
      [{ text: 'پښتو' }, { text: 'دری' }],
      [{ text: 'English' }, { text: 'اردو' }],
      [{ text: 'العربية' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}

function countryKeyboard() {
  return {
    keyboard: [
      [{ text: COUNTRIES[0].label }, { text: COUNTRIES[1].label }],
      [{ text: COUNTRIES[2].label }, { text: COUNTRIES[3].label }],
      [{ text: COUNTRIES[4].label }, { text: COUNTRIES[5].label }],
      [{ text: COUNTRIES[6].label }, { text: COUNTRIES[7].label }],
      [{ text: COUNTRIES[8].label }, { text: COUNTRIES[9].label }],
      [{ text: COUNTRIES[10].label }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}

function mainKeyboard(language) {
  const t = TEXT[language] || TEXT.ps;
  return {
    keyboard: [
      [{ text: t.changeLanguage }, { text: t.changeCountry }]
    ],
    resize_keyboard: true
  };
}

async function send(chatId, text, replyMarkup) {
  await api.sendMessage({
    chat_id: chatId,
    text: text,
    reply_markup: replyMarkup
  });
}

async function showLanguage(chatId, language) {
  const t = TEXT[language] || TEXT.ps;
  await send(chatId, t.chooseLanguage, languageKeyboard());
}

async function showCountry(chatId, language) {
  const t = TEXT[language] || TEXT.ps;
  await send(chatId, t.chooseCountry, countryKeyboard());
}

async function showReady(chatId, user) {
  const language = TEXT[user.language] ? user.language : 'ps';
  const t = TEXT[language];
  await send(chatId, t.ready, mainKeyboard(language));
}

export default async function (message) {
  if (!message || !message.chat || !message.from) return;
  if (message.chat.type !== 'private') return;

  const chatId = message.chat.id;
  const telegramId = Number(message.from.id);
  const input = String(message.text || '').trim();

  if (!Number.isSafeInteger(telegramId) || telegramId <= 0) return;

  const now = new Date().toISOString();

  await db.insert(users).values({
    telegram_id: telegramId,
    username: message.from.username || null,
    first_name: message.from.first_name || null,
    language: 'ps',
    country: null,
    state: 'choose_language',
    is_blocked: 0,
    created_at: now
  }).onConflictDoUpdate({
    target: users.telegram_id,
    set: {
      username: message.from.username || null,
      first_name: message.from.first_name || null
    }
  }).run();

  let user = await db.select().from(users)
    .where(eq(users.telegram_id, telegramId))
    .get();

  if (!user) return;

  if (Number(user.is_blocked) === 1) {
    const blockedText = (TEXT[user.language] || TEXT.ps).blocked;
    await send(chatId, blockedText, { remove_keyboard: true });
    return;
  }

  if (input === '/start') {
    if (user.country) {
      await db.update(users).set({ state: 'ready' })
        .where(eq(users.telegram_id, telegramId)).run();
      user.state = 'ready';
      await showReady(chatId, user);
      return;
    }

    await db.update(users).set({ state: 'choose_language' })
      .where(eq(users.telegram_id, telegramId)).run();
    await showLanguage(chatId, user.language || 'ps');
    return;
  }

  const languageButton = input === '🌐 ژبه بدلول' ||
    input === '🌐 تغییر زبان' ||
    input === '🌐 Change language' ||
    input === '🌐 زبان تبدیل کریں' ||
    input === '🌐 تغيير اللغة';

  const countryButton = input === '🌍 هېواد بدلول' ||
    input === '🌍 تغییر کشور' ||
    input === '🌍 Change country' ||
    input === '🌍 ملک تبدیل کریں' ||
    input === '🌍 تغيير البلد';

  if (languageButton || input === '/language') {
    await db.update(users).set({ state: 'choose_language' })
      .where(eq(users.telegram_id, telegramId)).run();
    await showLanguage(chatId, user.language || 'ps');
    return;
  }

  if (countryButton || input === '/country') {
    await db.update(users).set({ state: 'choose_country' })
      .where(eq(users.telegram_id, telegramId)).run();
    await showCountry(chatId, user.language || 'ps');
    return;
  }

  if (user.state === 'choose_language') {
    const selectedLanguage = LANGUAGES.find(function (item) {
      return item.label === input;
    });

    if (!selectedLanguage) {
      await send(chatId, (TEXT[user.language] || TEXT.ps).selectLanguage, languageKeyboard());
      return;
    }

    await db.update(users).set({
      language: selectedLanguage.code,
      state: 'choose_country'
    }).where(eq(users.telegram_id, telegramId)).run();

    const t = TEXT[selectedLanguage.code] || TEXT.ps;
    await send(chatId, t.languageSaved + '\n\n' + t.chooseCountry, countryKeyboard());
    return;
  }

  if (user.state === 'choose_country') {
    const selectedCountry = COUNTRIES.find(function (item) {
      return item.label === input;
    });

    if (!selectedCountry) {
      const t = TEXT[user.language] || TEXT.ps;
      await send(chatId, t.selectCountry, countryKeyboard());
      return;
    }

    await db.update(users).set({
      country: selectedCountry.code,
      state: 'ready'
    }).where(eq(users.telegram_id, telegramId)).run();

    user.language = user.language || 'ps';
    user.country = selectedCountry.code;
    user.state = 'ready';
    await showReady(chatId, user);
    return;
  }

  if (user.country) {
    await showReady(chatId, user);
    return;
  }

  await db.update(users).set({ state: 'choose_language' })
    .where(eq(users.telegram_id, telegramId)).run();
  await showLanguage(chatId, user.language || 'ps');
}
