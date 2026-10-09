import { api, db } from 'sdk';
import { eq, or, like } from 'sdk/db';
import { users, listings } from 'schema';

const LANGUAGES = {
  ps: {
    name: 'پښتو',
    welcome: '🚀 Telegram Connect ته ښه راغلاست!\n\nد ټیلیګرام چینلونه، ګروپونه او بوټونه ومومئ، خپل توکي ثبت کړئ او اعلانونه وپلټئ.',
    menu: '👇 له لاندې مینو څخه یو انتخاب کړه.',
    search: '🔎 لټون',
    register: '➕ ثبتول',
    ads: '📢 اعلانونه',
    account: '👤 زما حساب',
    help: 'ℹ️ مرسته',
    language: '🌐 ژبه',
    chooseLanguage: '🌐 خپله ژبه وټاکه:',
    helpText: 'ℹ️ لارښود\n\n🔎 لټون — د نوم یا Username له مخې ثبت شوي توکي پیدا کړه.\n➕ ثبتول — خپل چینل، ګروپ یا بوټ ثبت کړه.\n📢 اعلانونه — د اعلانونو په اړه معلومات.\n👤 زما حساب — خپل حساب او ثبت شوي توکي وګوره.\n🌐 ژبه — د بوټ ژبه بدله کړه.',
    chooseType: 'څه شی غواړې ثبت کړې؟',
    channel: '📢 چینل',
    group: '👥 ګروپ',
    bot: '🤖 بوټ',
    askName: 'د خپل چینل، ګروپ یا بوټ نوم ولیکه:',
    askUsername: 'اوس یې Username ولیکه، لکه @MyChannel. که Username نه لري، /skip ولیکه:',
    askDescription: 'لنډه پېژندنه ولیکه، یا د پرېښودلو لپاره /skip ولیکه:',
    saved: '✅ ستا معلومات د کتنې لپاره ثبت شول.',
    cancelled: 'سمه ده، عملیات لغوه شول.',
    noResults: '🔎 کومه پایله ونه موندل شوه. بل نوم یا Username وازمویه.',
    results: '🔎 د لټون پایلې:',
    accountText: '👤 ستا حساب',
    noItems: 'تر اوسه دې هېڅ توکی نه دی ثبت کړی.',
    adsText: '📢 د اعلانونو برخه به د اعلانونو د خپرولو او مدیریت لپاره وکارول شي. د پیسو یا اعلانونو د منلو سیستم تر فعالېدو مخکې هېڅ پیسې مه لېږه.',
    unknown: 'مهرباني وکړه، د مینو له تڼیو څخه یو انتخاب کړه یا /help ولیکه.',
    back: '🏠 اصلي مینو',
    invalid: 'دا ژبه نه پېژندل کېږي. له تڼیو څخه یوه ژبه وټاکه.',
    nameRequired: 'مهرباني وکړه، یو معتبر نوم ولیکه.',
    usernameHint: 'Username باید د @ سره یا بې له @ څخه وي، یا /skip ولیکه.',
    searchPrompt: 'د چینل، ګروپ یا بوټ نوم یا Username ولیکه:',
  },
  fa: {
    name: 'دری',
    welcome: '🚀 به Telegram Connect خوش آمدید!\n\nکانال‌ها، گروه‌ها و ربات‌های تلگرام را پیدا کنید، مورد خود را ثبت کنید و اعلان‌ها را جستجو کنید.',
    menu: '👇 از منوی زیر یک گزینه را انتخاب کنید.',
    search: '🔎 جستجو',
    register: '➕ ثبت',
    ads: '📢 اعلان‌ها',
    account: '👤 حساب من',
    help: 'ℹ️ راهنما',
    language: '🌐 زبان',
    chooseLanguage: '🌐 زبان خود را انتخاب کنید:',
    helpText: 'ℹ️ راهنما\n\n🔎 جستجو — موارد ثبت‌شده را پیدا کنید.\n➕ ثبت — کانال، گروه یا ربات خود را ثبت کنید.\n📢 اعلان‌ها — معلومات اعلان‌ها.\n👤 حساب من — حساب و موارد ثبت‌شده را ببینید.\n🌐 زبان — زبان ربات را تغییر دهید.',
    chooseType: 'چه چیزی را می‌خواهید ثبت کنید؟',
    channel: '📢 کانال',
    group: '👥 گروه',
    bot: '🤖 ربات',
    askName: 'نام کانال، گروه یا ربات خود را بنویسید:',
    askUsername: 'اکنون Username را بفرستید، مانند @MyChannel. اگر ندارد، /skip بنویسید:',
    askDescription: 'یک معرفی کوتاه بنویسید یا برای رد کردن /skip را بفرستید:',
    saved: '✅ معلومات شما برای بررسی ثبت شد.',
    cancelled: 'عملیات لغو شد.',
    noResults: '🔎 نتیجه‌ای پیدا نشد. نام یا Username دیگری را امتحان کنید.',
    results: '🔎 نتایج جستجو:',
    accountText: '👤 حساب شما',
    noItems: 'هنوز موردی ثبت نکرده‌اید.',
    adsText: '📢 این بخش برای نشر و مدیریت اعلان‌ها است. تا فعال‌شدن سیستم رسمی، پولی ارسال نکنید.',
    unknown: 'لطفاً از دکمه‌های منو استفاده کنید یا /help را بفرستید.',
    back: '🏠 منوی اصلی',
    invalid: 'این زبان شناخته نشد. یکی از دکمه‌ها را انتخاب کنید.',
    nameRequired: 'لطفاً یک نام معتبر بنویسید.',
    usernameHint: 'Username را با یا بدون @ بنویسید یا /skip را بفرستید.',
    searchPrompt: 'نام یا Username کانال، گروه یا ربات را بنویسید:',
  },
  en: {
    name: 'English',
    welcome: '🚀 Welcome to Telegram Connect!\n\nDiscover Telegram channels, groups, and bots, submit your own listing, and explore promotions.',
    menu: '👇 Choose an option from the menu below.',
    search: '🔎 Search',
    register: '➕ Submit listing',
    ads: '📢 Advertisements',
    account: '👤 My account',
    help: 'ℹ️ Help',
    language: '🌐 Language',
    chooseLanguage: '🌐 Choose your language:',
    helpText: 'ℹ️ Help\n\n🔎 Search — find listings by name or username.\n➕ Submit listing — add your channel, group, or bot.\n📢 Advertisements — information about promotions.\n👤 My account — view your account and listings.\n🌐 Language — change the bot language.',
    chooseType: 'What would you like to submit?',
    channel: '📢 Channel',
    group: '👥 Group',
    bot: '🤖 Bot',
    askName: 'Enter the name of your channel, group, or bot:',
    askUsername: 'Send its username, e.g. @MyChannel. If it has none, send /skip:',
    askDescription: 'Send a short description, or /skip to leave it blank:',
    saved: '✅ Your listing has been submitted for review.',
    cancelled: 'Operation cancelled.',
    noResults: '🔎 No results found. Try another name or username.',
    results: '🔎 Search results:',
    accountText: '👤 My account',
    noItems: 'You have not submitted any listings yet.',
    adsText: '📢 This section is for promotion management. Do not send money until an official payment and ad-review process is enabled.',
    unknown: 'Please choose a menu button or send /help.',
    back: '🏠 Main menu',
    invalid: 'Unknown language. Please choose one of the buttons.',
    nameRequired: 'Please enter a valid name.',
    usernameHint: 'Send a username with or without @, or send /skip.',
    searchPrompt: 'Enter a channel, group, or bot name or username:',
  },
  ur: {
    name: 'اردو',
    welcome: '🚀 Telegram Connect میں خوش آمدید!\n\nٹیلیگرام چینلز، گروپس اور بوٹس تلاش کریں، اپنی لسٹنگ درج کریں اور اشتہارات دیکھیں۔',
    menu: '👇 نیچے مینو سے ایک اختیار منتخب کریں۔',
    search: '🔎 تلاش',
    register: '➕ درج کریں',
    ads: '📢 اشتہارات',
    account: '👤 میرا اکاؤنٹ',
    help: 'ℹ️ مدد',
    language: '🌐 زبان',
    chooseLanguage: '🌐 اپنی زبان منتخب کریں:',
    helpText: 'ℹ️ مدد\n\n🔎 تلاش — نام یا یوزرنیم سے لسٹنگ تلاش کریں۔\n➕ درج کریں — اپنا چینل، گروپ یا بوٹ شامل کریں۔\n📢 اشتہارات — تشہیر کی معلومات۔\n👤 میرا اکاؤنٹ — اکاؤنٹ اور لسٹنگ دیکھیں۔\n🌐 زبان — زبان تبدیل کریں۔',
    chooseType: 'آپ کیا درج کرنا چاہتے ہیں؟',
    channel: '📢 چینل',
    group: '👥 گروپ',
    bot: '🤖 بوٹ',
    askName: 'اپنے چینل، گروپ یا بوٹ کا نام لکھیں:',
    askUsername: 'یوزرنیم بھیجیں، مثلاً @MyChannel۔ اگر نہیں ہے تو /skip بھیجیں:',
    askDescription: 'مختصر تعارف لکھیں یا چھوڑنے کے لیے /skip بھیجیں:',
    saved: '✅ آپ کی لسٹنگ جائزے کے لیے جمع ہوگئی ہے۔',
    cancelled: 'عمل منسوخ ہوگیا۔',
    noResults: '🔎 کوئی نتیجہ نہیں ملا۔ دوسرا نام یا یوزرنیم آزمائیں۔',
    results: '🔎 تلاش کے نتائج:',
    accountText: '👤 میرا اکاؤنٹ',
    noItems: 'آپ نے ابھی کوئی لسٹنگ جمع نہیں کی۔',
    adsText: '📢 یہ حصہ تشہیر کے انتظام کے لیے ہے۔ ادائیگی کا باقاعدہ نظام فعال ہونے تک رقم نہ بھیجیں۔',
    unknown: 'براہ کرم مینو کا بٹن منتخب کریں یا /help بھیجیں۔',
    back: '🏠 مرکزی مینو',
    invalid: 'یہ زبان معلوم نہیں۔ براہ کرم بٹن منتخب کریں۔',
    nameRequired: 'براہ کرم درست نام درج کریں۔',
    usernameHint: 'یوزرنیم @ کے ساتھ یا بغیر بھیجیں، یا /skip بھیجیں۔',
    searchPrompt: 'چینل، گروپ یا بوٹ کا نام یا یوزرنیم لکھیں:',
  },
  ar: {
    name: 'العربية',
    welcome: '🚀 أهلاً بك في Telegram Connect!\n\nاكتشف قنوات ومجموعات وروبوتات تيليجرام، وسجّل مشروعك وابحث عن الإعلانات.',
    menu: '👇 اختر أحد الخيارات من القائمة.',
    search: '🔎 بحث',
    register: '➕ إضافة',
    ads: '📢 الإعلانات',
    account: '👤 حسابي',
    help: 'ℹ️ مساعدة',
    language: '🌐 اللغة',
    chooseLanguage: '🌐 اختر لغتك:',
    helpText: 'ℹ️ المساعدة\n\n🔎 بحث — ابحث بالاسم أو اسم المستخدم.\n➕ إضافة — سجّل قناتك أو مجموعتك أو روبوتك.\n📢 الإعلانات — معلومات الترويج.\n👤 حسابي — اعرض حسابك وإضافاتك.\n🌐 اللغة — غيّر لغة الروبوت.',
    chooseType: 'ماذا تريد أن تضيف؟',
    channel: '📢 قناة',
    group: '👥 مجموعة',
    bot: '🤖 روبوت',
    askName: 'اكتب اسم القناة أو المجموعة أو الروبوت:',
    askUsername: 'أرسل اسم المستخدم مثل @MyChannel. إذا لم يوجد، أرسل /skip:',
    askDescription: 'اكتب وصفاً قصيراً أو أرسل /skip لتخطيه:',
    saved: '✅ تم إرسال قائمتك للمراجعة.',
    cancelled: 'تم إلغاء العملية.',
    noResults: '🔎 لم يتم العثور على نتائج. جرّب اسماً آخر.',
    results: '🔎 نتائج البحث:',
    accountText: '👤 حسابي',
    noItems: 'لم تضف أي عناصر بعد.',
    adsText: '📢 هذا القسم لإدارة الترويج. لا ترسل أي أموال قبل تفعيل نظام دفع ومراجعة رسمي.',
    unknown: 'يرجى اختيار زر من القائمة أو إرسال /help.',
    back: '🏠 القائمة الرئيسية',
    invalid: 'اللغة غير معروفة. اختر أحد الأزرار.',
    nameRequired: 'يرجى كتابة اسم صحيح.',
    usernameHint: 'أرسل اسم المستخدم مع @ أو بدونه، أو أرسل /skip.',
    searchPrompt: 'اكتب اسم القناة أو المجموعة أو الروبوت أو اسم المستخدم:',
  },
};

const LANG_BUTTONS = {
  ps: '🇦🇫 پښتو',
  fa: '🇦🇫 دری',
  en: '🇬🇧 English',
  ur: '🇵🇰 اردو',
  ar: '🇸🇦 العربية',
};

const LANGUAGE_FROM_BUTTON = Object.fromEntries(
  Object.entries(LANG_BUTTONS).map(([code, label]) => [label, code])
);

function mainKeyboard(t) {
  return {
    keyboard: [
      [{ text: t.search }, { text: t.register }],
      [{ text: t.ads }, { text: t.account }],
      [{ text: t.help }, { text: t.language }],
    ],
    resize_keyboard: true,
  };
}

function languageKeyboard() {
  return {
    keyboard: [
      [{ text: LANG_BUTTONS.ps }, { text: LANG_BUTTONS.fa }],
      [{ text: LANG_BUTTONS.en }, { text: LANG_BUTTONS.ur }],
      [{ text: LANG_BUTTONS.ar }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

function typeKeyboard(t) {
  return {
    keyboard: [
      [{ text: t.channel }, { text: t.group }],
      [{ text: t.bot }],
      [{ text: t.back }],
    ],
    resize_keyboard: true,
  };
}

function getLanguage(userRow) {
  return LANGUAGES[userRow?.language] ? userRow.language : 'ps';
}

async function send(chatId, text, reply_markup) {
  const params = { chat_id: chatId, text };
  if (reply_markup) params.reply_markup = reply_markup;
  await api.sendMessage(params);
}

async function getOrCreateUser(from) {
  let row = await db.select().from(users)
    .where(eq(users.telegram_id, from.id)).get();

  if (!row) {
    await db.insert(users).values({
      telegram_id: from.id,
      username: from.username ?? null,
      first_name: from.first_name ?? 'User',
      language: 'ps',
      state: null,
      draft_type: null,
      draft_name: null,
      created_at: new Date().toISOString(),
    }).run();

    row = await db.select().from(users)
      .where(eq(users.telegram_id, from.id)).get();
  } else {
    await db.update(users).set({
      username: from.username ?? null,
      first_name: from.first_name ?? 'User',
    }).where(eq(users.telegram_id, from.id)).run();
  }

  return row;
}

async function updateUser(userRow, values) {
  await db.update(users).set(values).where(eq(users.id, userRow.id)).run();
  return await db.select().from(users).where(eq(users.id, userRow.id)).get();
}

async function showMain(chatId, userRow, prefix = '') {
  const t = LANGUAGES[getLanguage(userRow)];
  await send(chatId, [prefix, t.welcome, t.menu].filter(Boolean).join('\n\n'), mainKeyboard(t));
}

function normalizeUsername(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutAt = trimmed.replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{5,32}$/.test(withoutAt)) return undefined;
  return '@' + withoutAt;
}

export default async function (message) {
  if (!message?.chat?.id || !message?.from) return;

  const chatId = message.chat.id;
  const text = (message.text ?? '').trim();
  const from = message.from;
  const isPrivate = message.chat.type === 'private';

  if (!text) return;
  if (!isPrivate) {
    // The directory flow is intended for private chats. Avoid storing group chatter.
    return;
  }

  let userRow = await getOrCreateUser(from);
  let language = getLanguage(userRow);
  let t = LANGUAGES[language];

  if (text === '/cancel') {
    userRow = await updateUser(userRow, { state: null, draft_type: null, draft_name: null });
    t = LANGUAGES[getLanguage(userRow)];
    await showMain(chatId, userRow, t.cancelled);
    return;
  }

  if (text === '/start' || text.startsWith('/start ')) {
    if (userRow.language === 'ps' && !userRow.state) {
      await send(chatId, '🌐 Choose your language / خپله ژبه وټاکه:', languageKeyboard());
      return;
    }
    await showMain(chatId, userRow);
    return;
  }

  if (text === '/language' || text === t.language || text === '🌐 Language' || text === '🌐 ژبه' || text === '🌐 زبان' || text === '🌐 اللغة') {
    await send(chatId, '🌐 Choose your language / خپله ژبه وټاکه:', languageKeyboard());
    return;
  }

  if (LANGUAGE_FROM_BUTTON[text]) {
    userRow = await updateUser(userRow, {
      language: LANGUAGE_FROM_BUTTON[text],
      state: null,
      draft_type: null,
      draft_name: null,
    });
    t = LANGUAGES[getLanguage(userRow)];
    await showMain(chatId, userRow, '✅ ' + t.name);
    return;
  }

  // Resume a multi-step registration flow.
  if (userRow.state === 'listing_name') {
    if (text.startsWith('/')) {
      await send(chatId, t.nameRequired);
      return;
    }
    userRow = await updateUser(userRow, { draft_name: text, state: 'listing_username' });
    await send(chatId, t.askUsername, { keyboard: [[{ text: '/skip' }], [{ text: t.back }]], resize_keyboard: true });
    return;
  }

  if (userRow.state === 'listing_username') {
    let username = null;
    if (text.toLowerCase() !== '/skip') {
      username = normalizeUsername(text);
      if (username === undefined) {
        await send(chatId, t.usernameHint);
        return;
      }
    }
    userRow = await updateUser(userRow, { state: 'listing_description' });
    // The username is stored temporarily in the state field as JSON-safe text is not needed;
    // retain it in draft_type only would overwrite the selected listing type, so keep it in state.
    await updateUser(userRow, { state: 'listing_description:' + (username ?? '') });
    await send(chatId, t.askDescription, { keyboard: [[{ text: '/skip' }], [{ text: t.back }]], resize_keyboard: true });
    return;
  }

  if (userRow.state?.startsWith('listing_description:')) {
    const rawUsername = userRow.state.slice('listing_description:'.length);
    const username = rawUsername || null;
    const description = text.toLowerCase() === '/skip' ? null : text;
    const type = userRow.draft_type;
    const name = userRow.draft_name;
    if (!type || !name) {
      userRow = await updateUser(userRow, { state: null, draft_type: null, draft_name: null });
      await showMain(chatId, userRow, t.cancelled);
      return;
    }
    await db.insert(listings).values({
      owner_id: userRow.id,
      type,
      name,
      username,
      description,
      category: null,
      status: 'pending',
      created_at: new Date().toISOString(),
    }).run();
    userRow = await updateUser(userRow, { state: null, draft_type: null, draft_name: null });
    t = LANGUAGES[getLanguage(userRow)];
    await showMain(chatId, userRow, t.saved);
    return;
  }

  if (text === t.back || text === '🏠 اصلي مینو' || text === '🏠 منوی اصلی' || text === '🏠 مرکزی مینو') {
    userRow = await updateUser(userRow, { state: null, draft_type: null, draft_name: null });
    await showMain(chatId, userRow);
    return;
  }

  if (text === t.help || text === '/help') {
    await send(chatId, t.helpText, mainKeyboard(t));
    return;
  }

  if (text === t.account) {
    const ownListings = await db.select().from(listings)
      .where(eq(listings.owner_id, userRow.id)).all();
    const listingSummary = ownListings.length
      ? ownListings.map((item, index) => `${index + 1}. ${item.name} — ${item.status}`).join('\n')
      : t.noItems;
    await send(chatId,
      `${t.accountText}\n\n🆔 Telegram ID: ${from.id}\n👤 ${from.first_name ?? ''}\n🔗 ${from.username ? '@' + from.username : '—'}\n📦 ${ownListings.length}\n\n${listingSummary}`,
      mainKeyboard(t));
    return;
  }

  if (text === t.register) {
    await send(chatId, t.chooseType, typeKeyboard(t));
    return;
  }

  if ([t.channel, t.group, t.bot].includes(text)) {
    const type = text === t.channel ? 'channel' : text === t.group ? 'group' : 'bot';
    userRow = await updateUser(userRow, { state: 'listing_name', draft_type: type, draft_name: null });
    await send(chatId, t.askName, { keyboard: [[{ text: t.back }]], resize_keyboard: true });
    return;
  }

  if (text === t.search) {
    userRow = await updateUser(userRow, { state: 'search' });
    await send(chatId, t.searchPrompt, { keyboard: [[{ text: t.back }]], resize_keyboard: true });
    return;
  }

  if (userRow.state === 'search') {
    const query = '%' + text.replace(/[%_]/g, '') + '%';
    const matches = await db.select().from(listings)
      .where(or(eq(listings.username, text), like(listings.name, query)))
      .all();
    const visible = matches.filter(item => item.status === 'approved').slice(0, 10);
    if (!visible.length) {
      await send(chatId, t.noResults, mainKeyboard(t));
    } else {
      const lines = visible.map((item, index) => {
        const link = item.username ? '\n' + item.username : '';
        return `${index + 1}. ${item.type}: ${item.name}${link}\n${item.description ?? ''}`;
      });
      await send(chatId, t.results + '\n\n' + lines.join('\n\n'), mainKeyboard(t));
    }
    userRow = await updateUser(userRow, { state: null });
    return;
  }

  if (text === t.ads) {
    await send(chatId, t.adsText, mainKeyboard(t));
    return;
  }

  await send(chatId, t.unknown, mainKeyboard(t));
}
