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

const T = {
  ps: {
    lang: '🌐 لومړی خپله ژبه وټاکه:', country: '🌍 خپل هېواد وټاکه:', gender: '👤 خپل جنسیت وټاکه:',
    age: '🎂 خپل نږدې عمر وټاکه. عمرونه له ۱۲ څخه تر ۴۰ پورې دي؛ نږدې عمر انتخاب کړه:',
    name: '✍️ خپل نوم ولیکه:', surname: '📝 تخلص اختیاري دی. که یې نه لیکې، لاندې بټن کېکاږه:',
    skip: 'تخلص نه لیکم', membership: '🔐 د بوټ کارولو لپاره په لاندې ټولو ګروپونو یا چینلونو کې ګډون وکړه، بیا د غړیتوب کتلو بټن کېکاږه:',
    joined: '✅ ګډون مې وکړ، بیا یې وګوره', membershipFail: '⚠️ غړیتوب تایید نه شو. په ټولو ګروپونو کې ګډون وکړه او ډاډ ترلاسه کړه چې بوټ د غړیتوب د کتلو اجازه لري.',
    ready: '🎉 ستا پروفایل جوړ شو!', blocked: '⛔ ستا حساب محدود شوی دی.',
    menu: ['🔎 ملګری پیدا کړه', '👥 پالو ملګري', '🎲 ناڅاپي اړیکه', '📨 ملګری رابلل', '👤 زما پروفایل', '🌍 د ژبې بدلول', '⚙️ تنظیمات', '📊 احصائیې', '🛡️ د اډمین پینل'],
    settings: '⚙️ د پروفایل د بدلولو لپاره یوه برخه وټاکه:',
    settingsButtons: ['🌍 هېواد بدلول', '👤 جنسیت بدلول', '🎂 عمر بدلول', '✍️ نوم بدلول', '📝 تخلص بدلول', '🔙 اصلي مېنو'],
    male: 'نارینه', female: 'ښځینه', admin: '🛡️ د اډمین پینل', adminIntro: 'د اډمین پینل ته ښه راغلاست:',
    adminButtons: ['➕ مدیر زیاتول', '➖ مدیر لرې کول', '📢 د غړیتوب ګروپونه', '📣 ډله‌ییز اعلان', '👥 د مدیرانو لېست', '📊 احصائیې', '🔙 اصلي مېنو'],
    channelIntro: '📢 د اجباري غړیتوب اداره:',
    channelButtons: ['➕ ګروپ یا چینل زیاتول', '➖ ګروپ یا چینل لرې کول', '📋 د ګروپونو لېست', '🔙 اصلي مېنو'],
    askAdmin: 'د نوي مدیر ټیلیګرام عددي ID راولېږه:', askRemoveAdmin: 'د لرې کېدونکي مدیر عددي ID راولېږه:',
    askChannel: 'دا معلومات په دې بڼه راولېږه:\nchat_id | لینک | نوم\nبېلګه: -1001234567890 | https://t.me/example | Example',
    askRemoveChannel: 'د لرې کېدونکي ګروپ یا چینل chat_id راولېږه:',
    askBroadcast: '📣 د اعلان متن راولېږه. د لغوه کولو لپاره د لغوه بټن کېکاږه.',
    cancel: '❌ لغوه کول', badId: '⚠️ سم عددي ID راولېږه.', adminAdded: '✅ مدیر اضافه شو.',
    adminExists: 'ℹ️ دا کس له مخکې مدیر دی.', adminRemoved: '✅ مدیر لرې شو.',
    rootAdmin: '⛔ اصلي مدیران نه شي لرې کېدای.', channelAdded: '✅ ګروپ یا چینل اضافه شو.',
    channelExists: 'ℹ️ دا ID له مخکې شته.', channelRemoved: '✅ ګروپ یا چینل لرې شو.',
    channelMissing: '⚠️ دا ID ونه موندل شو.', channelEmpty: 'د غړیتوب لېست تش دی.',
    adminEmpty: 'د مدیرانو لېست تش دی.', noFavorites: '❤️ ستا د پالو ملګرو لېست اوس تش دی. د اړیکې پر مهال د ملګري پالو کول به وروسته فعاله شي.',
    profile: '👤 ستا پروفایل', notSet: 'نه دی ټاکل شوی', stats: '📊 احصائیې',
    users: '👥 ټول کاروونکي: ', admins: '🛡️ مدیران: ', channels: '📢 اجباري ګروپونه: ',
    referrals: '📨 ستا له لینک څخه راغلي کسان: ', favorites: '❤️ پالو ملګري: ',
    referralTitle: '🚀 خپل د ملګرو نړۍ پراخه کړه!', referralText: '🌍 له نوو خلکو سره اشنا شه او نوې خبرې پیل کړه!\n\n❤️ خپل ځانګړی لینک له ملګرو سره شریک کړه او د Random Connect ټولنې ته یې راوبله.',
    share: '📤 له ملګرو سره شریکول', later: '🚧 دا برخه به د بوټ په راتلونکي پړاو کې فعاله شي. اوس د بوټ جوړښت او پروفایل بشپړوو.',
    saved: '✅ بدلون ثبت شو.', broadcastDone: '📣 اعلان بشپړ شو.\nلېږل شوي: ', broadcastFailed: '\nناکام: ',
    main: 'اصلي مېنو:', nameInvalid: 'مهرباني وکړه مناسب نوم ولیکه.',
    channelFormat: '⚠️ بڼه ناسمه ده. chat_id | لینک | نوم وکاروه.',
    noAccess: '⛔ دا برخه یوازې د مجاز مدیرانو لپاره ده.'
  },
  fa: {
    lang: '🌐 زبان خود را انتخاب کنید:', country: '🌍 کشور خود را انتخاب کنید:', gender: '👤 جنسیت خود را انتخاب کنید:',
    age: '🎂 نزدیک‌ترین سن خود را از ۱۲ تا ۴۰ سال انتخاب کنید:', name: '✍️ نام خود را بنویسید:',
    surname: '📝 نام خانوادگی اختیاری است. برای رد کردن، دکمه زیر را بزنید:', skip: 'رد کردن نام خانوادگی',
    membership: '🔐 برای استفاده از ربات، عضو همه گروه‌ها یا کانال‌های زیر شوید و سپس عضویت را بررسی کنید:',
    joined: '✅ عضو شدم، بررسی کن', membershipFail: '⚠️ عضویت تأیید نشد. عضو همه گروه‌ها شوید و دسترسی بررسی عضویت ربات را بررسی کنید.',
    ready: '🎉 پروفایل شما آماده شد!', blocked: '⛔ حساب شما محدود شده است.',
    menu: ['🔎 پیدا کردن دوست', '👥 دوستان محبوب', '🎲 ارتباط تصادفی', '📨 دعوت از دوست', '👤 پروفایل من', '🌍 تغییر زبان', '⚙️ تنظیمات', '📊 آمار', '🛡️ پنل مدیریت'],
    settings: '⚙️ بخشی را برای ویرایش پروفایل انتخاب کنید:',
    settingsButtons: ['🌍 تغییر کشور', '👤 تغییر جنسیت', '🎂 تغییر سن', '✍️ تغییر نام', '📝 تغییر نام خانوادگی', '🔙 منوی اصلی'],
    male: 'مرد', female: 'زن', admin: '🛡️ پنل مدیریت', adminIntro: 'به پنل مدیریت خوش آمدید:',
    adminButtons: ['➕ افزودن مدیر', '➖ حذف مدیر', '📢 گروه‌های عضویت اجباری', '📣 پیام همگانی', '👥 فهرست مدیران', '📊 آمار', '🔙 منوی اصلی'],
    channelIntro: '📢 مدیریت عضویت اجباری:',
    channelButtons: ['➕ افزودن گروه یا کانال', '➖ حذف گروه یا کانال', '📋 فهرست گروه‌ها', '🔙 منوی اصلی'],
    askAdmin: 'شناسه عددی تلگرام مدیر جدید را بفرستید:', askRemoveAdmin: 'شناسه عددی مدیر را برای حذف بفرستید:',
    askChannel: 'اطلاعات را به این شکل بفرستید:\nchat_id | لینک | نام',
    askRemoveChannel: 'chat_id گروه یا کانال را برای حذف بفرستید:',
    askBroadcast: '📣 متن پیام همگانی را بفرستید. برای لغو دکمه لغو را بزنید.',
    cancel: '❌ لغو', badId: '⚠️ شناسه عددی معتبر بفرستید.', adminAdded: '✅ مدیر اضافه شد.',
    adminExists: 'ℹ️ این شخص از قبل مدیر است.', adminRemoved: '✅ مدیر حذف شد.',
    rootAdmin: '⛔ مدیران اصلی قابل حذف نیستند.', channelAdded: '✅ گروه یا کانال اضافه شد.',
    channelExists: 'ℹ️ این شناسه از قبل وجود دارد.', channelRemoved: '✅ گروه یا کانال حذف شد.',
    channelMissing: '⚠️ شناسه پیدا نشد.', channelEmpty: 'فهرست عضویت اجباری خالی است.',
    adminEmpty: 'فهرست مدیران خالی است.', noFavorites: '❤️ فهرست دوستان محبوب شما فعلاً خالی است.',
    profile: '👤 پروفایل شما', notSet: 'تنظیم نشده', stats: '📊 آمار',
    users: '👥 کل کاربران: ', admins: '🛡️ مدیران: ', channels: '📢 گروه‌های اجباری: ',
    referrals: '📨 افراد دعوت‌شده توسط شما: ', favorites: '❤️ دوستان محبوب: ',
    referralTitle: '🚀 دنیای دوستانت را گسترش بده!', referralText: '🌍 برای آشنایی با افراد جدید به من بپیوند!\n\n❤️ لینک دعوت را با دوستانت به اشتراک بگذار.',
    share: '📤 اشتراک‌گذاری', later: '🚧 این بخش در مرحله بعد فعال می‌شود. فعلاً ساختار ربات و پروفایل را کامل می‌کنیم.',
    saved: '✅ تغییرات ذخیره شد.', broadcastDone: '📣 پیام همگانی تمام شد.\nارسال موفق: ', broadcastFailed: '\nناموفق: ',
    main: 'منوی اصلی:', nameInvalid: 'لطفاً نام معتبری بنویسید.',
    channelFormat: '⚠️ قالب: chat_id | لینک | نام', noAccess: '⛔ این بخش فقط برای مدیران مجاز است.'
  },
  en: {
    lang: '🌐 Choose your language:', country: '🌍 Choose your country:', gender: '👤 Choose your gender:',
    age: '🎂 Choose the closest age from 12 to 40:', name: '✍️ Enter your name:',
    surname: '📝 Surname is optional. Press below to skip:', skip: 'Skip surname',
    membership: '🔐 Join every group or channel below to use the bot, then check your membership:',
    joined: '✅ I joined, check again', membershipFail: '⚠️ Membership is not confirmed. Join all listed groups and ensure the bot can check membership.',
    ready: '🎉 Your profile is ready!', blocked: '⛔ Your account is restricted.',
    menu: ['🔎 Find a friend', '👥 Favorite friends', '🎲 Random connection', '📨 Invite a friend', '👤 My profile', '🌍 Change language', '⚙️ Settings', '📊 Statistics', '🛡️ Admin panel'],
    settings: '⚙️ Choose a profile field to edit:',
    settingsButtons: ['🌍 Change country', '👤 Change gender', '🎂 Change age', '✍️ Change name', '📝 Change surname', '🔙 Main menu'],
    male: 'Male', female: 'Female', admin: '🛡️ Admin panel', adminIntro: 'Welcome to the admin panel:',
    adminButtons: ['➕ Add admin', '➖ Remove admin', '📢 Required membership', '📣 Broadcast', '👥 List admins', '📊 Statistics', '🔙 Main menu'],
    channelIntro: '📢 Required membership management:',
    channelButtons: ['➕ Add group/channel', '➖ Remove group/channel', '📋 List groups', '🔙 Main menu'],
    askAdmin: 'Send the new admin Telegram numeric ID:', askRemoveAdmin: 'Send the numeric ID of the admin to remove:',
    askChannel: 'Send details in this format:\nchat_id | link | title',
    askRemoveChannel: 'Send the chat_id of the group/channel to remove:',
    askBroadcast: '📣 Send the broadcast text. Press Cancel to stop.',
    cancel: '❌ Cancel', badId: '⚠️ Send a valid numeric ID.', adminAdded: '✅ Admin added.',
    adminExists: 'ℹ️ This person is already an admin.', adminRemoved: '✅ Admin removed.',
    rootAdmin: '⛔ The original admins cannot be removed.', channelAdded: '✅ Group or channel added.',
    channelExists: 'ℹ️ This ID already exists.', channelRemoved: '✅ Group or channel removed.',
    channelMissing: '⚠️ ID not found.', channelEmpty: 'The required-membership list is empty.',
    adminEmpty: 'The admin list is empty.', noFavorites: '❤️ Your favorite-friends list is empty for now.',
    profile: '👤 Your profile', notSet: 'Not set', stats: '📊 Statistics',
    users: '👥 Total users: ', admins: '🛡️ Admins: ', channels: '📢 Required groups: ',
    referrals: '📨 People who joined from your link: ', favorites: '❤️ Favorite friends: ',
    referralTitle: '🚀 Grow your circle of friends!', referralText: '🌍 Join me to discover and chat with new people!\n\n❤️ Share your invite link with friends and bring them to Random Connect.',
    share: '📤 Share with friends', later: '🚧 This feature will be enabled in a later stage. We are building the bot and profile first.',
    saved: '✅ Changes saved.', broadcastDone: '📣 Broadcast finished.\nSent: ', broadcastFailed: '\nFailed: ',
    main: 'Main menu:', nameInvalid: 'Please enter a valid name.',
    channelFormat: '⚠️ Format: chat_id | link | title', noAccess: '⛔ This section is for authorized admins only.'
  },
  ur: {
    lang: '🌐 اپنی زبان منتخب کریں:', country: '🌍 اپنا ملک منتخب کریں:', gender: '👤 اپنی جنس منتخب کریں:',
    age: '🎂 12 سے 40 سال کے درمیان اپنی قریب ترین عمر منتخب کریں:', name: '✍️ اپنا نام لکھیں:',
    surname: '📝 خاندانی نام اختیاری ہے۔ چھوڑنے کے لیے نیچے بٹن دبائیں:', skip: 'خاندانی نام چھوڑیں',
    membership: '🔐 بوٹ استعمال کرنے کے لیے نیچے دیے گئے تمام گروپس یا چینلز میں شامل ہوں، پھر تصدیق کریں:',
    joined: '✅ شامل ہوگیا، دوبارہ چیک کریں', membershipFail: '⚠️ رکنیت کی تصدیق نہیں ہوئی۔ تمام گروپس میں شامل ہوں اور بوٹ کی اجازت چیک کریں۔',
    ready: '🎉 آپ کا پروفائل تیار ہے!', blocked: '⛔ آپ کا اکاؤنٹ محدود ہے۔',
    menu: ['🔎 دوست تلاش کریں', '👥 پسندیدہ دوست', '🎲 اچانک رابطہ', '📨 دوست کو بلائیں', '👤 میرا پروفائل', '🌍 زبان تبدیل کریں', '⚙️ ترتیبات', '📊 اعدادوشمار', '🛡️ ایڈمن پینل'],
    settings: '⚙️ پروفائل میں تبدیلی کے لیے حصہ منتخب کریں:',
    settingsButtons: ['🌍 ملک تبدیل کریں', '👤 جنس تبدیل کریں', '🎂 عمر تبدیل کریں', '✍️ نام تبدیل کریں', '📝 خاندانی نام تبدیل کریں', '🔙 مرکزی مینو'],
    male: 'مرد', female: 'عورت', admin: '🛡️ ایڈمن پینل', adminIntro: 'ایڈمن پینل میں خوش آمدید:',
    adminButtons: ['➕ ایڈمن شامل کریں', '➖ ایڈمن ہٹائیں', '📢 لازمی گروپس', '📣 سب کو پیغام', '👥 ایڈمنز کی فہرست', '📊 اعدادوشمار', '🔙 مرکزی مینو'],
    channelIntro: '📢 لازمی رکنیت کا انتظام:',
    channelButtons: ['➕ گروپ یا چینل شامل کریں', '➖ گروپ یا چینل ہٹائیں', '📋 گروپس کی فہرست', '🔙 مرکزی مینو'],
    askAdmin: 'نئے ایڈمن کا ٹیلیگرام عددی ID بھیجیں:', askRemoveAdmin: 'ہٹانے والے ایڈمن کا عددی ID بھیجیں:',
    askChannel: 'اس فارمیٹ میں معلومات بھیجیں:\nchat_id | لنک | نام',
    askRemoveChannel: 'ہٹانے کے لیے گروپ یا چینل کا chat_id بھیجیں:',
    askBroadcast: '📣 سب کو بھیجنے والا پیغام لکھیں۔ منسوخ کرنے کے لیے بٹن دبائیں۔',
    cancel: '❌ منسوخ', badId: '⚠️ درست عددی ID بھیجیں۔', adminAdded: '✅ ایڈمن شامل ہوگیا۔',
    adminExists: 'ℹ️ یہ شخص پہلے ہی ایڈمن ہے۔', adminRemoved: '✅ ایڈمن ہٹا دیا گیا۔',
    rootAdmin: '⛔ اصل ایڈمنز کو نہیں ہٹایا جاسکتا۔', channelAdded: '✅ گروپ یا چینل شامل ہوگیا۔',
    channelExists: 'ℹ️ یہ ID پہلے سے موجود ہے۔', channelRemoved: '✅ گروپ یا چینل ہٹا دیا گیا۔',
    channelMissing: '⚠️ ID نہیں ملا۔', channelEmpty: 'لازمی رکنیت کی فہرست خالی ہے۔',
    adminEmpty: 'ایڈمن فہرست خالی ہے۔', noFavorites: '❤️ پسندیدہ دوستوں کی فہرست فی الحال خالی ہے۔',
    profile: '👤 آپ کا پروفائل', notSet: 'منتخب نہیں', stats: '📊 اعدادوشمار',
    users: '👥 کل صارفین: ', admins: '🛡️ ایڈمنز: ', channels: '📢 لازمی گروپس: ',
    referrals: '📨 آپ کے لنک سے آنے والے افراد: ', favorites: '❤️ پسندیدہ دوست: ',
    referralTitle: '🚀 اپنے دوستوں کا حلقہ بڑھائیں!', referralText: '🌍 نئے لوگوں سے ملنے کے لیے میرے ساتھ شامل ہوں!\n\n❤️ اپنا دعوتی لنک دوستوں کے ساتھ شیئر کریں۔',
    share: '📤 دوستوں کے ساتھ شیئر کریں', later: '🚧 یہ سہولت اگلے مرحلے میں فعال ہوگی۔ ابھی بوٹ اور پروفائل تیار کررہے ہیں۔',
    saved: '✅ تبدیلی محفوظ ہوگئی۔', broadcastDone: '📣 پیغام بھیجنا مکمل ہوا۔\nکامیاب: ', broadcastFailed: '\nناکام: ',
    main: 'مرکزی مینو:', nameInvalid: 'براہ کرم درست نام لکھیں.',
    channelFormat: '⚠️ فارمیٹ: chat_id | لنک | نام', noAccess: '⛔ یہ حصہ صرف مجاز ایڈمنز کے لیے ہے۔'
  },
  ar: {
    lang: '🌐 اختر لغتك:', country: '🌍 اختر بلدك:', gender: '👤 اختر جنسك:',
    age: '🎂 اختر عمرك الأقرب من 12 إلى 40 سنة:', name: '✍️ اكتب اسمك:',
    surname: '📝 اسم العائلة اختياري. اضغط أدناه للتخطي:', skip: 'تخطي اسم العائلة',
    membership: '🔐 لاستخدام البوت، انضم إلى كل مجموعة أو قناة أدناه ثم تحقق من العضوية:',
    joined: '✅ انضممت، تحقق مرة أخرى', membershipFail: '⚠️ لم يتم تأكيد العضوية. انضم إلى جميع المجموعات وتأكد أن البوت يستطيع التحقق.',
    ready: '🎉 ملفك الشخصي جاهز!', blocked: '⛔ حسابك مقيّد.',
    menu: ['🔎 ابحث عن صديق', '👥 الأصدقاء المفضلون', '🎲 اتصال عشوائي', '📨 دعوة صديق', '👤 ملفي الشخصي', '🌍 تغيير اللغة', '⚙️ الإعدادات', '📊 الإحصائيات', '🛡️ لوحة الإدارة'],
    settings: '⚙️ اختر ما تريد تغييره في ملفك الشخصي:',
    settingsButtons: ['🌍 تغيير البلد', '👤 تغيير الجنس', '🎂 تغيير العمر', '✍️ تغيير الاسم', '📝 تغيير اسم العائلة', '🔙 القائمة الرئيسية'],
    male: 'ذكر', female: 'أنثى', admin: '🛡️ لوحة الإدارة', adminIntro: 'مرحبًا بك في لوحة الإدارة:',
    adminButtons: ['➕ إضافة مدير', '➖ إزالة مدير', '📢 مجموعات العضوية الإلزامية', '📣 رسالة جماعية', '👥 قائمة المديرين', '📊 الإحصائيات', '🔙 القائمة الرئيسية'],
    channelIntro: '📢 إدارة العضوية الإلزامية:',
    channelButtons: ['➕ إضافة مجموعة أو قناة', '➖ إزالة مجموعة أو قناة', '📋 قائمة المجموعات', '🔙 القائمة الرئيسية'],
    askAdmin: 'أرسل رقم معرف تيليجرام للمدير الجديد:', askRemoveAdmin: 'أرسل رقم معرف المدير الذي تريد إزالته:',
    askChannel: 'أرسل المعلومات بهذا الشكل:\nchat_id | الرابط | الاسم',
    askRemoveChannel: 'أرسل chat_id للمجموعة أو القناة التي تريد إزالتها:',
    askBroadcast: '📣 أرسل نص الرسالة الجماعية. اضغط إلغاء للتوقف.',
    cancel: '❌ إلغاء', badId: '⚠️ أرسل معرفًا رقميًا صحيحًا.', adminAdded: '✅ تمت إضافة المدير.',
    adminExists: 'ℹ️ هذا الشخص مدير بالفعل.', adminRemoved: '✅ تمت إزالة المدير.',
    rootAdmin: '⛔ لا يمكن إزالة المديرين الأصليين.', channelAdded: '✅ تمت إضافة المجموعة أو القناة.',
    channelExists: 'ℹ️ هذا المعرف موجود بالفعل.', channelRemoved: '✅ تمت إزالة المجموعة أو القناة.',
    channelMissing: '⚠️ لم يتم العثور على المعرف.', channelEmpty: 'قائمة العضوية الإلزامية فارغة.',
    adminEmpty: 'قائمة المديرين فارغة.', noFavorites: '❤️ قائمة الأصدقاء المفضلين فارغة حاليًا.',
    profile: '👤 ملفك الشخصي', notSet: 'غير محدد', stats: '📊 الإحصائيات',
    users: '👥 إجمالي المستخدمين: ', admins: '🛡️ المديرون: ', channels: '📢 المجموعات الإلزامية: ',
    referrals: '📨 الأشخاص الذين انضموا عبر رابطك: ', favorites: '❤️ الأصدقاء المفضلون: ',
    referralTitle: '🚀 وسّع دائرة أصدقائك!', referralText: '🌍 انضم إليّ للتعرّف على أشخاص جدد والدردشة معهم!\n\n❤️ شارك رابط الدعوة مع أصدقائك.',
    share: '📤 مشاركة مع الأصدقاء', later: '🚧 سيتم تفعيل هذه الميزة في مرحلة لاحقة. نكمل الآن بنية البوت والملف الشخصي.',
    saved: '✅ تم حفظ التغييرات.', broadcastDone: '📣 انتهى الإرسال الجماعي.\nتم الإرسال: ', broadcastFailed: '\nفشل: ',
    main: 'القائمة الرئيسية:', nameInvalid: 'يرجى كتابة اسم صالح.',
    channelFormat: '⚠️ الصيغة: chat_id | الرابط | الاسم', noAccess: '⛔ هذا القسم للمديرين المصرح لهم فقط.'
  }
};

function tx(user) { return T[user && T[user.language] ? user.language : 'ps']; }
function keyboard(rows, extra) {
  const result = { keyboard: rows, resize_keyboard: true };
  if (extra) Object.assign(result, extra);
  return result;
}
function menuKeyboard(user, admin) {
  const m = tx(user).menu;
  const rows = [
    [{ text: m[0] }, { text: m[1] }],
    [{ text: m[2] }, { text: m[3] }],
    [{ text: m[4] }, { text: m[5] }],
    [{ text: m[6] }, { text: m[7] }]
  ];
  if (admin) rows.push([{ text: m[8] }]);
  return keyboard(rows);
}
function languageKeyboard() {
  return keyboard([[{ text: 'پښتو' }, { text: 'دری' }], [{ text: 'English' }, { text: 'اردو' }], [{ text: 'العربية' }]], { one_time_keyboard: true });
}
function countryKeyboard() {
  const rows = [];
  for (let i = 0; i < COUNTRIES.length; i += 2) {
    const row = [{ text: COUNTRIES[i].label }];
    if (COUNTRIES[i + 1]) row.push({ text: COUNTRIES[i + 1].label });
    rows.push(row);
  }
  return keyboard(rows, { one_time_keyboard: true });
}
function ageKeyboard() {
  const rows = [];
  for (let i = 0; i < AGES.length; i += 3) rows.push(AGES.slice(i, i + 3).map(function (age) { return { text: String(age) }; }));
  return keyboard(rows, { one_time_keyboard: true });
}
function genderKeyboard(user) { return keyboard([[{ text: tx(user).male }, { text: tx(user).female }]], { one_time_keyboard: true }); }
function settingsKeyboard(user) {
  const b = tx(user).settingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }], [{ text: b[4] }, { text: b[5] }]]);
}
function adminKeyboard(user) {
  const b = tx(user).adminButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }], [{ text: b[4] }, { text: b[5] }], [{ text: b[6] }]]);
}
function channelKeyboard(user) {
  const b = tx(user).channelButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }]]);
}
function actionFor(input) {
  for (const lang of Object.keys(T)) {
    const t = T[lang];
    const m = t.menu;
    const pairs = [
      ['find', m[0]], ['favorites', m[1]], ['random', m[2]], ['invite', m[3]], ['profile', m[4]],
      ['language', m[5]], ['settings', m[6]], ['stats', m[7]], ['admin', m[8]], ['joined', t.joined],
      ['country', t.settingsButtons[0]], ['gender', t.settingsButtons[1]], ['age', t.settingsButtons[2]],
      ['name', t.settingsButtons[3]], ['surname', t.settingsButtons[4]], ['back', t.settingsButtons[5]],
      ['adminAdd', t.adminButtons[0]], ['adminRemove', t.adminButtons[1]], ['channels', t.adminButtons[2]],
      ['broadcast', t.adminButtons[3]], ['adminsList', t.adminButtons[4]], ['channelAdd', t.channelButtons[0]],
      ['channelRemove', t.channelButtons[1]], ['channelList', t.channelButtons[2]], ['cancel', t.cancel], ['skip', t.skip]
    ];
    for (const pair of pairs) if (pair[1] === input) return pair[0];
  }
  return null;
}
async function safeDelete(chatId, messageId) {
  if (!messageId) return;
  try { await api.deleteMessage({ chat_id: chatId, message_id: messageId }); } catch (e) {}
}
async function sendPrompt(chatId, text, markup, user) {
  if (user && Number(user.last_prompt_id) > 0) await safeDelete(chatId, Number(user.last_prompt_id));
  const sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: markup });
  if (user && sent && sent.message_id) {
    await db.update(users).set({ last_prompt_id: sent.message_id }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = sent.message_id;
  }
  return sent;
}
async function getUser(id) { return await db.select().from(users).where(eq(users.telegram_id, Number(id))).get(); }
async function isAdmin(id) {
  if (ROOT_ADMINS.includes(Number(id))) return true;
  return Boolean(await db.select().from(admins).where(eq(admins.telegram_id, Number(id))).get());
}
async function ensureDefaults() {
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
async function getRequiredChats() { return await db.select().from(required_chats).where(eq(required_chats.is_active, 1)).all(); }
async function showMembership(chatId, user) {
  const t = tx(user);
  const chats = await getRequiredChats();
  let text = t.membership + '\n\n';
  for (const chat of chats) text += '• ' + chat.title + '\n' + chat.invite_link + '\n\n';
  text += '\n' + t.joined;
  await sendPrompt(chatId, text, keyboard([[{ text: t.joined }]], { one_time_keyboard: true }), user);
}
async function checkMembership(id) {
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
async function showLanguage(chatId, user) { await sendPrompt(chatId, tx(user).lang, languageKeyboard(), user); }
async function showCountry(chatId, user) { await sendPrompt(chatId, tx(user).country, countryKeyboard(), user); }
async function showGender(chatId, user) { await sendPrompt(chatId, tx(user).gender, genderKeyboard(user), user); }
async function showAge(chatId, user) { await sendPrompt(chatId, tx(user).age, ageKeyboard(), user); }
async function showName(chatId, user) { await sendPrompt(chatId, tx(user).name, { force_reply: true }, user); }
async function showSurname(chatId, user) { await sendPrompt(chatId, tx(user).surname, keyboard([[{ text: tx(user).skip }]], { one_time_keyboard: true }), user); }
async function showMain(chatId, user, text) {
  await sendPrompt(chatId, (text ? text + '\n\n' : '') + tx(user).main, menuKeyboard(user, await isAdmin(user.telegram_id)), user);
}
async function showProfile(chatId, user) {
  const t = tx(user);
  const c = COUNTRIES.find(function (item) { return item.code === user.country; });
  const l = LANGUAGES.find(function (item) { return item.code === user.language; }) || LANGUAGES[0];
  const genderLabel = user.gender === 'male' ? t.male : (user.gender === 'female' ? t.female : t.notSet);
  const text = t.profile + '\n\n👤 ' + (user.name || user.first_name || t.notSet) +
    '\n📝 ' + (user.surname || t.notSet) + '\n🌍 ' + (c ? c.label : t.notSet) +
    '\n⚧ ' + genderLabel + '\n🎂 ' + (user.age || t.notSet) + '\n🗣️ ' + l.label;
  await sendPrompt(chatId, text, menuKeyboard(user, await isAdmin(user.telegram_id)), user);
}
async function showFavorites(chatId, user) {
  const t = tx(user);
  const list = await db.select().from(favorites).where(eq(favorites.user_telegram_id, Number(user.telegram_id))).all();
  if (!list.length) {
    await sendPrompt(chatId, t.noFavorites, menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  let text = '❤️\n\n';
  for (const item of list) {
    const friend = await getUser(item.favorite_telegram_id);
    if (friend) text += '• ' + (friend.name || friend.first_name || 'User') +
      (friend.username ? ' (@' + friend.username + ')' : '') + '\n';
  }
  await sendPrompt(chatId, text, menuKeyboard(user, await isAdmin(user.telegram_id)), user);
}
async function showStats(chatId, user) {
  const t = tx(user);
  if (await isAdmin(user.telegram_id)) {
    const uc = await db.$count(users);
    const ac = await db.$count(admins);
    const cc = await db.$count(required_chats, eq(required_chats.is_active, 1));
    await sendPrompt(chatId, t.stats + '\n\n' + t.users + uc + '\n' + t.admins + ac + '\n' + t.channels + cc, adminKeyboard(user), user);
  } else {
    const fc = await db.$count(favorites, eq(favorites.user_telegram_id, Number(user.telegram_id)));
    await sendPrompt(chatId, t.stats + '\n\n' + t.referrals + Number(user.referral_count || 0) + '\n' + t.favorites + fc,
      menuKeyboard(user, false), user);
  }
}
async function showReferral(chatId, user) {
  const t = tx(user);
  const me = await api.getMe();
  const link = 'https://t.me/' + me.username + '?start=' + String(user.telegram_id);
  const share = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(t.referralText);
  await sendPrompt(chatId, t.referralTitle + '\n\n' + t.referralText + '\n\n' + link,
    { inline_keyboard: [[{ text: t.share, url: share }]] }, user);
}
async function showAdminList(chatId, user) {
  const t = tx(user);
  const list = await db.select().from(admins).all();
  let text = t.adminButtons[4] + '\n\n';
  if (!list.length) text += t.adminEmpty;
  else for (const row of list) text += '• ' + row.telegram_id + '\n';
  await sendPrompt(chatId, text, adminKeyboard(user), user);
}
async function showChannelList(chatId, user) {
  const t = tx(user);
  const list = await getRequiredChats();
  let text = t.channelButtons[2] + '\n\n';
  if (!list.length) text += t.channelEmpty;
  else for (const row of list) text += '• ' + row.title + '\nID: ' + row.chat_id + '\n' + row.invite_link + '\n\n';
  await sendPrompt(chatId, text, channelKeyboard(user), user);
}
async function completeProfile(chatId, user, extra) {
  await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
  user.state = 'ready';
  await showMain(chatId, user, (extra ? extra + '\n' : '') + tx(user).ready);
}
async function processMessage(message) {
  if (!message || !message.chat || !message.from || message.chat.type !== 'private') return;
  const chatId = message.chat.id;
  const id = Number(message.from.id);
  const input = String(message.text || '').trim();
  if (!Number.isSafeInteger(id) || id <= 0) return;
  await ensureDefaults();
  let user = await getUser(id);
  const start = input === '/start' || input.startsWith('/start ');
  let referrer = null;
  if (start && input.startsWith('/start ')) {
    const candidate = Number(input.slice(7).trim());
    if (Number.isSafeInteger(candidate) && candidate > 0 && candidate !== id) referrer = candidate;
  }
  if (!user) {
    await db.insert(users).values({
      telegram_id: id, username: message.from.username || null, first_name: message.from.first_name || null,
      language: 'ps', country: null, gender: null, age: null, name: null, surname: null,
      state: 'choose_language', is_blocked: 0, referrer_id: referrer, referral_count: 0,
      last_prompt_id: 0, created_at: new Date().toISOString()
    }).run();
    user = await getUser(id);
    if (referrer) {
      const parent = await getUser(referrer);
      if (parent) await db.update(users).set({ referral_count: Number(parent.referral_count || 0) + 1 })
        .where(eq(users.telegram_id, referrer)).run();
    }
  } else {
    await db.update(users).set({ username: message.from.username || null, first_name: message.from.first_name || null })
      .where(eq(users.telegram_id, id)).run();
  }
  if (!user) return;
  if (Number(user.is_blocked) === 1) {
    await sendPrompt(chatId, tx(user).blocked, { remove_keyboard: true }, user);
    return;
  }
  // Keep user messages visible; only replace the bot's previous prompt.
  const protectedStates = ['admin_menu', 'admin_channels_menu', 'waiting_admin_id', 'waiting_remove_admin_id', 'waiting_channel_details', 'waiting_remove_channel_id', 'waiting_broadcast'];
  if (protectedStates.includes(user.state) && !(await isAdmin(id))) {
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run();
    user.state = 'ready';
    await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user);
    return;
  }

  if (start) {
    if (user.state === 'ready') await showMain(chatId, user);
    else if (user.state === 'check_membership') await showMembership(chatId, user);
    else if (user.state === 'choose_country' || user.state === 'settings_country') await showCountry(chatId, user);
    else if (user.state === 'choose_gender' || user.state === 'settings_gender') await showGender(chatId, user);
    else if (user.state === 'choose_age' || user.state === 'settings_age') await showAge(chatId, user);
    else if (user.state === 'enter_name' || user.state === 'settings_name') await showName(chatId, user);
    else if (user.state === 'enter_surname' || user.state === 'settings_surname') await showSurname(chatId, user);
    else await showLanguage(chatId, user);
    return;
  }

  const action = actionFor(input);
  if (input === '/check' || input === '/joined') {
    if (user.state !== 'check_membership') { await showMain(chatId, user); return; }
    if (await checkMembership(id)) {
      await db.update(users).set({ state: 'choose_country' }).where(eq(users.telegram_id, id)).run();
      user.state = 'choose_country';
      await showCountry(chatId, user);
    } else await sendPrompt(chatId, tx(user).membershipFail, keyboard([[{ text: tx(user).joined }]]), user);
    return;
  }

  if (user.state === 'choose_language') {
    const selected = LANGUAGES.find(function (item) { return item.label === input; });
    if (!selected) { await showLanguage(chatId, user); return; }
    const nextState = user.country ? 'ready' : 'check_membership';
    await db.update(users).set({ language: selected.code, state: nextState })
      .where(eq(users.telegram_id, id)).run();
    user.language = selected.code;
    user.state = nextState;
    if (nextState === 'ready') {
      await showMain(chatId, user, tx(user).saved);
    } else {
      await showMembership(chatId, user);
    }
    return;
  }
  if (user.state === 'check_membership') {
    if (action !== 'joined') { await showMembership(chatId, user); return; }
    if (await checkMembership(id)) {
      await db.update(users).set({ state: 'choose_country' }).where(eq(users.telegram_id, id)).run();
      user.state = 'choose_country';
      await showCountry(chatId, user);
    } else await sendPrompt(chatId, tx(user).membershipFail, keyboard([[{ text: tx(user).joined }]]), user);
    return;
  }
  if (user.state === 'choose_country' || user.state === 'settings_country') {
    const selected = COUNTRIES.find(function (item) { return item.label === input; });
    if (!selected) { await showCountry(chatId, user); return; }
    const setting = user.state === 'settings_country';
    await db.update(users).set({ country: selected.code, state: setting ? 'ready' : 'choose_gender' }).where(eq(users.telegram_id, id)).run();
    user.country = selected.code;
    user.state = setting ? 'ready' : 'choose_gender';
    if (setting) await completeProfile(chatId, user, tx(user).saved); else await showGender(chatId, user);
    return;
  }
  if (user.state === 'choose_gender' || user.state === 'settings_gender') {
    let gender = null;
    for (const lang of Object.keys(T)) {
      if (input === T[lang].male) gender = 'male';
      if (input === T[lang].female) gender = 'female';
    }
    if (!gender) { await showGender(chatId, user); return; }
    const setting = user.state === 'settings_gender';
    await db.update(users).set({ gender: gender, state: setting ? 'ready' : 'choose_age' }).where(eq(users.telegram_id, id)).run();
    user.gender = gender;
    user.state = setting ? 'ready' : 'choose_age';
    if (setting) await completeProfile(chatId, user, tx(user).saved); else await showAge(chatId, user);
    return;
  }
  if (user.state === 'choose_age' || user.state === 'settings_age') {
    const age = Number(input);
    if (!AGES.includes(age)) { await showAge(chatId, user); return; }
    const setting = user.state === 'settings_age';
    await db.update(users).set({ age: age, state: setting ? 'ready' : 'enter_name' }).where(eq(users.telegram_id, id)).run();
    user.age = age;
    user.state = setting ? 'ready' : 'enter_name';
    if (setting) await completeProfile(chatId, user, tx(user).saved); else await showName(chatId, user);
    return;
  }
  if (user.state === 'enter_name' || user.state === 'settings_name') {
    if (!input || input.length < 2 || input.length > 60 || input.startsWith('/')) {
      await sendPrompt(chatId, tx(user).nameInvalid, { force_reply: true }, user);
      return;
    }
    const setting = user.state === 'settings_name';
    await db.update(users).set({ name: input, state: setting ? 'ready' : 'enter_surname' }).where(eq(users.telegram_id, id)).run();
    user.name = input;
    user.state = setting ? 'ready' : 'enter_surname';
    if (setting) await completeProfile(chatId, user, tx(user).saved); else await showSurname(chatId, user);
    return;
  }
  if (user.state === 'enter_surname' || user.state === 'settings_surname') {
    const setting = user.state === 'settings_surname';
    const surname = action === 'skip' ? null : (input.length <= 60 ? input : null);
    await db.update(users).set({ surname: surname, state: 'ready' }).where(eq(users.telegram_id, id)).run();
    user.surname = surname;
    user.state = 'ready';
    await completeProfile(chatId, user, setting ? tx(user).saved : null);
    return;
  }

  if (user.state === 'waiting_admin_id') {
    const adminId = Number(input);
    if (!Number.isSafeInteger(adminId) || adminId <= 0) { await sendPrompt(chatId, tx(user).badId, adminKeyboard(user), user); return; }
    const existing = await db.select().from(admins).where(eq(admins.telegram_id, adminId)).get();
    if (existing) {
      await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
      user.state = 'admin_menu';
      await sendPrompt(chatId, tx(user).adminExists, adminKeyboard(user), user);
      return;
    }
    await db.insert(admins).values({ telegram_id: adminId, created_at: new Date().toISOString() }).run();
    await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    user.state = 'admin_menu';
    await sendPrompt(chatId, tx(user).adminAdded, adminKeyboard(user), user);
    return;
  }
  if (user.state === 'waiting_remove_admin_id') {
    const adminId = Number(input);
    if (!Number.isSafeInteger(adminId) || adminId <= 0) { await sendPrompt(chatId, tx(user).badId, adminKeyboard(user), user); return; }
    if (ROOT_ADMINS.includes(adminId)) { await sendPrompt(chatId, tx(user).rootAdmin, adminKeyboard(user), user); return; }
    await db.delete(admins).where(eq(admins.telegram_id, adminId)).run();
    await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    user.state = 'admin_menu';
    await sendPrompt(chatId, tx(user).adminRemoved, adminKeyboard(user), user);
    return;
  }
  if (user.state === 'waiting_channel_details') {
    const parts = input.split('|').map(function (part) { return part.trim(); });
    if (parts.length < 3 || !parts[0] || !/^https:\/\/t\.me\//i.test(parts[1]) || !parts[2]) {
      await sendPrompt(chatId, tx(user).channelFormat, channelKeyboard(user), user);
      return;
    }
    const existing = await db.select().from(required_chats).where(eq(required_chats.chat_id, parts[0])).get();
    if (existing) {
      await db.update(users).set({ state: 'admin_channels_menu' }).where(eq(users.telegram_id, id)).run();
      user.state = 'admin_channels_menu';
      await sendPrompt(chatId, tx(user).channelExists, channelKeyboard(user), user);
      return;
    }
    await db.insert(required_chats).values({
      chat_id: parts[0], invite_link: parts[1], title: parts.slice(2).join(' | '),
      is_active: 1, created_at: new Date().toISOString()
    }).run();
    await db.update(users).set({ state: 'admin_channels_menu' }).where(eq(users.telegram_id, id)).run();
    user.state = 'admin_channels_menu';
    await sendPrompt(chatId, tx(user).channelAdded, channelKeyboard(user), user);
    return;
  }
  if (user.state === 'waiting_remove_channel_id') {
    const existing = await db.select().from(required_chats).where(eq(required_chats.chat_id, input)).get();
    if (!existing) { await sendPrompt(chatId, tx(user).channelMissing, channelKeyboard(user), user); return; }
    await db.delete(required_chats).where(eq(required_chats.chat_id, input)).run();
    await db.update(users).set({ state: 'admin_channels_menu' }).where(eq(users.telegram_id, id)).run();
    user.state = 'admin_channels_menu';
    await sendPrompt(chatId, tx(user).channelRemoved, channelKeyboard(user), user);
    return;
  }
  if (user.state === 'waiting_broadcast') {
    if (action === 'cancel') {
      await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
      user.state = 'admin_menu';
      await sendPrompt(chatId, tx(user).cancel, adminKeyboard(user), user);
      return;
    }
    const recipients = await db.select({ telegram_id: users.telegram_id }).from(users).all();
    let sent = 0;
    let failed = 0;
    for (const recipient of recipients) {
      try { await api.sendMessage({ chat_id: Number(recipient.telegram_id), text: input }); sent += 1; }
      catch (e) { failed += 1; }
    }
    await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    user.state = 'admin_menu';
    await sendPrompt(chatId, tx(user).broadcastDone + sent + tx(user).broadcastFailed + failed, adminKeyboard(user), user);
    return;
  }

  if (user.state === 'settings_menu') {
    const i = tx(user).settingsButtons.indexOf(input);
    const field = i >= 0 ? ['country', 'gender', 'age', 'name', 'surname', 'back'][i] : action;
    if (field === 'country') user.state = 'settings_country';
    else if (field === 'gender') user.state = 'settings_gender';
    else if (field === 'age') user.state = 'settings_age';
    else if (field === 'name') user.state = 'settings_name';
    else if (field === 'surname') user.state = 'settings_surname';
    else { await showMain(chatId, user); return; }
    await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
    if (field === 'country') await showCountry(chatId, user);
    else if (field === 'gender') await showGender(chatId, user);
    else if (field === 'age') await showAge(chatId, user);
    else if (field === 'name') await showName(chatId, user);
    else await showSurname(chatId, user);
    return;
  }

  if (user.state === 'admin_menu') {
    if (!(await isAdmin(id))) {
      await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run();
      user.state = 'ready';
      await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user);
      return;
    }
    const i = tx(user).adminButtons.indexOf(input);
    const field = i >= 0 ? ['adminAdd', 'adminRemove', 'channels', 'broadcast', 'adminsList', 'stats', 'back'][i] : action;
    if (field === 'adminAdd') {
      user.state = 'waiting_admin_id';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askAdmin, { force_reply: true }, user);
    } else if (field === 'adminRemove') {
      user.state = 'waiting_remove_admin_id';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askRemoveAdmin, { force_reply: true }, user);
    } else if (field === 'channels') {
      user.state = 'admin_channels_menu';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).channelIntro, channelKeyboard(user), user);
    } else if (field === 'broadcast') {
      user.state = 'waiting_broadcast';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askBroadcast, keyboard([[{ text: tx(user).cancel }]]), user);
    } else if (field === 'adminsList') await showAdminList(chatId, user);
    else if (field === 'stats') await showStats(chatId, user);
    else await showMain(chatId, user);
    return;
  }

  if (user.state === 'admin_channels_menu') {
    if (!(await isAdmin(id))) {
      await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run();
      user.state = 'ready';
      await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user);
      return;
    }
    const i = tx(user).channelButtons.indexOf(input);
    const field = i >= 0 ? ['channelAdd', 'channelRemove', 'channelList', 'back'][i] : action;
    if (field === 'channelAdd') {
      user.state = 'waiting_channel_details';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askChannel, { force_reply: true }, user);
    } else if (field === 'channelRemove') {
      user.state = 'waiting_remove_channel_id';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askRemoveChannel, { force_reply: true }, user);
    } else if (field === 'channelList') await showChannelList(chatId, user);
    else {
      user.state = 'admin_menu';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).adminIntro, adminKeyboard(user), user);
    }
    return;
  }

  if (user.state !== 'ready') { await showLanguage(chatId, user); return; }
  const m = tx(user).menu;
  const i = m.indexOf(input);
  const field = i >= 0 ? ['find', 'favorites', 'random', 'invite', 'profile', 'language', 'settings', 'stats', 'admin'][i] : action;
  if (field === 'find' || field === 'random') await sendPrompt(chatId, tx(user).later, menuKeyboard(user, await isAdmin(id)), user);
  else if (field === 'favorites') await showFavorites(chatId, user);
  else if (field === 'invite') await showReferral(chatId, user);
  else if (field === 'profile') await showProfile(chatId, user);
  else if (field === 'language') {
    user.state = 'choose_language';
    await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
    await showLanguage(chatId, user);
  } else if (field === 'settings') {
    user.state = 'settings_menu';
    await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
    await sendPrompt(chatId, tx(user).settings, settingsKeyboard(user), user);
  } else if (field === 'stats') await showStats(chatId, user);
  else if (field === 'admin') {
    if (await isAdmin(id)) {
      user.state = 'admin_menu';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).adminIntro, adminKeyboard(user), user);
    } else await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user);
  } else await showMain(chatId, user);
}

export default async function (message) {
  try {
    await processMessage(message);
  } catch (error) {
    console.error('Random Connect message handler error', error);
    if (message && message.chat && message.chat.id) {
      try {
        await api.sendMessage({
          chat_id: message.chat.id,
          text: '⚠️ یوه تخنیکي ستونزه رامنځته شوه. مهرباني وکړه /start ولیکه او بیا هڅه وکړه.'
        });
      } catch (sendError) {}
    }
  }
}