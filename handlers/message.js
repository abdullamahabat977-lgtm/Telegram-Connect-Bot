import { api, db } from 'sdk';
import { eq, or, like } from 'sdk/db';
import { users, listings, ads, ad_requests } from '../schema.js';

const LANG = {
  ps: {
    welcome: '🚀 Telegram Connect ته ښه راغلاست!\n\nچینلونه، ګروپونه او بوټونه پیدا کړه، خپل خدمت ثبت کړه او د اعلانونو بازار وکاروه.',
    menu: '👇 له لاندې مینو څخه یو انتخاب وکړه.',
    search: '🔎 لټون', register: '➕ ثبتول', ads: '📢 اعلان جوړول', market: '💼 د اعلانونو بازار',
    account: '👤 زما حساب', help: 'ℹ️ مرسته', language: '🌐 ژبه', admin: '🛠️ د مدیر پینل',
    chooseType: 'څه شی ثبتول غواړې؟', channel: '📢 چینل', group: '👥 ګروپ', bot: '🤖 بوټ',
    askName: 'د چینل، ګروپ یا بوټ نوم ولیکه:', askUsername: 'عامه یوزرنیم ولیکه، لکه @MyChannel. که نه لري /skip ولیکه:',
    askDescription: 'لنډه پېژندنه ولیکه یا /skip ولیکه:', askCategory: 'کټګوري ولیکه، لکه زده‌کړه، ټکنالوژي، خبرونه یا سوداګري:',
    askLanguage: 'د سرچینې ژبه ولیکه، لکه پښتو، دري یا English:', askPrice: 'د اعلان بیه په USD کې ولیکه. که وړیا وي یا بیه نه ټاکې، 0 ولیکه:',
    listingSaved: '✅ ثبت دې د مدیر د کتنې لپاره ولېږل شو.',
    searchPrompt: 'د نوم، یوزرنیم یا کټګورۍ له مخې لټون وکړه:', noResults: '🔎 تایید شوې پایله ونه موندل شوه.',
    results: '🔎 د لټون پایلې:', adsIntro: '📢 د اعلان سرلیک ولیکه:', adDescription: 'د اعلان متن ولیکه:',
    adBudget: 'د اعلان بودیجه په USD کې ولیکه؛ که نه ده ټاکل شوې، 0 ولیکه:',
    adTarget: 'که غواړې اعلان دې له تایید وروسته په عامه چینل/ګروپ کې هم خپور شي، د هغه @username ولیکه. که نه، /skip ولیکه. بوټ باید هلته د پیغام لېږلو اجازه ولري:',
    adUrl: 'که غواړې د اعلان لاندې د لینک تڼۍ وي، بشپړ لینک د https:// سره ولیکه؛ که نه، /skip ولیکه:',
    adSaved: '✅ اعلان دې د مدیر د تایید لپاره ثبت شو. که د خپرولو هدف دې ورکړی وي، بوټ به د تایید وروسته هلته د خپرولو هڅه وکړي.',
    marketIntro: '💼 د اعلانونو بازار\n\nدلته د تایید شوو چینلونو او ګروپونو د اعلان بیې او معلومات وګوره. د مالک سره د معاملې غوښتنه د /request_ad ID په بڼه ولېږه.',
    account: '👤 زما حساب', noListings: 'تر اوسه دې سرچینه نه ده ثبت کړې.', noAds: 'تر اوسه دې اعلان نه دی ثبت کړی.',
    helpText: 'ℹ️ لارښود\n🔎 لټون — تایید شوي چینلونه، ګروپونه او بوټونه پیدا کړه.\n➕ ثبتول — خپله سرچینه ثبت کړه؛ بیه هم ټاکلی شې.\n📢 اعلان جوړول — اعلان ثبت کړه.\n💼 د اعلانونو بازار — د چینلونو بیې وګوره او د معاملې غوښتنه ولېږه.\n👤 زما حساب — خپل ثبتونه او اعلانونه وګوره.\n🌐 ژبه — ژبه بدله کړه.\n/cancel — روان کار لغوه کړه.',
    chooseLanguage: '🌐 خپله ژبه وټاکه:', languageSaved: 'ژبه بدله شوه.', cancel: 'عملیات لغوه شول.',
    back: '🏠 اصلي مینو', unknown: 'له مینو څخه یو انتخاب وکړه یا /help ولیکه.',
    invalidName: 'مهرباني وکړه معتبر متن ولیکه.', invalidUsername: 'عامه یوزرنیم باید د @ او ۵–۳۲ انګلیسي تورو، عددونو یا _ په بڼه وي، یا /skip ولیکه.',
    invalidNumber: 'مهرباني وکړه صفر یا مثبت عدد ولیکه.', invalidUrl: 'بشپړ معتبر لینک د https:// یا http:// سره ولیکه، یا /skip ولیکه.',
    adminListings: '📋 د ثبتونو کتنه', adminAds: '📢 د اعلانونو کتنه', adminRequests: '🤝 د معاملې غوښتنې',
    adminStats: '📊 احصائیه', adminBroadcast: '📣 ټولو ته پیغام',
    statuses: { pending: 'تر کتنې لاندې', approved: 'تایید شوی', rejected: 'رد شوی', published: 'خپور شوی', accepted: 'منل شوی' }
  },
  fa: {
    welcome: '🚀 به Telegram Connect خوش آمدید!\n\nکانال‌ها، گروه‌ها و ربات‌ها را پیدا کنید، خدمات خود را ثبت کنید و از بازار تبلیغات استفاده کنید.',
    menu: '👇 یک گزینه را انتخاب کنید.', search: '🔎 جستجو', register: '➕ ثبت', ads: '📢 ساخت تبلیغ',
    market: '💼 بازار تبلیغات', account: '👤 حساب من', help: 'ℹ️ راهنما', language: '🌐 زبان', admin: '🛠️ پنل مدیریت',
    chooseType: 'چه چیزی را ثبت می‌کنید؟', channel: '📢 کانال', group: '👥 گروه', bot: '🤖 ربات',
    askName: 'نام کانال، گروه یا ربات را بنویسید:', askUsername: 'یوزرنیم عمومی مانند @MyChannel را بفرستید؛ اگر ندارد /skip:',
    askDescription: 'معرفی کوتاه بنویسید یا /skip:', askCategory: 'دسته‌بندی را بنویسید؛ مانند آموزش، فناوری، اخبار یا تجارت:',
    askLanguage: 'زبان منبع را بنویسید؛ مانند دری، پشتو یا English:', askPrice: 'قیمت تبلیغ را به USD بنویسید؛ رایگان یا نامشخص = 0:',
    listingSaved: '✅ مورد شما برای بررسی مدیر ارسال شد.', searchPrompt: 'نام، یوزرنیم یا دسته‌بندی را برای جستجو بنویسید:',
    noResults: '🔎 نتیجه تأییدشده‌ای پیدا نشد.', results: '🔎 نتایج جستجو:', adsIntro: '📢 عنوان تبلیغ را بنویسید:',
    adDescription: 'متن تبلیغ را بنویسید:', adBudget: 'بودجه را به USD بنویسید؛ اگر مشخص نیست 0:',
    adTarget: 'اگر می‌خواهید پس از تأیید در کانال/گروه عمومی نیز منتشر شود، @username را بفرستید؛ در غیر آن /skip. ربات باید اجازه ارسال پیام داشته باشد:',
    adUrl: 'برای دکمه لینک، آدرس کامل با https:// را بفرستید؛ در غیر آن /skip:',
    adSaved: '✅ تبلیغ برای تأیید مدیر ثبت شد.', marketIntro: '💼 بازار تبلیغات\n\nقیمت و اطلاعات کانال‌ها و گروه‌های تأییدشده را ببینید. برای درخواست همکاری /request_ad ID را بفرستید.',
    account: '👤 حساب من', noListings: 'هنوز موردی ثبت نکرده‌اید.', noAds: 'هنوز تبلیغی ثبت نکرده‌اید.',
    helpText: 'ℹ️ راهنما\n🔎 جستجو — کانال‌ها، گروه‌ها و ربات‌های تأییدشده.\n➕ ثبت — منبع خود را ثبت کنید.\n📢 ساخت تبلیغ — تبلیغ ثبت کنید.\n💼 بازار تبلیغات — قیمت‌ها را ببینید و درخواست همکاری بفرستید.\n👤 حساب من — موارد خود را ببینید.\n🌐 زبان — تغییر زبان.\n/cancel — لغو.',
    chooseLanguage: '🌐 زبان خود را انتخاب کنید:', languageSaved: 'زبان تغییر کرد.', cancel: 'عملیات لغو شد.',
    back: '🏠 منوی اصلی', unknown: 'از منو انتخاب کنید یا /help را بفرستید.',
    invalidName: 'لطفاً متن معتبر بنویسید.', invalidUsername: 'یوزرنیم باید @ و ۵ تا ۳۲ حرف/عدد انگلیسی یا _ داشته باشد، یا /skip بفرستید.',
    invalidNumber: 'لطفاً عدد صفر یا مثبت بنویسید.', invalidUrl: 'آدرس کامل معتبر با https:// یا http:// بنویسید یا /skip.',
    adminListings: '📋 بررسی ثبت‌ها', adminAds: '📢 بررسی تبلیغات', adminRequests: '🤝 درخواست‌های همکاری',
    adminStats: '📊 آمار', adminBroadcast: '📣 پیام همگانی',
    statuses: { pending: 'در انتظار بررسی', approved: 'تأیید شده', rejected: 'رد شده', published: 'منتشر شده', accepted: 'پذیرفته شده' }
  },
  en: {
    welcome: '🚀 Welcome to Telegram Connect!\n\nDiscover channels, groups and bots, submit your listing, and use the advertising marketplace.',
    menu: '👇 Choose an option below.', search: '🔎 Search', register: '➕ Submit listing', ads: '📢 Create an ad',
    market: '💼 Ad marketplace', account: '👤 My account', help: 'ℹ️ Help', language: '🌐 Language', admin: '🛠️ Admin panel',
    chooseType: 'What would you like to submit?', channel: '📢 Channel', group: '👥 Group', bot: '🤖 Bot',
    askName: 'Enter the channel, group, or bot name:', askUsername: 'Send its public username, e.g. @MyChannel. If none, send /skip:',
    askDescription: 'Enter a short description or send /skip:', askCategory: 'Enter a category, e.g. education, technology, news, or business:',
    askLanguage: 'Enter the source language, e.g. English, Pashto, or Dari:', askPrice: 'Set the ad price in USD. Use 0 if free or not set:',
    listingSaved: '✅ Your listing was submitted for admin review.', searchPrompt: 'Search by name, username, or category:',
    noResults: '🔎 No approved result found.', results: '🔎 Search results:', adsIntro: '📢 Enter the ad title:',
    adDescription: 'Enter the ad text:', adBudget: 'Enter the budget in USD; use 0 if undecided:',
    adTarget: 'To also publish after approval in a public channel/group, send its @username. Otherwise send /skip. The bot must be allowed to post there:',
    adUrl: 'To add a link button, send a full URL starting with https:// or http://; otherwise /skip:',
    adSaved: '✅ Your ad was submitted for admin approval. If a target was provided, the bot will try to publish it after approval.',
    marketIntro: '💼 Ad marketplace\n\nBrowse approved channel/group prices and details. To request a deal from an owner, send /request_ad ID.',
    account: '👤 My account', noListings: 'You have not submitted any listings yet.', noAds: 'You have not submitted any ads yet.',
    helpText: 'ℹ️ Help\n🔎 Search — find approved channels, groups, and bots.\n➕ Submit listing — register your source and optionally set an ad price.\n📢 Create an ad — submit an ad for review.\n💼 Ad marketplace — compare prices and request a deal.\n👤 My account — view your listings and ads.\n🌐 Language — change language.\n/cancel — cancel the current flow.',
    chooseLanguage: '🌐 Choose your language:', languageSaved: 'Language updated.', cancel: 'Operation cancelled.',
    back: '🏠 Main menu', unknown: 'Choose a menu button or send /help.',
    invalidName: 'Please enter valid text.', invalidUsername: 'Username must be @ followed by 5–32 English letters, digits, or underscores, or send /skip.',
    invalidNumber: 'Please enter a zero or positive number.', invalidUrl: 'Send a valid full URL starting with http:// or https://, or send /skip.',
    adminListings: '📋 Review listings', adminAds: '📢 Review ads', adminRequests: '🤝 Deal requests',
    adminStats: '📊 Statistics', adminBroadcast: '📣 Broadcast',
    statuses: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', published: 'Published', accepted: 'Accepted' }
  },
  ur: {
    welcome: '🚀 Telegram Connect میں خوش آمدید!\n\nچینلز، گروپس اور بوٹس تلاش کریں، اپنی لسٹنگ درج کریں اور اشتہارات کا بازار استعمال کریں۔',
    menu: '👇 نیچے سے ایک اختیار منتخب کریں۔', search: '🔎 تلاش', register: '➕ لسٹنگ درج کریں', ads: '📢 اشتہار بنائیں',
    market: '💼 اشتہارات کا بازار', account: '👤 میرا اکاؤنٹ', help: 'ℹ️ مدد', language: '🌐 زبان', admin: '🛠️ ایڈمن پینل',
    chooseType: 'کیا درج کرنا چاہتے ہیں؟', channel: '📢 چینل', group: '👥 گروپ', bot: '🤖 بوٹ',
    askName: 'چینل، گروپ یا بوٹ کا نام لکھیں:', askUsername: 'عوامی یوزرنیم مثلاً @MyChannel بھیجیں؛ نہ ہو تو /skip:',
    askDescription: 'مختصر تعارف لکھیں یا /skip:', askCategory: 'زمرہ لکھیں، مثلاً تعلیم، ٹیکنالوجی، خبریں یا کاروبار:',
    askLanguage: 'ذریعے کی زبان لکھیں:', askPrice: 'اشتہار کی قیمت USD میں لکھیں؛ مفت یا نامعلوم کے لیے 0:',
    listingSaved: '✅ لسٹنگ ایڈمن جائزے کے لیے بھیج دی گئی۔', searchPrompt: 'نام، یوزرنیم یا زمرے سے تلاش کریں:',
    noResults: '🔎 کوئی منظور شدہ نتیجہ نہیں ملا۔', results: '🔎 تلاش کے نتائج:', adsIntro: '📢 اشتہار کا عنوان لکھیں:',
    adDescription: 'اشتہار کا متن لکھیں:', adBudget: 'بجٹ USD میں لکھیں؛ نامعلوم ہو تو 0:',
    adTarget: 'منظوری کے بعد عوامی چینل/گروپ میں بھی شائع کرنے کے لیے @username بھیجیں، ورنہ /skip۔ بوٹ کو وہاں پوسٹ کرنے کی اجازت چاہیے:',
    adUrl: 'لنک بٹن کے لیے https:// والا مکمل لنک بھیجیں، ورنہ /skip:',
    adSaved: '✅ اشتہار منظوری کے لیے جمع ہوگیا۔', marketIntro: '💼 اشتہارات کا بازار\n\nمنظور شدہ چینلز کی قیمتیں دیکھیں۔ مالک کو درخواست کے لیے /request_ad ID بھیجیں۔',
    account: '👤 میرا اکاؤنٹ', noListings: 'ابھی کوئی لسٹنگ نہیں۔', noAds: 'ابھی کوئی اشتہار نہیں۔',
    helpText: 'ℹ️ مدد\n🔎 تلاش — منظور شدہ چینلز، گروپس اور بوٹس۔\n➕ لسٹنگ درج کریں۔\n📢 اشتہار بنائیں۔\n💼 اشتہارات کا بازار — قیمتیں دیکھیں اور درخواست بھیجیں۔\n👤 میرا اکاؤنٹ۔\n🌐 زبان۔\n/cancel — منسوخ کریں۔',
    chooseLanguage: '🌐 اپنی زبان منتخب کریں:', languageSaved: 'زبان تبدیل ہوگئی۔', cancel: 'عمل منسوخ ہوگیا۔',
    back: '🏠 مرکزی مینو', unknown: 'مینو منتخب کریں یا /help بھیجیں.',
    invalidName: 'درست متن لکھیں۔', invalidUsername: '@ کے بعد ۵ تا ۳۲ انگریزی حروف/اعداد یا _ ہونا چاہیے، یا /skip بھیجیں.',
    invalidNumber: 'صفر یا مثبت عدد لکھیں۔', invalidUrl: 'http:// یا https:// والا مکمل لنک بھیجیں، یا /skip.',
    adminListings: '📋 لسٹنگز کا جائزہ', adminAds: '📢 اشتہارات کا جائزہ', adminRequests: '🤝 تعاون کی درخواستیں',
    adminStats: '📊 اعدادوشمار', adminBroadcast: '📣 سب کو پیغام',
    statuses: { pending: 'زیرِ جائزہ', approved: 'منظور', rejected: 'مسترد', published: 'شائع شدہ', accepted: 'قبول' }
  },
  ar: {
    welcome: '🚀 أهلاً بك في Telegram Connect!\n\nاكتشف القنوات والمجموعات والروبوتات، وسجّل مصدرك واستخدم سوق الإعلانات.',
    menu: '👇 اختر من القائمة.', search: '🔎 بحث', register: '➕ تسجيل مصدر', ads: '📢 إنشاء إعلان',
    market: '💼 سوق الإعلانات', account: '👤 حسابي', help: 'ℹ️ مساعدة', language: '🌐 اللغة', admin: '🛠️ لوحة الإدارة',
    chooseType: 'ماذا تريد تسجيله؟', channel: '📢 قناة', group: '👥 مجموعة', bot: '🤖 روبوت',
    askName: 'اكتب اسم القناة أو المجموعة أو الروبوت:', askUsername: 'أرسل اسم المستخدم العام مثل @MyChannel أو /skip إن لم يوجد:',
    askDescription: 'اكتب وصفاً قصيراً أو /skip:', askCategory: 'اكتب الفئة مثل التعليم أو التقنية أو الأخبار أو التجارة:',
    askLanguage: 'اكتب لغة المصدر:', askPrice: 'اكتب سعر الإعلان بالدولار؛ اكتب 0 إذا كان مجانياً أو غير محدد:',
    listingSaved: '✅ أُرسل المصدر للمراجعة.', searchPrompt: 'ابحث بالاسم أو اسم المستخدم أو الفئة:',
    noResults: '🔎 لم يتم العثور على نتيجة معتمدة.', results: '🔎 نتائج البحث:', adsIntro: '📢 اكتب عنوان الإعلان:',
    adDescription: 'اكتب نص الإعلان:', adBudget: 'اكتب الميزانية بالدولار أو 0 إن لم تحددها:',
    adTarget: 'لنشر الإعلان بعد الموافقة في قناة/مجموعة عامة أيضاً، أرسل @username، وإلا /skip. يجب أن يستطيع الروبوت النشر هناك:',
    adUrl: 'لإضافة زر رابط أرسل رابطاً كاملاً يبدأ بـ https:// أو http://، وإلا /skip:',
    adSaved: '✅ أُرسل الإعلان لموافقة الإدارة.', marketIntro: '💼 سوق الإعلانات\n\nشاهد أسعار القنوات المعتمدة. لطلب صفقة أرسل /request_ad ID.',
    account: '👤 حسابي', noListings: 'لم تسجل أي مصدر بعد.', noAds: 'لم تسجل أي إعلان بعد.',
    helpText: 'ℹ️ المساعدة\n🔎 بحث — اعثر على القنوات والمجموعات والروبوتات المعتمدة.\n➕ تسجيل مصدر.\n📢 إنشاء إعلان.\n💼 سوق الإعلانات — شاهد الأسعار وأرسل طلباً.\n👤 حسابي.\n🌐 اللغة.\n/cancel — إلغاء.',
    chooseLanguage: '🌐 اختر لغتك:', languageSaved: 'تم تغيير اللغة.', cancel: 'تم إلغاء العملية.',
    back: '🏠 القائمة الرئيسية', unknown: 'اختر من القائمة أو أرسل /help.',
    invalidName: 'يرجى كتابة نص صحيح.', invalidUsername: 'يجب أن يبدأ اسم المستخدم بـ @ ويتبعه 5–32 حرفاً أو رقماً إنجليزياً أو _، أو أرسل /skip.',
    invalidNumber: 'يرجى إدخال رقم صفر أو موجب.', invalidUrl: 'أرسل رابطاً كاملاً يبدأ بـ http:// أو https:// أو /skip.',
    adminListings: '📋 مراجعة المصادر', adminAds: '📢 مراجعة الإعلانات', adminRequests: '🤝 طلبات الصفقات',
    adminStats: '📊 الإحصاءات', adminBroadcast: '📣 رسالة للجميع',
    statuses: { pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض', published: 'منشور', accepted: 'مقبول' }
  }
};

const LANGUAGE_BUTTONS = { ps: '🇦🇫 پښتو', fa: '🇦🇫 دری', en: '🇬🇧 English', ur: '🇵🇰 اردو', ar: '🇸🇦 العربية' };
const LANG_FROM_BUTTON = Object.fromEntries(Object.entries(LANGUAGE_BUTTONS).map(([key, value]) => [value, key]));
const ADMINS = [7851941608, 7003093962];

function keyboard(rows, extra = {}) {
  return { keyboard: rows.map(row => row.map(text => ({ text }))), resize_keyboard: true, ...extra };
}
function isAdmin(id) { return ADMINS.includes(Number(id)); }
function mainKeyboard(t, admin = false) {
  const rows = [[t.search, t.register], [t.ads, t.market], [t.account, t.help], [t.language]];
  if (admin) rows.push([t.admin]);
  return keyboard(rows);
}
function adminKeyboard(t) {
  return keyboard([[t.adminListings, t.adminAds], [t.adminRequests, t.adminStats], [t.adminBroadcast], [t.back]]);
}
function languageKeyboard() {
  return keyboard([[LANGUAGE_BUTTONS.ps, LANGUAGE_BUTTONS.fa], [LANGUAGE_BUTTONS.en, LANGUAGE_BUTTONS.ur], [LANGUAGE_BUTTONS.ar]], { one_time_keyboard: true });
}
function typeKeyboard(t) { return keyboard([[t.channel, t.group], [t.bot], [t.back]]); }
function langOf(user) { return LANG[user?.language] ? user.language : 'ps'; }
async function send(chatId, text, reply_markup) {
  const payload = { chat_id: chatId, text: String(text).slice(0, 4000) };
  if (reply_markup) payload.reply_markup = reply_markup;
  return api.sendMessage(payload);
}
function cleanText(value, max = 1000) {
  const v = String(value ?? '').trim();
  return v && !v.startsWith('/') ? v.slice(0, max) : '';
}
function cleanUsername(value) {
  const v = String(value).trim().replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{5,32}$/.test(v)) return undefined;
  return '@' + v;
}
function validUrl(value) { return /^https?:\/\/\S+$/i.test(value) && value.length <= 1000; }
function statusText(t, status) { return t.statuses?.[status] ?? status; }

async function getOrCreateUser(from) {
  let user = await db.select().from(users).where(eq(users.telegram_id, from.id)).get();
  if (!user) {
    await db.insert(users).values({
      telegram_id: from.id, username: from.username ?? null, first_name: from.first_name ?? 'User',
      language: 'ps', is_blocked: 0, state: null, draft_type: null, draft_name: null,
      draft_username: null, draft_description: null, draft_category: null, draft_language: null,
      draft_price: null, draft_title: null, draft_budget: null, draft_ad_target: null, draft_url: null,
      draft_offer_listing_id: null, draft_offer_price: null, created_at: new Date().toISOString()
    }).run();
    user = await db.select().from(users).where(eq(users.telegram_id, from.id)).get();
  } else {
    await db.update(users).set({ username: from.username ?? null, first_name: from.first_name ?? 'User' })
      .where(eq(users.id, user.id)).run();
    user.username = from.username ?? null;
    user.first_name = from.first_name ?? 'User';
  }
  return user;
}
async function updateUser(user, values) {
  await db.update(users).set(values).where(eq(users.id, user.id)).run();
  return db.select().from(users).where(eq(users.id, user.id)).get();
}
async function clearFlow(user) {
  return updateUser(user, {
    state: null, draft_type: null, draft_name: null, draft_username: null, draft_description: null,
    draft_category: null, draft_language: null, draft_price: null, draft_title: null, draft_budget: null,
    draft_ad_target: null, draft_url: null, draft_offer_listing_id: null, draft_offer_price: null
  });
}
async function showMain(chatId, user, prefix = '') {
  const t = LANG[langOf(user)];
  await send(chatId, [prefix, t.welcome, t.menu].filter(Boolean).join('\n\n'), mainKeyboard(t, isAdmin(user.telegram_id)));
}
async function tellOwner(listing, text) {
  const owner = await db.select().from(users).where(eq(users.id, listing.owner_id)).get();
  if (owner && !Number(owner.is_blocked)) {
    try { await send(owner.telegram_id, text); } catch { /* Owner may have blocked the bot. */ }
  }
}
async function showMarket(chatId, user) {
  const t = LANG[langOf(user)];
  const rows = await db.select().from(listings).where(eq(listings.status, 'approved')).all();
  const channels = rows.filter(x => x.type === 'channel' || x.type === 'group').slice(0, 15);
  if (!channels.length) {
    await send(chatId, t.marketIntro + '\n\nاوس تایید شوی چینل یا ګروپ نشته.', mainKeyboard(t, isAdmin(user.telegram_id)));
    return;
  }
  const body = channels.map(x =>
    `#${x.id} | ${x.type === 'channel' ? '📢' : '👥'} ${x.name}\n${x.username ?? 'لینک نشته'}\nکټګوري: ${x.category ?? '—'} | ژبه: ${x.language ?? '—'}\nد اعلان بیه: ${x.ad_price === null || x.ad_price === undefined ? 'نه ده ټاکل شوې' : x.ad_price + ' ' + (x.currency ?? 'USD')}\nد غوښتنې لپاره: /request_ad ${x.id}`
  ).join('\n\n');
  await send(chatId, t.marketIntro + '\n\n' + body, mainKeyboard(t, isAdmin(user.telegram_id)));
}

export default async function (message, ctx) {
  if (!message?.chat?.id || !message?.from || message.chat.type !== 'private') return;
  const chatId = message.chat.id;
  const text = (message.text ?? '').trim();
  if (!text) return;

  let user = await getOrCreateUser(message.from);
  let t = LANG[langOf(user)];
  const admin = isAdmin(message.from.id);

  if (Number(user.is_blocked) === 1 && !admin) {
    await send(chatId, '⛔ ستا لاسرسی د مدیر له خوا محدود شوی دی.');
    return;
  }

  // Universal commands must work even while the user is in a multi-step flow.
  if (text === '/cancel') {
    user = await clearFlow(user);
    await showMain(chatId, user, LANG[langOf(user)].cancel);
    return;
  }
  if (text === '/start' || text.startsWith('/start ')) {
    user = await clearFlow(user);
    await showMain(chatId, user);
    return;
  }
  if (text === '/help' || text === t.help) {
    await send(chatId, t.helpText, mainKeyboard(t, admin));
    return;
  }
  if (text === '/language' || text === t.language || Object.values(LANGUAGE_BUTTONS).includes(text)) {
    if (LANG_FROM_BUTTON[text]) {
      user = await updateUser(user, { language: LANG_FROM_BUTTON[text] });
      t = LANG[langOf(user)];
      await showMain(chatId, user, t.languageSaved);
    } else {
      await send(chatId, t.chooseLanguage, languageKeyboard());
    }
    return;
  }
  if (text === t.back || ['🏠 اصلي مینو', '🏠 منوی اصلی', '🏠 مرکزی مینو', '🏠 Main menu', '🏠 القائمة الرئيسية'].includes(text)) {
    user = await clearFlow(user);
    await showMain(chatId, user);
    return;
  }

  // Admin-only controls.
  if (text === '/admin' || text === t.admin) {
    if (!admin) { await send(chatId, '⛔ دا برخه یوازې د مدیرانو لپاره ده.'); return; }
    await send(chatId, '🛠️ د مدیر پینل\n\nد لاندې برخو څخه انتخاب وکړه. د ثبتونو او اعلانونو تایید دلته کېږي.', adminKeyboard(t));
    return;
  }
  if ([t.adminListings, t.adminAds, t.adminRequests, t.adminStats, t.adminBroadcast].includes(text) && !admin) {
    await send(chatId, '⛔ دا برخه یوازې د مدیرانو لپاره ده.');
    return;
  }
  if (admin && (text === t.adminListings || text === '/pending_listings')) {
    const rows = (await db.select().from(listings).where(eq(listings.status, 'pending')).all()).slice(0, 15);
    const body = rows.length ? rows.map(x => `#${x.id} | ${x.type} | ${x.name}\nمالک داخلي ID: ${x.owner_id}\nلینک: ${x.username ?? 'نشته'}\nبیه: ${x.ad_price ?? 0} ${x.currency ?? 'USD'}\nتایید: /approve_listing ${x.id}\nرد: /reject_listing ${x.id}`).join('\n\n') : 'د کتنې لپاره ثبت نشته.';
    await send(chatId, '📋 د تایید په تمه ثبتونه:\n\n' + body, adminKeyboard(t));
    return;
  }
  if (admin && (text === t.adminAds || text === '/pending_ads')) {
    const rows = (await db.select().from(ads).where(eq(ads.status, 'pending')).all()).slice(0, 15);
    const body = rows.length ? rows.map(x => `#${x.id} | ${x.title}\nبوديجه: ${x.budget ?? 0} USD\nهدف: ${x.target ?? 'یوازې د بوټ بازار'}\nتشریح: ${x.description ?? 'نشته'}\nتایید: /approve_ad ${x.id}\nرد: /reject_ad ${x.id}`).join('\n\n') : 'د کتنې لپاره اعلان نشته.';
    await send(chatId, '📢 د تایید په تمه اعلانونه:\n\n' + body, adminKeyboard(t));
    return;
  }
  if (admin && (text === t.adminRequests || text === '/pending_requests')) {
    const rows = (await db.select().from(ad_requests).where(eq(ad_requests.status, 'pending')).all()).slice(0, 15);
    const body = rows.length ? rows.map(x => `#${x.id} | د سرچینې ID: ${x.listing_id}\nاعلان ورکوونکی داخلي ID: ${x.advertiser_id}\nوړاندیز: ${x.offered_price ?? 'توافق ته اړتیا لري'} USD\nپیغام: ${x.message ?? '—'}`).join('\n\n') : 'د معاملې غوښتنې نشته.';
    await send(chatId, '🤝 د معاملې غوښتنې:\n\n' + body, adminKeyboard(t));
    return;
  }
  if (admin && (text === t.adminStats || text === '/stats')) {
    const allUsers = await db.select().from(users).all();
    const allListings = await db.select().from(listings).all();
    const allAds = await db.select().from(ads).all();
    const allRequests = await db.select().from(ad_requests).all();
    await send(chatId, `📊 احصائیه\n\n👥 کاروونکي: ${allUsers.length}\n📋 سرچینې: ${allListings.length}\n📢 اعلانونه: ${allAds.length}\n🤝 د معاملې غوښتنې: ${allRequests.length}`, adminKeyboard(t));
    return;
  }
  if (admin && text === t.adminBroadcast) {
    user = await updateUser(user, { state: 'admin_broadcast' });
    await send(chatId, '📣 ټولو کاروونکو ته د لېږلو پیغام ولیکه. د لغوه کولو لپاره /cancel ولیکه.', keyboard([[t.back]]));
    return;
  }
  if (user.state === 'admin_broadcast') {
    if (!admin) { await clearFlow(user); await send(chatId, '⛔ اجازه نشته.'); return; }
    if (text.startsWith('/')) { await send(chatId, 'د پیغام متن ولیکه یا /cancel واستوه.'); return; }
    const recipients = await db.select().from(users).all();
    let sentCount = 0, failedCount = 0;
    for (const recipient of recipients) {
      if (Number(recipient.is_blocked) === 1) continue;
      try { await send(recipient.telegram_id, '📣 د Telegram Connect پیغام:\n\n' + text); sentCount++; }
      catch { failedCount++; }
    }
    user = await clearFlow(user);
    await send(chatId, `✅ پیغام واستول شو.\nبریالي: ${sentCount}\nناکام: ${failedCount}`, adminKeyboard(t));
    return;
  }
  const blockAction = text.match(/^\/(block|unblock)\s+(\d+)$/);
  if (blockAction) {
    if (!admin) { await send(chatId, '⛔ دا امر یوازې مدیران کارولی شي.'); return; }
    const [, action, idText] = blockAction;
    const targetId = Number(idText);
    if (ADMINS.includes(targetId)) { await send(chatId, '⛔ د اصلي مدیرانو لاسرسی نه شي بندېدای.'); return; }
    const target = await db.select().from(users).where(eq(users.telegram_id, targetId)).get();
    if (!target) { await send(chatId, '❌ دا Telegram ID نه دی ثبت شوی.'); return; }
    await db.update(users).set({ is_blocked: action === 'block' ? 1 : 0 }).where(eq(users.id, target.id)).run();
    await send(chatId, `${action === 'block' ? '🚫 کاروونکی بند شو' : '✅ کاروونکی فعال شو'}\nTelegram ID: ${targetId}`, adminKeyboard(t));
    return;
  }
  const adminAction = text.match(/^\/(approve|reject)_(listing|ad)\s+(\d+)$/);
  if (adminAction) {
    if (!admin) { await send(chatId, '⛔ دا امر یوازې مدیران کارولی شي.'); return; }
    const [, decision, kind, idText] = adminAction;
    const id = Number(idText);
    if (kind === 'listing') {
      const row = await db.select().from(listings).where(eq(listings.id, id)).get();
      if (!row) { await send(chatId, '❌ ثبت ونه موندل شو.'); return; }
      const status = decision === 'approve' ? 'approved' : 'rejected';
      await db.update(listings).set({ status }).where(eq(listings.id, id)).run();
      await tellOwner(row, `${status === 'approved' ? '✅ ستا ثبت تایید شو' : '❌ ستا ثبت رد شو'}: ${row.name}`);
      await send(chatId, `${status === 'approved' ? '✅ تایید شو' : '❌ رد شو'}: #${id} — ${row.name}`, adminKeyboard(t));
      return;
    }
    const row = await db.select().from(ads).where(eq(ads.id, id)).get();
    if (!row) { await send(chatId, '❌ اعلان ونه موندل شو.'); return; }
    if (decision === 'reject') {
      await db.update(ads).set({ status: 'rejected' }).where(eq(ads.id, id)).run();
      const owner = await db.select().from(users).where(eq(users.id, row.owner_id)).get();
      if (owner) { try { await send(owner.telegram_id, `❌ ستا اعلان رد شو: ${row.title}`); } catch {} }
      await send(chatId, `❌ اعلان رد شو: #${id}`, adminKeyboard(t));
      return;
    }
    await db.update(ads).set({ status: 'approved' }).where(eq(ads.id, id)).run();
    let publication = 'اعلان په بوټ کې تایید شو.';
    if (row.target) {
      try {
        const markup = row.url ? { inline_keyboard: [[{ text: '🔗 اعلان وګوره', url: row.url }]] } : undefined;
        await send(row.target, `📢 ${row.title}\n\n${row.description ?? ''}\n\nاعلان د Telegram Connect له لارې خپور شو.`, markup);
        await db.update(ads).set({ status: 'published', published_chat: row.target }).where(eq(ads.id, id)).run();
        publication = `اعلان په ${row.target} کې هم خپور شو.`;
      } catch (error) {
        publication = `اعلان په بازار کې تایید شو، خو په ${row.target} کې خپر نه شو. وګوره چې بوټ هلته اډمین وي او د پیغام لېږلو اجازه ولري.`;
      }
    }
    const owner = await db.select().from(users).where(eq(users.id, row.owner_id)).get();
    if (owner) { try { await send(owner.telegram_id, `✅ ستا اعلان تایید شو.\n${publication}`); } catch {} }
    await send(chatId, `✅ اعلان #${id} تایید شو.\n${publication}`, adminKeyboard(t));
    return;
  }

  // Owner or advertiser actions in the marketplace.
  const offerAction = text.match(/^\/(request_ad|accept_offer|reject_offer)\s+(\d+)$/);
  if (offerAction) {
    const [, action, rawId] = offerAction;
    const id = Number(rawId);
    if (action === 'request_ad') {
      const listing = await db.select().from(listings).where(eq(listings.id, id)).get();
      if (!listing || listing.status !== 'approved' || !['channel', 'group'].includes(listing.type)) {
        await send(chatId, '❌ دا تایید شوی چینل/ګروپ ونه موندل شو.');
        return;
      }
      if (listing.owner_id === user.id) { await send(chatId, 'دا ستا خپله سرچینه ده؛ خپل ځان ته غوښتنه نه شې لېږلای.'); return; }
      user = await updateUser(user, { state: 'offer_price', draft_offer_listing_id: listing.id, draft_offer_price: null });
      await send(chatId, `🤝 د ${listing.name} لپاره د اعلان د بیې وړاندیز په USD کې ولیکه؛ که د مالک له بیې سره خبرې کول غواړې، 0 ولیکه:`, keyboard([[t.back]]));
      return;
    }
    const request = await db.select().from(ad_requests).where(eq(ad_requests.id, id)).get();
    if (!request) { await send(chatId, '❌ د معاملې غوښتنه ونه موندل شوه.'); return; }
    const listing = await db.select().from(listings).where(eq(listings.id, request.listing_id)).get();
    if (!listing || listing.owner_id !== user.id) { await send(chatId, '⛔ یوازې د سرچینې مالک دا غوښتنه منل یا ردولای شي.'); return; }
    if (request.status !== 'pending') { await send(chatId, 'دا غوښتنه مخکې ارزول شوې ده.'); return; }
    const status = action === 'accept_offer' ? 'accepted' : 'rejected';
    await db.update(ad_requests).set({ status }).where(eq(ad_requests.id, id)).run();
    const advertiser = await db.select().from(users).where(eq(users.id, request.advertiser_id)).get();
    if (advertiser) {
      try { await send(advertiser.telegram_id, `${status === 'accepted' ? '✅ د اعلان غوښتنه ومنل شوه' : '❌ د اعلان غوښتنه رد شوه'}\nسرچینه: ${listing.name}\nاوس د وروستیو شرایطو د توافق لپاره له مالک سره اړیکه ونیسئ: ${listing.username ?? 'د بوټ له لارې پیغام واستوئ'}`); } catch {}
    }
    await send(chatId, status === 'accepted' ? '✅ غوښتنه ومنل شوه. د پیسو ورکړه د دې بوټ له لارې نه ترسره کېږي؛ له اعلان ورکوونکي سره وروستي شرایط تایید کړه.' : '❌ غوښتنه رد شوه.', mainKeyboard(t, admin));
    return;
  }

  // Registration flow: type -> name -> username -> description -> category -> language -> ad price.
  if (user.state === 'listing_name') {
    const value = cleanText(text, 120);
    if (!value) { await send(chatId, t.invalidName); return; }
    user = await updateUser(user, { draft_name: value, state: 'listing_username' });
    await send(chatId, t.askUsername, keyboard([['/skip'], [t.back]])); return;
  }
  if (user.state === 'listing_username') {
    let value = null;
    if (text.toLowerCase() !== '/skip') {
      value = cleanUsername(text);
      if (value === undefined) { await send(chatId, t.invalidUsername); return; }
    }
    user = await updateUser(user, { draft_username: value, state: 'listing_description' });
    await send(chatId, t.askDescription, keyboard([['/skip'], [t.back]])); return;
  }
  if (user.state === 'listing_description') {
    const value = text.toLowerCase() === '/skip' ? null : cleanText(text, 1000);
    user = await updateUser(user, { draft_description: value || null, state: 'listing_category' });
    await send(chatId, t.askCategory, keyboard([['/skip'], [t.back]])); return;
  }
  if (user.state === 'listing_category') {
    const value = text.toLowerCase() === '/skip' ? null : cleanText(text, 80);
    user = await updateUser(user, { draft_category: value || null, state: 'listing_language' });
    await send(chatId, t.askLanguage, keyboard([['/skip'], [t.back]])); return;
  }
  if (user.state === 'listing_language') {
    const value = text.toLowerCase() === '/skip' ? langOf(user) : cleanText(text, 40);
    user = await updateUser(user, { draft_language: value, state: 'listing_price' });
    await send(chatId, t.askPrice, keyboard([['0'], [t.back]])); return;
  }
  if (user.state === 'listing_price') {
    if (!/^\d{1,9}$/.test(text)) { await send(chatId, t.invalidNumber); return; }
    await db.insert(listings).values({
      owner_id: user.id, type: user.draft_type, name: user.draft_name, username: user.draft_username ?? null,
      description: user.draft_description ?? null, category: user.draft_category ?? null,
      language: user.draft_language ?? langOf(user), ad_price: Number(text), currency: 'USD',
      status: 'pending', created_at: new Date().toISOString()
    }).run();
    user = await clearFlow(user);
    await showMain(chatId, user, t.listingSaved); return;
  }

  // Ad creation flow: title -> description -> budget -> optional publication target -> optional link.
  if (user.state === 'ad_title') {
    const value = cleanText(text, 160);
    if (!value) { await send(chatId, t.invalidName); return; }
    user = await updateUser(user, { draft_title: value, state: 'ad_description' });
    await send(chatId, t.adDescription, keyboard([[t.back]])); return;
  }
  if (user.state === 'ad_description') {
    const value = cleanText(text, 1800);
    if (!value) { await send(chatId, t.invalidName); return; }
    user = await updateUser(user, { draft_description: value, state: 'ad_budget' });
    await send(chatId, t.adBudget, keyboard([['0'], [t.back]])); return;
  }
  if (user.state === 'ad_budget') {
    if (!/^\d{1,9}$/.test(text)) { await send(chatId, t.invalidNumber); return; }
    user = await updateUser(user, { draft_budget: Number(text), state: 'ad_target' });
    await send(chatId, t.adTarget, keyboard([['/skip'], [t.back]])); return;
  }
  if (user.state === 'ad_target') {
    let target = null;
    if (text.toLowerCase() !== '/skip') {
      target = cleanUsername(text);
      if (target === undefined) { await send(chatId, t.invalidUsername); return; }
    }
    user = await updateUser(user, { draft_ad_target: target, state: 'ad_url' });
    await send(chatId, t.adUrl, keyboard([['/skip'], [t.back]])); return;
  }
  if (user.state === 'ad_url') {
    let url = null;
    if (text.toLowerCase() !== '/skip') {
      if (!validUrl(text)) { await send(chatId, t.invalidUrl); return; }
      url = text;
    }
    await db.insert(ads).values({
      owner_id: user.id, title: user.draft_title, description: user.draft_description,
      budget: user.draft_budget ?? 0, target: user.draft_ad_target ?? null, url,
      status: 'pending', published_chat: null, created_at: new Date().toISOString()
    }).run();
    user = await clearFlow(user);
    await showMain(chatId, user, t.adSaved); return;
  }

  // Deal request: /request_ad LISTING_ID -> offer amount -> short message.
  if (user.state === 'offer_price') {
    if (!/^\d{1,9}$/.test(text)) { await send(chatId, t.invalidNumber); return; }
    user = await updateUser(user, { draft_offer_price: Number(text), state: 'offer_message' });
    await send(chatId, 'د چینل مالک ته لنډ پیغام ولیکه؛ که اړتیا نه وي /skip ولیکه:', keyboard([['/skip'], [t.back]]));
    return;
  }
  if (user.state === 'offer_message') {
    const messageText = text.toLowerCase() === '/skip' ? null : cleanText(text, 800);
    const listing = await db.select().from(listings).where(eq(listings.id, user.draft_offer_listing_id)).get();
    if (!listing || listing.status !== 'approved') {
      user = await clearFlow(user);
      await showMain(chatId, user, '❌ سرچینه نور د لاسرسي وړ نه ده.');
      return;
    }
    const [request] = await db.insert(ad_requests).values({
      listing_id: listing.id, advertiser_id: user.id, owner_id: listing.owner_id,
      message: messageText, offered_price: user.draft_offer_price ?? 0,
      status: 'pending', created_at: new Date().toISOString()
    }).returning().run();
    const owner = await db.select().from(users).where(eq(users.id, listing.owner_id)).get();
    if (owner) {
      try {
        await send(owner.telegram_id, `🤝 د اعلان نوې غوښتنه #${request.id}\nسرچینه: ${listing.name}\nوړاندیز: ${request.offered_price} USD\nپیغام: ${request.message ?? '—'}\n\nمنل: /accept_offer ${request.id}\nردول: /reject_offer ${request.id}`);
      } catch {}
    }
    user = await clearFlow(user);
    await showMain(chatId, user, '✅ د اعلان غوښتنه د چینل مالک ته ولېږل شوه. وروستۍ معامله او پیسې باید د دواړو لورو ترمنځ په خپلواکه توګه تایید شي.');
    return;
  }

  // Search, directory and account.
  if (text === t.search) {
    user = await updateUser(user, { state: 'search' });
    await send(chatId, t.searchPrompt, keyboard([[t.back]])); return;
  }
  if (user.state === 'search') {
    const q = text.replace(/[\\%_]/g, '').slice(0, 80);
    if (!q) { await send(chatId, t.searchPrompt); return; }
    const all = await db.select().from(listings).where(eq(listings.status, 'approved')).all();
    const needle = q.toLowerCase().replace(/^@/, '');
    const found = all.filter(x =>
      String(x.name ?? '').toLowerCase().includes(needle) ||
      String(x.username ?? '').toLowerCase().includes(needle) ||
      String(x.category ?? '').toLowerCase().includes(needle) ||
      String(x.type ?? '').toLowerCase() === needle
    ).slice(0, 10);
    user = await updateUser(user, { state: null });
    if (!found.length) { await send(chatId, t.noResults, mainKeyboard(t, admin)); return; }
    const body = found.map(x => `#${x.id} | ${x.type} | ${x.name}\n${x.username ?? 'لینک نشته'}\nکټګوري: ${x.category ?? '—'} | ژبه: ${x.language ?? '—'}\n${x.description ?? ''}${x.ad_price !== null && x.ad_price !== undefined && ['channel', 'group'].includes(x.type) ? `\nد اعلان بیه: ${x.ad_price} ${x.currency ?? 'USD'}\nغوښتنه: /request_ad ${x.id}` : ''}`).join('\n\n');
    await send(chatId, t.results + '\n\n' + body, mainKeyboard(t, admin)); return;
  }
  if (text === t.market) { await showMarket(chatId, user); return; }
  if (text === t.register) { await send(chatId, t.chooseType, typeKeyboard(t)); return; }
  if ([t.channel, t.group, t.bot].includes(text)) {
    const type = text === t.channel ? 'channel' : text === t.group ? 'group' : 'bot';
    user = await updateUser(user, {
      state: 'listing_name', draft_type: type, draft_name: null, draft_username: null,
      draft_description: null, draft_category: null, draft_language: null, draft_price: null
    });
    await send(chatId, t.askName, keyboard([[t.back]])); return;
  }
  if (text === t.ads) {
    user = await updateUser(user, { state: 'ad_title', draft_title: null, draft_description: null, draft_budget: null, draft_ad_target: null, draft_url: null });
    await send(chatId, t.adsIntro, keyboard([[t.back]])); return;
  }
  if (text === t.account) {
    const ownListings = await db.select().from(listings).where(eq(listings.owner_id, user.id)).all();
    const ownAds = await db.select().from(ads).where(eq(ads.owner_id, user.id)).all();
    const listingLines = ownListings.length ? ownListings.slice(0, 10).map(x => `#${x.id} ${x.name} — ${statusText(t, x.status)}`).join('\n') : t.noListings;
    const adLines = ownAds.length ? ownAds.slice(0, 10).map(x => `#${x.id} ${x.title} — ${statusText(t, x.status)}`).join('\n') : t.noAds;
    await send(chatId, `${t.account}\n\n🆔 Telegram ID: ${message.from.id}\n👤 ${message.from.first_name ?? ''}\n\n📋 ثبتونه:\n${listingLines}\n\n📢 اعلانونه:\n${adLines}`, mainKeyboard(t, admin)); return;
  }

  await send(chatId, t.unknown, mainKeyboard(t, admin));
}
