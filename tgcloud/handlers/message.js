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

const T = {
  ps: {
    lang: '🌐 لومړی خپله ژبه وټاکه:', country: '🌍 خپل هېواد وټاکه:', gender: '👤 خپل جنسیت وټاکه:',
    age: '🎂 خپل نږدې عمر وټاکه. عمرونه له ۱۲ څخه تر ۴۰ پورې دي؛ نږدې عمر انتخاب کړه:',
    name: '✍️ خپل نوم ولیکه:', surname: '📝 تخلص اختیاري دی. که یې نه لیکې، لاندې بټن کېکاږه:',
    skip: 'تخلص نه لیکم', membership: '🔐 د بوټ کارولو لپاره په لاندې ټولو ګروپونو یا چینلونو کې ګډون وکړه، بیا د غړیتوب کتلو بټن کېکاږه:',
    joined: '✅ ګډون مې وکړ، بیا یې وګوره', membershipFail: '⚠️ غړیتوب تایید نه شو. په ټولو ګروپونو کې ګډون وکړه او ډاډ ترلاسه کړه چې بوټ د غړیتوب د کتلو اجازه لري.',
    ready: '🎉 ستا پروفایل جوړ شو!', blocked: '⛔ ستا حساب محدود شوی دی.',
    menu: ['🔎 ملګری پیدا کړه', '👥 پالو ملګري', '🎲 ناڅاپي اړیکه', '📨 ملګری رابلل', '👤 زما پروفایل', '🌍 د ژبې بدلول', '⚙️ تنظیمات', '📊 احصائیې', '🛡️ د اډمین پینل'],
    settings: "⚙️ د تنظیماتو یوه برخه وټاکه:",
    profileSettingsTitle: "👤 د پروفایل تنظیمات: یوه برخه وټاکه:",
    settingsButtons: ["👤 د پروفایل تنظیمات","❤️ د پالو ملګرو تنظیمات","🔔 د اړیکې تنظیمات","🔙 اصلي مېنو"],
    profileSettingsButtons: ["🌍 هېواد بدلول","👤 جنسیت بدلول","🎂 عمر بدلول","✍️ نوم بدلول","📝 تخلص بدلول","🖼 د عکس تنظیمات","📢 د چینل تنظیمات","🔙 تنظیمات"],
    photoSettingsButtons: ["📷 عکس ثبتول/بدلول","🗑 عکس حذفول","🔙 تنظیمات"],
    channelSettingsButtons: ["📢 عام چینل ثبتول/بدلول","🗑 چینل حذفول","🔙 تنظیمات"],
    favoriteSettingsButtons: ["❤️ د پالو ملګرو لېست","🔙 تنظیمات"],
    male: 'نارینه', female: 'ښځینه', admin: '🛡️ د اډمین پینل', adminIntro: 'د اډمین پینل ته ښه راغلاست:',
    adminButtons: ["👥 د مدیرانو تنظیمات","📢 د غړیتوب ګروپونه","📣 ډله‌ییز اعلان","⚙️ د کارن تنظیمات","👥 د کاروونکو لېست","🔙 اصلي مېنو","🎁 د ریفرل جایزې"],
    adminManagementIntro: "👥 د مدیرانو اداره:",
    adminManagementButtons: ["➕ مدیر زیاتول","➖ مدیر لرې کول","📋 د مدیرانو لېست","🔙 اډمین پینل"],
    askUserSettings: 'د کارن ټیلیګرام عددي ID راولېږه:', userNotFound: 'دا کارن له بوټ سره نه دی یوځای شوی. لومړی باید /start یې کړی وي.',
    userSettingsTitle: 'د ټاکلي کارن تنظیمات:', userListTitle: '👥 د کاروونکو لېست:', userListEmpty: 'تر اوسه هېڅ کارن نشته.',
    userSettingButtons: ["🖼 عکس بدلول","⭐ ستوري","🏆 نمرې","❤️ لایکونه","⛔ مسدودول","📨 پیغام لېږل","🔙 اډمین پینل"],
    channelIntro: '📢 د اجباري غړیتوب اداره:',
    channelButtons: ['➕ ګروپ یا چینل زیاتول', '➖ ګروپ یا چینل لرې کول', '📋 د ګروپونو لېست', '🔙 اصلي مېنو'],
    askAdmin: 'د نوي مدیر ټیلیګرام عددي ID راولېږه:', askRemoveAdmin: 'د لرې کېدونکي مدیر عددي ID راولېږه:',
    askChannel: 'یوازې د ګروپ یا چینل عددي ID راولېږه. د @TGUserChatInfoBot له لارې یې معلومولای شې:',
    askRemoveChannel: 'د لرې کېدونکي ګروپ یا چینل chat_id راولېږه:',
    askBroadcast: '📣 د اعلان متن راولېږه. د لغوه کولو لپاره د لغوه بټن کېکاږه.',
    cancel: '❌ لغوه کول', badId: '⚠️ سم عددي ID راولېږه.', adminAdded: '✅ مدیر اضافه شو.',
    adminExists: 'ℹ️ دا کس له مخکې مدیر دی.', adminNotFound: '⚠️ دا کس اډمین نه دی.', adminRemoved: '✅ مدیر لرې شو.',
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
    channelFormat: '⚠️ سم عددي ID راولېږه.',
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
    settings: "⚙️ یکی از بخش‌های تنظیمات را انتخاب کنید:",
    profileSettingsTitle: "👤 تنظیمات پروفایل: یک بخش را انتخاب کنید:",
    settingsButtons: ["👤 تنظیمات پروفایل","❤️ تنظیمات دوستان محبوب","🔔 تنظیمات ارتباط","🔙 منوی اصلی"],
    profileSettingsButtons: ["🌍 تغییر کشور","👤 تغییر جنسیت","🎂 تغییر سن","✍️ تغییر نام","📝 تغییر نام خانوادگی","🖼 تنظیمات عکس","📢 تنظیمات کانال","🔙 تنظیمات"],
    photoSettingsButtons: ["📷 ثبت/تغییر عکس","🗑 حذف عکس","🔙 تنظیمات"],
    channelSettingsButtons: ["📢 ثبت/تغییر کانال عمومی","🗑 حذف کانال","🔙 تنظیمات"],
    favoriteSettingsButtons: ["❤️ فهرست دوستان محبوب","🔙 تنظیمات"],
    male: 'مرد', female: 'زن', admin: '🛡️ پنل مدیریت', adminIntro: 'به پنل مدیریت خوش آمدید:',
    adminButtons: ["👥 مدیریت مدیران","📢 عضویت اجباری","📣 پیام همگانی","⚙️ تنظیمات کاربر","👥 فهرست کاربران","🔙 منوی اصلی","🎁 پاداش دعوت"],
    adminManagementIntro: "👥 مدیریت مدیران:",
    adminManagementButtons: ["➕ افزودن مدیر","➖ حذف مدیر","📋 فهرست مدیران","🔙 پنل مدیریت"],
    askUserSettings: 'شناسه عددی تلگرام کاربر را بفرستید:', userNotFound: 'این کاربر هنوز ربات را شروع نکرده است. ابتدا باید /start را زده باشد.',
    userSettingsTitle: 'تنظیمات کاربر انتخاب‌شده:', userListTitle: '👥 فهرست کاربران:', userListEmpty: 'هنوز کاربری وجود ندارد.',
    userSettingButtons: ["🖼 تغییر عکس","⭐ ستاره","🏆 امتیاز","❤️ لایک","⛔ مسدود/رفع","📨 ارسال پیام","🔙 پنل مدیریت"],
    channelIntro: '📢 مدیریت عضویت اجباری:',
    channelButtons: ['➕ افزودن گروه یا کانال', '➖ حذف گروه یا کانال', '📋 فهرست گروه‌ها', '🔙 منوی اصلی'],
    askAdmin: 'شناسه عددی تلگرام مدیر جدید را بفرستید:', askRemoveAdmin: 'شناسه عددی مدیر را برای حذف بفرستید:',
    askChannel: 'فقط شناسه عددی گروه یا کانال را بفرستید:',
    askRemoveChannel: 'chat_id گروه یا کانال را برای حذف بفرستید:',
    askBroadcast: '📣 متن پیام همگانی را بفرستید. برای لغو دکمه لغو را بزنید.',
    cancel: '❌ لغو', badId: '⚠️ شناسه عددی معتبر بفرستید.', adminAdded: '✅ مدیر اضافه شد.',
    adminExists: 'ℹ️ این شخص از قبل مدیر است.', adminNotFound: '⚠️ این شخص مدیر نیست.', adminRemoved: '✅ مدیر حذف شد.',
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
    channelFormat: '⚠️ شناسه عددی معتبر بفرستید.', noAccess: '⛔ این بخش فقط برای مدیران مجاز است.'
  },
  en: {
    lang: '🌐 Choose your language:', country: '🌍 Choose your country:', gender: '👤 Choose your gender:',
    age: '🎂 Choose the closest age from 12 to 40:', name: '✍️ Enter your name:',
    surname: '📝 Surname is optional. Press below to skip:', skip: 'Skip surname',
    membership: '🔐 Join every group or channel below to use the bot, then check your membership:',
    joined: '✅ I joined, check again', membershipFail: '⚠️ Membership is not confirmed. Join all listed groups and ensure the bot can check membership.',
    ready: '🎉 Your profile is ready!', blocked: '⛔ Your account is restricted.',
    menu: ['🔎 Find a friend', '👥 Favorite friends', '🎲 Random connection', '📨 Invite a friend', '👤 My profile', '🌍 Change language', '⚙️ Settings', '📊 Statistics', '🛡️ Admin panel'],
    settings: "⚙️ Choose a settings section:",
    profileSettingsTitle: "👤 Profile settings: choose a field to edit:",
    settingsButtons: ["👤 Profile settings","❤️ Favorite friends settings","🔔 Connection settings","🔙 Main menu"],
    profileSettingsButtons: ["🌍 Change country","👤 Change gender","🎂 Change age","✍️ Change name","📝 Change surname","🖼 Photo settings","📢 Channel settings","🔙 Settings"],
    photoSettingsButtons: ["📷 Set/change photo","🗑 Remove photo","🔙 Settings"],
    channelSettingsButtons: ["📢 Set/change public channel","🗑 Remove channel","🔙 Settings"],
    favoriteSettingsButtons: ["❤️ Favorite friends list","🔙 Settings"],
    male: 'Male', female: 'Female', admin: '🛡️ Admin panel', adminIntro: 'Welcome to the admin panel:',
    adminButtons: ["👥 Admin management","📢 Required membership","📣 Broadcast","⚙️ User settings","👥 User list","🔙 Main menu","🎁 Referral rewards"],
    adminManagementIntro: "👥 Admin management:",
    adminManagementButtons: ["➕ Add admin","➖ Remove admin","📋 Admin list","🔙 Admin panel"],
    askUserSettings: 'Send the user Telegram numeric ID:', userNotFound: 'This user has not started the bot. They must send /start first.',
    userSettingsTitle: 'Settings for the selected user:', userListTitle: '👥 User list:', userListEmpty: 'No users yet.',
    userSettingButtons: ["🖼 Change photo","⭐ Stars","🏆 Points","❤️ Likes","⛔ Block/unblock","📨 Send message","🔙 Admin panel"],
    channelIntro: '📢 Required membership management:',
    channelButtons: ['➕ Add group/channel', '➖ Remove group/channel', '📋 List groups', '🔙 Main menu'],
    askAdmin: 'Send the new admin Telegram numeric ID:', askRemoveAdmin: 'Send the numeric ID of the admin to remove:',
    askChannel: 'Send only the numeric ID of the group or channel:',
    askRemoveChannel: 'Send the chat_id of the group/channel to remove:',
    askBroadcast: '📣 Send the broadcast text. Press Cancel to stop.',
    cancel: '❌ Cancel', badId: '⚠️ Send a valid numeric ID.', adminAdded: '✅ Admin added.',
    adminExists: 'ℹ️ This person is already an admin.', adminNotFound: '⚠️ This user is not an admin.', adminRemoved: '✅ Admin removed.',
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
    channelFormat: '⚠️ Send a valid numeric ID.', noAccess: '⛔ This section is for authorized admins only.'
  },
  ur: {
    lang: '🌐 اپنی زبان منتخب کریں:', country: '🌍 اپنا ملک منتخب کریں:', gender: '👤 اپنی جنس منتخب کریں:',
    age: '🎂 12 سے 40 سال کے درمیان اپنی قریب ترین عمر منتخب کریں:', name: '✍️ اپنا نام لکھیں:',
    surname: '📝 خاندانی نام اختیاری ہے۔ چھوڑنے کے لیے نیچے بٹن دبائیں:', skip: 'خاندانی نام چھوڑیں',
    membership: '🔐 بوٹ استعمال کرنے کے لیے نیچے دیے گئے تمام گروپس یا چینلز میں شامل ہوں، پھر تصدیق کریں:',
    joined: '✅ شامل ہوگیا، دوبارہ چیک کریں', membershipFail: '⚠️ رکنیت کی تصدیق نہیں ہوئی۔ تمام گروپس میں شامل ہوں اور بوٹ کی اجازت چیک کریں۔',
    ready: '🎉 آپ کا پروفائل تیار ہے!', blocked: '⛔ آپ کا اکاؤنٹ محدود ہے۔',
    menu: ['🔎 دوست تلاش کریں', '👥 پسندیدہ دوست', '🎲 اچانک رابطہ', '📨 دوست کو بلائیں', '👤 میرا پروفائل', '🌍 زبان تبدیل کریں', '⚙️ ترتیبات', '📊 اعدادوشمار', '🛡️ ایڈمن پینل'],
    settings: "⚙️ ترتیبات کا حصہ منتخب کریں:",
    profileSettingsTitle: "👤 پروفائل کی ترتیبات: تبدیل کرنے کے لیے حصہ منتخب کریں:",
    settingsButtons: ["👤 پروفائل کی ترتیبات","❤️ پسندیدہ دوستوں کی ترتیبات","🔔 رابطے کی ترتیبات","🔙 مرکزی مینو"],
    profileSettingsButtons: ["🌍 ملک تبدیل کریں","👤 جنس تبدیل کریں","🎂 عمر تبدیل کریں","✍️ نام تبدیل کریں","📝 خاندانی نام تبدیل کریں","🖼 تصویر کی ترتیبات","📢 چینل کی ترتیبات","🔙 ترتیبات"],
    photoSettingsButtons: ["📷 تصویر لگائیں/بدلیں","🗑 تصویر حذف کریں","🔙 ترتیبات"],
    channelSettingsButtons: ["📢 عوامی چینل لگائیں/بدلیں","🗑 چینل حذف کریں","🔙 ترتیبات"],
    favoriteSettingsButtons: ["❤️ پسندیدہ دوستوں کی فہرست","🔙 ترتیبات"],
    male: 'مرد', female: 'عورت', admin: '🛡️ ایڈمن پینل', adminIntro: 'ایڈمن پینل میں خوش آمدید:',
    adminButtons: ["👥 ایڈمن مینجمنٹ","📢 لازمی رکنیت","📣 سب کو پیغام","⚙️ صارف کی ترتیبات","👥 صارفین کی فہرست","🔙 مرکزی مینو","🎁 دعوتی انعامات"],
    adminManagementIntro: "👥 ایڈمن مینجمنٹ:",
    adminManagementButtons: ["➕ ایڈمن شامل کریں","➖ ایڈمن ہٹائیں","📋 ایڈمنز کی فہرست","🔙 ایڈمن پینل"],
    askUserSettings: 'صارف کا ٹیلیگرام عددی ID بھیجیں:', userNotFound: 'اس صارف نے ابھی بوٹ شروع نہیں کیا۔ اسے پہلے /start کرنا ہوگا۔',
    userSettingsTitle: 'منتخب صارف کی ترتیبات:', userListTitle: '👥 صارفین کی فہرست:', userListEmpty: 'ابھی کوئی صارف نہیں۔',
    userSettingButtons: ["🖼 تصویر بدلیں","⭐ ستارے","🏆 پوائنٹس","❤️ لائکس","⛔ بلاک/ان بلاک","📨 پیغام بھیجیں","🔙 ایڈمن پینل"],
    channelIntro: '📢 لازمی رکنیت کا انتظام:',
    channelButtons: ['➕ گروپ یا چینل شامل کریں', '➖ گروپ یا چینل ہٹائیں', '📋 گروپس کی فہرست', '🔙 مرکزی مینو'],
    askAdmin: 'نئے ایڈمن کا ٹیلیگرام عددی ID بھیجیں:', askRemoveAdmin: 'ہٹانے والے ایڈمن کا عددی ID بھیجیں:',
    askChannel: 'صرف گروپ یا چینل کا عددی ID بھیجیں:',
    askRemoveChannel: 'ہٹانے کے لیے گروپ یا چینل کا chat_id بھیجیں:',
    askBroadcast: '📣 سب کو بھیجنے والا پیغام لکھیں۔ منسوخ کرنے کے لیے بٹن دبائیں۔',
    cancel: '❌ منسوخ', badId: '⚠️ درست عددی ID بھیجیں۔', adminAdded: '✅ ایڈمن شامل ہوگیا۔',
    adminExists: 'ℹ️ یہ شخص پہلے ہی ایڈمن ہے۔', adminNotFound: '⚠️ یہ صارف ایڈمن نہیں ہے۔', adminRemoved: '✅ ایڈمن ہٹا دیا گیا۔',
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
    channelFormat: '⚠️ درست عددی ID بھیجیں۔', noAccess: '⛔ یہ حصہ صرف مجاز ایڈمنز کے لیے ہے۔'
  },
  ar: {
    lang: '🌐 اختر لغتك:', country: '🌍 اختر بلدك:', gender: '👤 اختر جنسك:',
    age: '🎂 اختر عمرك الأقرب من 12 إلى 40 سنة:', name: '✍️ اكتب اسمك:',
    surname: '📝 اسم العائلة اختياري. اضغط أدناه للتخطي:', skip: 'تخطي اسم العائلة',
    membership: '🔐 لاستخدام البوت، انضم إلى كل مجموعة أو قناة أدناه ثم تحقق من العضوية:',
    joined: '✅ انضممت، تحقق مرة أخرى', membershipFail: '⚠️ لم يتم تأكيد العضوية. انضم إلى جميع المجموعات وتأكد أن البوت يستطيع التحقق.',
    ready: '🎉 ملفك الشخصي جاهز!', blocked: '⛔ حسابك مقيّد.',
    menu: ['🔎 ابحث عن صديق', '👥 الأصدقاء المفضلون', '🎲 اتصال عشوائي', '📨 دعوة صديق', '👤 ملفي الشخصي', '🌍 تغيير اللغة', '⚙️ الإعدادات', '📊 الإحصائيات', '🛡️ لوحة الإدارة'],
    settings: "⚙️ اختر قسم الإعدادات:",
    profileSettingsTitle: "👤 إعدادات الملف الشخصي: اختر ما تريد تعديله:",
    settingsButtons: ["👤 إعدادات الملف الشخصي","❤️ إعدادات الأصدقاء المفضلين","🔔 إعدادات الاتصال","🔙 القائمة الرئيسية"],
    profileSettingsButtons: ["🌍 تغيير البلد","👤 تغيير الجنس","🎂 تغيير العمر","✍️ تغيير الاسم","📝 تغيير اسم العائلة","🖼 إعدادات الصورة","📢 إعدادات القناة","🔙 الإعدادات"],
    photoSettingsButtons: ["📷 إضافة/تغيير الصورة","🗑 حذف الصورة","🔙 الإعدادات"],
    channelSettingsButtons: ["📢 إضافة/تغيير قناة عامة","🗑 حذف القناة","🔙 الإعدادات"],
    favoriteSettingsButtons: ["❤️ قائمة الأصدقاء المفضلين","🔙 الإعدادات"],
    male: 'ذكر', female: 'أنثى', admin: '🛡️ لوحة الإدارة', adminIntro: 'مرحبًا بك في لوحة الإدارة:',
    adminButtons: ["👥 إدارة المديرين","📢 العضوية الإلزامية","📣 رسالة جماعية","⚙️ إعدادات المستخدم","👥 قائمة المستخدمين","🔙 القائمة الرئيسية","🎁 مكافآت الدعوة"],
    adminManagementIntro: "👥 إدارة المديرين:",
    adminManagementButtons: ["➕ إضافة مدير","➖ إزالة مدير","📋 قائمة المديرين","🔙 لوحة الإدارة"],
    askUserSettings: 'أرسل رقم Telegram الخاص بالمستخدم:', userNotFound: 'هذا المستخدم لم يبدأ البوت بعد. يجب أن يرسل /start أولاً.',
    userSettingsTitle: 'إعدادات المستخدم المحدد:', userListTitle: '👥 قائمة المستخدمين:', userListEmpty: 'لا يوجد مستخدمون بعد.',
    userSettingButtons: ["🖼 تغيير الصورة","⭐ النجوم","🏆 النقاط","❤️ الإعجابات","⛔ حظر/إلغاء الحظر","📨 إرسال رسالة","🔙 لوحة الإدارة"],
    channelIntro: '📢 إدارة العضوية الإلزامية:',
    channelButtons: ['➕ إضافة مجموعة أو قناة', '➖ إزالة مجموعة أو قناة', '📋 قائمة المجموعات', '🔙 القائمة الرئيسية'],
    askAdmin: 'أرسل رقم معرف تيليجرام للمدير الجديد:', askRemoveAdmin: 'أرسل رقم معرف المدير الذي تريد إزالته:',
    askChannel: 'أرسل المعرّف الرقمي للمجموعة أو القناة فقط:',
    askRemoveChannel: 'أرسل chat_id للمجموعة أو القناة التي تريد إزالتها:',
    askBroadcast: '📣 أرسل نص الرسالة الجماعية. اضغط إلغاء للتوقف.',
    cancel: '❌ إلغاء', badId: '⚠️ أرسل معرفًا رقميًا صحيحًا.', adminAdded: '✅ تمت إضافة المدير.',
    adminExists: 'ℹ️ هذا الشخص مدير بالفعل.', adminNotFound: '⚠️ هذا المستخدم ليس مديراً.', adminRemoved: '✅ تمت إزالة المدير.',
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
    channelFormat: '⚠️ أرسل معرّفًا رقميًا صحيحًا.', noAccess: '⛔ هذا القسم للمديرين المصرح لهم فقط.'
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
  if (admin) { rows.push([{ text: m[8] }]); if (tx(user).adminButtons[6]) rows.push([{ text: tx(user).adminButtons[6] }]); }
  return keyboard(rows);
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
function ageKeyboard() {
  const rows = [];
  for (let i = 0; i < AGES.length; i += 3) {
    rows.push(AGES.slice(i, i + 3).map(function (age) {
      return { text: String(age), callback_data: 'reg:age:' + String(age) };
    }));
  }
  return { inline_keyboard: rows };
}
function genderKeyboard(user) {
  return { inline_keyboard: [[
    { text: tx(user).male, callback_data: 'reg:gender:male' },
    { text: tx(user).female, callback_data: 'reg:gender:female' }
  ]] };
}
function settingsKeyboard(user) {
  const b = tx(user).settingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }]]);
}
function profileSettingsKeyboard(user) {
  const b = tx(user).profileSettingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }], [{ text: b[4] }, { text: b[5] }], [{ text: b[6] }, { text: b[7] }]]);
}
function photoSettingsKeyboard(user) {
  const b = tx(user).photoSettingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }]]);
}
function channelSettingsKeyboard(user) {
  const b = tx(user).channelSettingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }]]);
}
function favoriteSettingsKeyboard(user) {
  const b = tx(user).favoriteSettingsButtons;
  return keyboard([[{ text: b[0] }], [{ text: b[1] }]]);
}
function adminKeyboard(user) {
  const b = tx(user).adminButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }], [{ text: b[4] }, { text: b[5] }]]);
}
function adminManagementKeyboard(user) {
  const b = tx(user).adminManagementButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }], [{ text: b[3] }]]);
}
function adminUserSettingsKeyboard(user, targetId, blocked) {
  const b = user.language === 'en' ? ['🖼 Change photo','⭐ Stars','🏆 Points','❤️ Likes','⛔ Block','✅ Unblock','📨 Send message','🔙 Admin panel'] : user.language === 'fa' ? ['🖼 تغییر عکس','⭐ ستاره','🏆 امتیاز','❤️ لایک','⛔ مسدود','✅ رفع مسدودی','📨 ارسال پیام','🔙 پنل مدیریت'] : user.language === 'ur' ? ['🖼 تصویر بدلیں','⭐ ستارے','🏆 پوائنٹس','❤️ لائکس','⛔ بلاک','✅ ان بلاک','📨 پیغام بھیجیں','🔙 ایڈمن پینل'] : user.language === 'ar' ? ['🖼 تغيير الصورة','⭐ النجوم','🏆 النقاط','❤️ الإعجابات','⛔ حظر','✅ إلغاء الحظر','📨 إرسال رسالة','🔙 لوحة الإدارة'] : ['🖼 عکس بدلول','⭐ ستوري','🏆 نمرې','❤️ لایکونه','⛔ مسدودول','✅ خلاصول','📨 پیغام لېږل','🔙 اډمین پینل'];
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
async function showAdminUserSettings(chatId, adminUser, target) {
  const country = COUNTRIES.find(item => item.code === target.country);
  const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(target.telegram_id)));
  const labels = {
    ps: { title:'👤 د کارن تنظیمات', referrals:'رابلل شوي', favorites:'پالو ملګري', stars:'ستوري', points:'نمرې', likes:'لایکونه', photo:'عکس', status:'حالت', blocked:'مسدود', active:'فعال' },
    fa: { title:'👤 تنظیمات کاربر', referrals:'دعوت‌شده', favorites:'دوستان محبوب', stars:'ستاره', points:'امتیاز', likes:'لایک', photo:'عکس', status:'وضعیت', blocked:'مسدود', active:'فعال' },
    en: { title:'👤 USER SETTINGS', referrals:'Referrals', favorites:'Favorites', stars:'Stars', points:'Points', likes:'Likes', photo:'Photo', status:'Status', blocked:'Blocked', active:'Active' },
    ur: { title:'👤 صارف کی ترتیبات', referrals:'مدعو دوست', favorites:'پسندیدہ دوست', stars:'ستارے', points:'پوائنٹس', likes:'لائکس', photo:'تصویر', status:'حالت', blocked:'بلاک', active:'فعال' },
    ar: { title:'👤 إعدادات المستخدم', referrals:'الإحالات', favorites:'الأصدقاء المفضلون', stars:'النجوم', points:'النقاط', likes:'الإعجابات', photo:'الصورة', status:'الحالة', blocked:'محظور', active:'نشط' }
  };
  const l = labels[adminUser.language] || labels.ps;
  const text = l.title + '\n━━━━━━━━━━━━━━\n👤 ' + [target.name || target.first_name || '—', target.surname || ''].filter(Boolean).join(' ') +
    '\n🆔 ' + target.telegram_id + '\n🔗 ' + (target.username ? '@' + target.username : '—') +
    '\n🌍 ' + (country ? country.label : '—') + '\n⚧ ' + (target.gender || '—') + '  🎂 ' + (target.age || '—') +
    '\n📢 ' + (target.channel_username || '—') + '\n📨 ' + l.referrals + ': ' + Number(target.referral_count || 0) +
    '\n👥 ' + l.favorites + ': ' + favCount + '\n⭐ ' + l.stars + ': ' + Number(target.stars || 0) +
    '\n🏆 ' + l.points + ': ' + Number(target.points || 0) + '\n❤️ ' + l.likes + ': ' + Number(target.likes || 0) +
    '\n🖼 ' + l.photo + ': ' + (target.profile_photo_id ? '✓' : '—') + '\n🚦 ' + l.status + ': ' + (Number(target.is_blocked) === 1 ? l.blocked : l.active);
  await sendPrompt(chatId, text, adminUserSettingsKeyboard(adminUser, target.telegram_id, target.is_blocked), adminUser);
}
async function showUserList(chatId, user, page) {
  const w = listWords(user), all = await db.select().from(users).all();
  all.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = w.users + '\n' + (current + 1) + '/' + pages + '\n━━━━━━━━━━━━━━\n\n';
  if (!all.length) text += tx(user).userListEmpty;
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
  await sendPrompt(chatId, text, { inline_keyboard: rows }, user);
}
function channelKeyboard(user) {
  const b = tx(user).channelButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }]]);
}
function actionFor(input) {
  for (const lang of Object.keys(T)) {
    const t = T[lang], m = t.menu;
    const pairs = [
      ['find', m[0]], ['favorites', m[1]], ['random', m[2]], ['invite', m[3]], ['profile', m[4]],
      ['language', m[5]], ['settings', m[6]], ['stats', m[7]], ['admin', m[8]], ['joined', t.joined],
      ['country', t.profileSettingsButtons[0]], ['gender', t.profileSettingsButtons[1]], ['age', t.profileSettingsButtons[2]],
      ['name', t.profileSettingsButtons[3]], ['surname', t.profileSettingsButtons[4]],
      ['photoSettings', t.profileSettingsButtons[5]], ['channelSettings', t.profileSettingsButtons[6]],
      ['profileSettings', t.settingsButtons[0]], ['favoriteSettings', t.settingsButtons[1]],
      ['connectionSettings', t.settingsButtons[2]], ['rewardSettings', t.adminButtons[6]],
      ['adminManagement', t.adminButtons[0]], ['channels', t.adminButtons[1]], ['broadcast', t.adminButtons[2]],
      ['userSettings', t.adminButtons[3]], ['usersList', t.adminButtons[4]],
      ['adminAdd', t.adminManagementButtons[0]], ['adminRemove', t.adminManagementButtons[1]],
      ['adminsList', t.adminManagementButtons[2]], ['cancel', t.cancel], ['skip', t.skip],
      ['photoSet', t.photoSettingsButtons[0]], ['photoRemove', t.photoSettingsButtons[1]],
      ['channelSet', t.channelSettingsButtons[0]], ['channelRemoveProfile', t.channelSettingsButtons[1]],
      ['favoritesList', t.favoriteSettingsButtons[0]]
    ];
    const backLabels = [t.settingsButtons[3], t.profileSettingsButtons[7], t.photoSettingsButtons[2],
      t.channelSettingsButtons[2], t.favoriteSettingsButtons[1], t.adminManagementButtons[3]];
    for (const label of backLabels) if (label === input) return 'back';
    for (const pair of pairs) if (pair[1] === input) return pair[0];
  }
  return null;
}
async function safeDelete(chatId, messageId) {
  if (!messageId) return;
  try { await api.deleteMessage({ chat_id: chatId, message_id: messageId }); } catch (e) {}
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
  if (user && Number(user.last_prompt_id) > 0) {
    await safeDelete(chatId, Number(user.last_prompt_id));
  }
  const sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: markup });
  if (user) {
    const inlineId = markup && Array.isArray(markup.inline_keyboard) && sent && sent.message_id ? sent.message_id : 0;
    await db.update(users).set({ last_prompt_id: inlineId }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = inlineId;
  }
  return sent;
}
async function getUser(id) { return await db.select().from(users).where(eq(users.telegram_id, Number(id))).get(); }
async function getSetting(key, fallback) {
  const row = await db.select().from(app_settings).where(eq(app_settings.setting_key, key)).get();
  const value = Number(row && row.setting_value);
  return row && Number.isFinite(value) && value >= 0 ? value : fallback;
}
async function setSetting(key, value) {
  const old = await db.select().from(app_settings).where(eq(app_settings.setting_key, key)).get();
  if (old) await db.update(app_settings).set({ setting_value: String(value) }).where(eq(app_settings.setting_key, key)).run();
  else await db.insert(app_settings).values({ setting_key: key, setting_value: String(value) }).run();
}
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
function requiredChatInfo(chat) {
  const stored = String(chat.title || '');
  if (stored.startsWith('channel::')) return { type: 'channel', title: stored.slice(9) };
  if (stored.startsWith('group::')) return { type: 'group', title: stored.slice(7) };
  return { type: String(chat.chat_id) === '-1004419974496' ? 'channel' : 'group', title: stored };
}
function requiredChatButtonTitle(chat, user) {
  const info = requiredChatInfo(chat);
  const labels = { ps: ['چینل ته ګډون', 'ګروپ ته ګډون'], fa: ['عضویت در کانال', 'عضویت در گروه'], en: ['Join channel', 'Join group'], ur: ['چینل میں شامل ہوں', 'گروپ میں شامل ہوں'], ar: ['الانضمام إلى القناة', 'الانضمام إلى المجموعة'] };
  const pair = labels[user.language] || labels.ps;
  return (info.type === 'channel' ? pair[0] : pair[1]) + (info.title ? ': ' + info.title : '');
}
function channelError(user, kind) {
  const messages = {
    ps: { invalid: '⚠️ ID ناسم دی یا بوټ لاسرسی نه لري.', member: '⚠️ بوټ په دې ګروپ/چینل کې غړی نه دی.', admin: '⚠️ بوټ باید په ګروپ/چینل کې مدیر وي.', link: '⚠️ د ګډون لینک پیدا یا جوړ نه شو.' },
    fa: { invalid: '⚠️ شناسه نادرست است یا ربات دسترسی ندارد.', member: '⚠️ ربات عضو این گروه/کانال نیست.', admin: '⚠️ ربات باید مدیر باشد.', link: '⚠️ لینک عضویت پیدا یا ساخته نشد.' },
    en: { invalid: '⚠️ Invalid ID or the bot cannot access this chat.', member: '⚠️ The bot is not a member of this group/channel.', admin: '⚠️ The bot must be an administrator.', link: '⚠️ Could not find or create a join link.' },
    ur: { invalid: '⚠️ ID غلط ہے یا بوٹ کو رسائی نہیں۔', member: '⚠️ بوٹ اس گروپ/چینل کا رکن نہیں۔', admin: '⚠️ بوٹ کو ایڈمن ہونا چاہیے۔', link: '⚠️ شمولیت کا لنک نہیں ملا۔' },
    ar: { invalid: '⚠️ المعرّف غير صحيح أو لا يوجد وصول.', member: '⚠️ البوت ليس عضوًا في المجموعة/القناة.', admin: '⚠️ يجب أن يكون البوت مشرفًا.', link: '⚠️ تعذّر العثور على رابط الانضمام.' }
  };
  return (messages[user.language] || messages.ps)[kind];
}
async function showMembership(chatId, user) {
  const t = tx(user), chats = await getRequiredChats(), rows = [];
  for (const chat of chats) if (chat.invite_link) rows.push([{ text: requiredChatButtonTitle(chat, user).slice(0, 60), url: chat.invite_link }]);
  rows.push([{ text: t.joined, callback_data: 'reg:membership:check' }]);
  await sendPrompt(chatId, t.membership, { inline_keyboard: rows }, user);
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
function matchLanguage(input) {
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
async function showLanguage(chatId, user) { await sendPrompt(chatId, tx(user).lang, languageKeyboard(), user); }
async function showCountry(chatId, user) { await sendPrompt(chatId, tx(user).country, countryKeyboard(), user); }
async function showGender(chatId, user) { await sendPrompt(chatId, tx(user).gender, genderKeyboard(user), user); }
async function showAge(chatId, user) { await sendPrompt(chatId, tx(user).age, ageKeyboard(), user); }
async function showName(chatId, user) { await sendPrompt(chatId, tx(user).name, { force_reply: true }, user); }
async function showSurname(chatId, user) {
  await sendPrompt(chatId, tx(user).surname, { inline_keyboard: [[{ text: tx(user).skip, callback_data: 'reg:skip_surname' }]] }, user);
}
async function showMain(chatId, user, text) {
  user.state = 'ready';
  await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
  await sendPrompt(chatId, (text ? text + '\n\n' : '') + tx(user).main, menuKeyboard(user, await isAdmin(user.telegram_id)), user);
}
async function showProfile(chatId, user) {
  const t = tx(user), c = COUNTRIES.find(item => item.code === user.country);
  const l = LANGUAGES.find(item => item.code === user.language) || LANGUAGES[0];
  const genderLabel = user.gender === 'male' ? t.male : (user.gender === 'female' ? t.female : t.notSet);
  const fullName = [user.name || user.first_name || t.notSet, user.surname || ''].filter(Boolean).join(' ');
  const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(user.telegram_id)));
  const text = t.profile + '\n━━━━━━━━━━━━━━\n\n👤 نوم: ' + fullName +
    '\n\n🌍 هېواد: ' + (c ? c.label : t.notSet) + '\n\n⚧ جنسیت: ' + genderLabel + '\n\n🎂 عمر: ' + (user.age || t.notSet) +
    '\n\n🗣️ ژبه: ' + l.label + '\n\n📢 عام چینل: ' + (user.channel_username || t.notSet) +
    '\n\n📨 ریفرلونه: ' + Number(user.referral_count || 0) + '\n\n👥 پالو ملګري: ' + favCount +
    '\n\n⭐ ستوري: ' + Number(user.stars || 0) + '\n\n🏆 نمرې: ' + Number(user.points || 0) + '\n\n❤️ لایکونه: ' + Number(user.likes || 0);
  const markup = menuKeyboard(user, await isAdmin(user.telegram_id));
  if (!user.profile_photo_id) {
    await sendPrompt(chatId, text, markup, user);
    return;
  }
  await ensureInlinePromptTracking();
  const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users).where(eq(users.telegram_id, Number(user.telegram_id))).get();
  const previousId = Number(latest && latest.last_prompt_id || 0);
  if (previousId > 0) await safeDelete(chatId, previousId);
  try {
    await api.sendPhoto({ chat_id: chatId, photo: user.profile_photo_id, caption: text, reply_markup: markup });
    await db.update(users).set({ last_prompt_id: 0 }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = 0;
  } catch (e) {
    await sendPrompt(chatId, text, markup, user);
  }
}
async function showFavorites(chatId, user) {
  const t = tx(user);
  const list = await db.select().from(favorites).where(eq(favorites.user_telegram_id, Number(user.telegram_id))).all();
  if (!list.length) {
    await sendPrompt(chatId, t.noFavorites, menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  let text = '❤️ ' + t.favorites + '\n\n';
  for (const item of list) {
    const friend = await getUser(item.favorite_telegram_id);
    if (friend) text += '• ' + [friend.name || friend.first_name || 'User', friend.surname || ''].filter(Boolean).join(' ') +
      (friend.username ? ' (@' + friend.username + ')' : '') + '\n';
  }
  await sendPrompt(chatId, text, menuKeyboard(user, await isAdmin(user.telegram_id)), user);
}
async function showFavoriteSettings(chatId, user, page) {
  const w = listWords(user), all = await db.select().from(favorites).where(eq(favorites.user_telegram_id, Number(user.telegram_id))).all();
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = '❤️ ' + w.fav + '\n' + (current + 1) + '/' + pages + '\n\n';
  for (const item of items) {
    const friend = await getUser(item.favorite_telegram_id); if (!friend) continue;
    const name = [friend.name || friend.first_name || 'User', friend.surname || ''].filter(Boolean).join(' ');
    text += '👤 ' + name + '\n🆔 ' + friend.telegram_id + '\n🔗 ' + (friend.username ? '@' + friend.username : '—') + '\n\n';
    rows.push([{ text: '❌ ' + w.unfollow + ' ' + name.slice(0, 24), callback_data: 'settings:unfavorite:' + friend.telegram_id + ':' + current }]);
  }
  if (!all.length) text += tx(user).noFavorites;
  const nav = [];
  if (current > 0) nav.push({ text: w.prev, callback_data: 'settings:favorites:page:' + (current - 1) });
  if (current < pages - 1) nav.push({ text: w.next, callback_data: 'settings:favorites:page:' + (current + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: '⚙️ ' + w.settings, callback_data: 'settings:open' }, { text: w.main, callback_data: 'settings:main' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, user);
}
async function showSettingsSection(chatId, user, state, text, markup) {
  user.state = state;
  await db.update(users).set({ state }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
  await sendPrompt(chatId, text, markup, user);
}
async function showStats(chatId, user) {
  const t = tx(user), allUsers = await db.select().from(users).all();
  const cutoff = Date.now() - 15 * 60 * 1000;
  const onlineUsers = allUsers.filter(row => row.last_active_at && Date.parse(row.last_active_at) >= cutoff);
  const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(user.telegram_id)));
  if (await isAdmin(user.telegram_id)) {
    const allAdmins = await db.select().from(admins).all();
    const adminIds = new Set(allAdmins.map(row => Number(row.telegram_id)).concat(ROOT_ADMINS));
    const onlineAdmins = onlineUsers.filter(row => adminIds.has(Number(row.telegram_id))).length;
    const channelsCount = await db.$count(required_chats, eq(required_chats.is_active, 1));
    const referralsTotal = allUsers.reduce((sum, row) => sum + Number(row.referral_count || 0), 0);
    const text = '📊 د بوټ بشپړې احصائیې\n━━━━━━━━━━━━━━\n\n👥 ټول کاروونکي: ' + allUsers.length +
      '\n\n🟢 آنلاین کاروونکي (وروستۍ ۱۵ دقیقې): ' + onlineUsers.length +
      '\n\n🛡️ ټول مدیران/کارکوونکي: ' + adminIds.size +
      '\n\n🟢 آنلاین مدیران/کارکوونکي: ' + onlineAdmins +
      '\n\n📢 فعال اجباري ګروپونه/چینلونه: ' + channelsCount +
      '\n\n📨 ټول ریفرلونه: ' + referralsTotal;
    await sendPrompt(chatId, text, menuKeyboard(user, true), user);
  } else {
    const text = t.stats + '\n━━━━━━━━━━━━━━\n\n📨 ستا ریفرلونه: ' + Number(user.referral_count || 0) +
      '\n\n❤️ پالو ملګري: ' + favCount + '\n\n⭐ ستوري: ' + Number(user.stars || 0) +
      '\n\n🏆 نمرې: ' + Number(user.points || 0) + '\n\n❤️ لایکونه: ' + Number(user.likes || 0);
    await sendPrompt(chatId, text, menuKeyboard(user, false), user);
  }
}
async function showReferral(chatId, user) {
  const t = tx(user);
  const me = await api.getMe();
  const link = 'https://t.me/' + me.username + '?start=' + String(user.telegram_id);
  const rewardStars = await getSetting('referral_reward_stars', 15), rewardPoints = await getSetting('referral_reward_points', 5), rewardLikes = await getSetting('referral_reward_likes', 2);
  const rewardLine = '\n\n🎁 د هر بریالي دعوت جایزه: ⭐ ' + rewardStars + ' ستوري، 🏆 ' + rewardPoints + ' نمرې، ❤️ ' + rewardLikes + ' لایکونه.';
  const shareText = t.referralText + rewardLine + '\n\n🔗 ' + link;
  const share = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
  await sendPrompt(chatId, t.referralTitle + '\n\n' + t.referralText + rewardLine + '\n\n🔗 ' + link,
    { inline_keyboard: [[{ text: t.share, url: share }]] }, user);
}
function listWords(user) {
  const all = {
    ps: {copy:'📋 ID کاپي',prev:'⬅️ شاته',next:'مخکې ➡️',main:'🏠 اصلي مېنو',ref:'رابلل شوي',fav:'پالو ملګري',stars:'ستوري',points:'نمرې',likes:'لایکونه',unfollow:'پالو پرېښودل',settings:'تنظیمات',users:'👥 د کاروونکو لېست',admins:'🛡️ د مدیرانو لېست'},
    fa: {copy:'📋 کپی شناسه',prev:'⬅️ قبلی',next:'بعدی ➡️',main:'🏠 منوی اصلی',ref:'دعوت‌شده',fav:'دوستان محبوب',stars:'ستاره',points:'امتیاز',likes:'لایک',unfollow:'حذف از محبوب‌ها',settings:'تنظیمات',users:'👥 فهرست کاربران',admins:'🛡️ فهرست مدیران'},
    en: {copy:'📋 Copy ID',prev:'⬅️ Previous',next:'Next ➡️',main:'🏠 Main menu',ref:'Referrals',fav:'Favorites',stars:'Stars',points:'Points',likes:'Likes',unfollow:'Unfollow',settings:'Settings',users:'👥 User list',admins:'🛡️ Admin list'},
    ur: {copy:'📋 ID کاپی',prev:'⬅️ پچھلا',next:'اگلا ➡️',main:'🏠 مرکزی مینو',ref:'مدعو',fav:'پسندیدہ دوست',stars:'ستارے',points:'پوائنٹس',likes:'لائکس',unfollow:'پسندیدہ سے ہٹائیں',settings:'ترتیبات',users:'👥 صارفین کی فہرست',admins:'🛡️ ایڈمنز کی فہرست'},
    ar: {copy:'📋 نسخ المعرّف',prev:'⬅️ السابق',next:'التالي ➡️',main:'🏠 القائمة الرئيسية',ref:'الإحالات',fav:'الأصدقاء المفضلون',stars:'النجوم',points:'النقاط',likes:'الإعجابات',unfollow:'إلغاء التفضيل',settings:'الإعدادات',users:'👥 قائمة المستخدمين',admins:'🛡️ قائمة المديرين'}
  };
  return all[user.language] || all.ps;
}
async function showAdminList(chatId, user, page) {
  const w = listWords(user), all = await db.select().from(admins).all();
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = w.admins + '\n' + (current + 1) + '/' + pages + '\n\n';
  if (!all.length) text += tx(user).adminEmpty;
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
  await sendPrompt(chatId, text, { inline_keyboard: rows }, user);
}
async function showChannelList(chatId, user) {
  const t = tx(user);
  const list = await getRequiredChats();
  let text = t.channelButtons[2] + '\n\n';
  if (!list.length) text += t.channelEmpty;
  else for (const row of list) { const info = requiredChatInfo(row); text += (info.type === 'channel' ? '📢 ' : '👥 ') + info.title + '\nID: ' + row.chat_id + '\n' + row.invite_link + '\n\n'; }
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
      profile_photo_id: null, channel_username: null, stars: 0, points: 0, likes: 0,
      state: 'choose_language', is_blocked: 0, referrer_id: referrer, referral_count: 0,
      last_prompt_id: 0, last_active_at: new Date().toISOString(), connection_request_mode: 'all', created_at: new Date().toISOString()
    }).run();
    user = await getUser(id);
    if (referrer) {
      const parent = await getUser(referrer);
      if (parent) {
        const rewardStars = await getSetting('referral_reward_stars', 15);
        const rewardPoints = await getSetting('referral_reward_points', 5);
        const rewardLikes = await getSetting('referral_reward_likes', 2);
        await db.update(users).set({
          referral_count: Number(parent.referral_count || 0) + 1,
          stars: Number(parent.stars || 0) + rewardStars,
          points: Number(parent.points || 0) + rewardPoints,
          likes: Number(parent.likes || 0) + rewardLikes
        }).where(eq(users.telegram_id, referrer)).run();
        const rewardText = '🎉 یو کس ستا د دعوتي لینک له لارې بوټ ته راغی!\n\nستا د ریفرل جایزه:\n⭐ +' + rewardStars + ' ستوري\n\n🏆 +' + rewardPoints + ' نمرې\n\n❤️ +' + rewardLikes + ' لایکونه';
        try { await api.sendMessage({ chat_id: referrer, text: rewardText }); } catch (e) {}
      }
    }
  } else {
    await db.update(users).set({ username: message.from.username || null, first_name: message.from.first_name || null, last_active_at: new Date().toISOString() })
      .where(eq(users.telegram_id, id)).run();
  }
  if (!user) return;
  if (Number(user.is_blocked) !== 1) { try { await db.update(users).set({ last_active_at: new Date().toISOString() }).where(eq(users.telegram_id, id)).run(); } catch (e) {} }
  if (Number(user.is_blocked) === 1) {
    await sendPrompt(chatId, tx(user).blocked, { remove_keyboard: true }, user);
    return;
  }
  // Keep user messages visible; only replace the bot's previous prompt.
  const protectedStates = ['admin_menu', 'admin_management_menu', 'admin_channels_menu', 'waiting_admin_id', 'waiting_remove_admin_id', 'waiting_channel_details', 'waiting_remove_channel_id', 'waiting_broadcast', 'waiting_user_settings_id'];
  const adminEditState = /^(admin_edit_user_photo|admin_send_user_message):\d+$/.test(String(user.state || '')) || /^admin_adjust_balance:(stars|points|likes):(add|sub):\d+$/.test(String(user.state || '')) || /^admin_edit_user_(name|surname):\d+$/.test(String(user.state || ''));
  if ((protectedStates.includes(user.state) || adminEditState) && !(await isAdmin(id))) {
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run();
    user.state = 'ready';
    await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user);
    return;
  }

  if (start) {
    if (user.state === 'choose_language' || !user.language) await showLanguage(chatId, user);
    else if (user.state === 'check_membership') await showMembership(chatId, user);
    else if (user.state === 'choose_country' || user.state === 'settings_country') await showCountry(chatId, user);
    else if (user.state === 'choose_gender' || user.state === 'settings_gender') await showGender(chatId, user);
    else if (user.state === 'choose_age' || user.state === 'settings_age') await showAge(chatId, user);
    else if (user.state === 'enter_name' || user.state === 'settings_name') await showName(chatId, user);
    else if (user.state === 'enter_surname' || user.state === 'settings_surname') await showSurname(chatId, user);
    else if (user.state === 'admin_channels_menu') await sendPrompt(chatId, tx(user).channelIntro, channelKeyboard(user), user);
    else if (user.state === 'admin_management_menu') await sendPrompt(chatId, tx(user).adminManagementIntro, adminManagementKeyboard(user), user);
    else if (user.state === 'settings_menu') await sendPrompt(chatId, tx(user).settings, settingsKeyboard(user), user);
    else if (user.state === 'profile_settings_menu') await sendPrompt(chatId, tx(user).profileSettingsTitle, profileSettingsKeyboard(user), user);
    else if (user.state === 'settings_photo_menu') await sendPrompt(chatId, '🖼 ' + tx(user).settings, photoSettingsKeyboard(user), user);
    else if (user.state === 'settings_channel_menu') await sendPrompt(chatId, '📢 ' + tx(user).settings, channelSettingsKeyboard(user), user);
    else if (user.state === 'settings_favorites_menu') await sendPrompt(chatId, '❤️ ' + tx(user).settings, favoriteSettingsKeyboard(user), user);
    else if (user.state === 'waiting_profile_photo') await sendPrompt(chatId, user.language === 'en' ? 'Send the profile photo now.' : 'اوس د پروفایل عکس راولېږه.', { force_reply: true }, user);
    else if (user.state === 'waiting_profile_channel') await sendPrompt(chatId, user.language === 'en' ? 'Send a public channel @username or t.me/username.' : 'د عام چینل @username یا لینک راولېږه.', { force_reply: true }, user);
    else if (user.state === 'admin_menu' || user.state.startsWith('waiting_') || user.state.startsWith('admin_edit_user_') || user.state.startsWith('admin_adjust_balance:') || user.state.startsWith('admin_send_user_message:') || user.state.startsWith('admin_set_referral_reward:')) {
      user.state = 'admin_menu'; await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).adminIntro, adminKeyboard(user), user);
    } else await showMain(chatId, user);
    return;
  }

  if (user.state === 'waiting_profile_photo') {
    if (Array.isArray(message.photo) && message.photo.length) {
      const photoId = message.photo[message.photo.length - 1].file_id;
      await db.update(users).set({ profile_photo_id: photoId, state: 'settings_menu' }).where(eq(users.telegram_id, id)).run();
      user.profile_photo_id = photoId; user.state = 'settings_menu';
      await sendPrompt(chatId, tx(user).saved + '\n' + tx(user).settings, settingsKeyboard(user), user); return;
    }
    await sendPrompt(chatId, user.language === 'en' ? 'Please send a photo.' : user.language === 'fa' ? 'لطفاً یک عکس بفرستید.' : user.language === 'ur' ? 'براہ کرم تصویر بھیجیں۔' : user.language === 'ar' ? 'أرسل صورة من فضلك.' : 'مهرباني وکړه عکس راولېږه.', { force_reply: true }, user); return;
  }
  if (user.state === 'waiting_profile_channel') {
    const raw = input.trim();
    let username = raw.replace(/^@/, '');
    const linkMatch = raw.match(/^(?:https?:\/\/)?t\.me\/([A-Za-z0-9_]{5,32})\/?$/i);
    if (linkMatch) username = linkMatch[1];
    if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username)) {
      user.state = 'settings_channel_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, user.language === 'en' ? 'Send a public channel @username or t.me/username link only.' : user.language === 'fa' ? 'فقط نام کاربری یا لینک عمومی کانال را بفرستید.' : user.language === 'ur' ? 'صرف عوامی چینل کا @username یا t.me لنک بھیجیں۔' : user.language === 'ar' ? 'أرسل اسم المستخدم أو رابط القناة العامة فقط.' : 'یوازې د عام چینل @username یا t.me لینک راولېږه.', channelSettingsKeyboard(user), user); return;
    }
    let publicChat = null;
    try { publicChat = await api.getChat({ chat_id: '@' + username }); } catch (e) {}
    if (!publicChat || publicChat.type !== 'channel' || !publicChat.username) {
      user.state = 'settings_channel_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, user.language === 'en' ? 'That public channel could not be verified. Check the username and try again.' : user.language === 'fa' ? 'کانال عمومی تأیید نشد؛ نام کاربری را بررسی کنید.' : user.language === 'ur' ? 'عوامی چینل کی تصدیق نہیں ہوئی، نام دوبارہ چیک کریں۔' : user.language === 'ar' ? 'تعذر التحقق من القناة العامة؛ تحقق من اسم المستخدم.' : 'دا عام چینل تایید نه شو؛ یوزرنیم سم وګوره.', channelSettingsKeyboard(user), user); return;
    }
    await db.update(users).set({ channel_username: '@' + publicChat.username, state: 'settings_menu' }).where(eq(users.telegram_id, id)).run();
    user.channel_username = '@' + publicChat.username; user.state = 'settings_menu';
    await sendPrompt(chatId, tx(user).saved + '\n' + tx(user).settings, settingsKeyboard(user), user); return;
  }
  const adminPhotoMatch = String(user.state || '').match(/^admin_edit_user_photo:(\d+)$/);
  if (adminPhotoMatch) {
    const targetId = Number(adminPhotoMatch[1]);
    if (!Array.isArray(message.photo) || !message.photo.length) { await sendPrompt(chatId, user.language === 'en' ? 'Please send a photo to set as the user profile picture.' : 'د کارن د پروفایل لپاره عکس راولېږه.', { force_reply: true }, user); return; }
    const photoId = message.photo[message.photo.length - 1].file_id;
    await db.update(users).set({ profile_photo_id: photoId }).where(eq(users.telegram_id, targetId)).run();
    user.state = 'admin_menu'; await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    const target = await getUser(targetId); if (target) await showAdminUserSettings(chatId, user, target); return;
  }
  const rewardMatch = String(user.state || '').match(/^admin_set_referral_reward:(stars|points|likes)$/);
  if (rewardMatch) {
    const field = rewardMatch[1], amount = Number(input);
    if (!(await isAdmin(id))) { user.state = 'ready'; await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user); return; }
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1000000) { await sendPrompt(chatId, '⚠️ صفر یا مثبت صحیح عدد ولیکه.', { force_reply: true }, user); return; }
    await setSetting('referral_reward_' + field, amount);
    user.state = 'admin_menu'; await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    const stars = await getSetting('referral_reward_stars', 15), points = await getSetting('referral_reward_points', 5), likes = await getSetting('referral_reward_likes', 2);
    await sendPrompt(chatId, '✅ د ریفرل جایزې ثبت شوې:\n\n⭐ ستوري: ' + stars + '\n\n🏆 نمرې: ' + points + '\n\n❤️ لایکونه: ' + likes,
      { inline_keyboard: [[{ text: '⭐ ستوري', callback_data: 'admin:reward:stars' }, { text: '🏆 نمرې', callback_data: 'admin:reward:points' }], [{ text: '❤️ لایکونه', callback_data: 'admin:reward:likes' }], [{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]] }, user); return;
  }
  const balanceMatch = String(user.state || '').match(/^admin_adjust_balance:(stars|points|likes):(add|sub):(\d+)$/);
  if (balanceMatch) {
    const field = balanceMatch[1], operation = balanceMatch[2], targetId = Number(balanceMatch[3]), amount = Number(input);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000) { await sendPrompt(chatId, user.language === 'en' ? 'Send a positive whole number.' : 'مثبت صحیح عدد راولېږه.', { force_reply: true }, user); return; }
    const target = await getUser(targetId); if (!target) { user.state = 'admin_menu'; await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).userNotFound, adminKeyboard(user), user); return; }
    const oldValue = Number(target[field] || 0), nextValue = operation === 'add' ? oldValue + amount : Math.max(0, oldValue - amount);
    if (field === 'stars') await db.update(users).set({ stars: nextValue }).where(eq(users.telegram_id, targetId)).run();
    else if (field === 'points') await db.update(users).set({ points: nextValue }).where(eq(users.telegram_id, targetId)).run();
    else await db.update(users).set({ likes: nextValue }).where(eq(users.telegram_id, targetId)).run();
    target[field] = nextValue;
    user.state = 'admin_menu'; await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run(); await showAdminUserSettings(chatId, user, target); return;
  }
  const sendToUserMatch = String(user.state || '').match(/^admin_send_user_message:(\d+)$/);
  if (sendToUserMatch) {
    const targetId = Number(sendToUserMatch[1]);
    try { await api.copyMessage({ chat_id: targetId, from_chat_id: chatId, message_id: message.message_id }); }
    catch (e) { await sendPrompt(chatId, user.language === 'en' ? 'Could not send this message to the user.' : 'دا پیغام کارن ته ونه لېږل شو.', { force_reply: true }, user); return; }
    const target = await getUser(targetId); user.state = 'admin_menu'; await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    if (target) await showAdminUserSettings(chatId, user, target); return;
  }

  const action = actionFor(input);
  if (input === '/check' || input === '/joined') {
    if (user.state !== 'check_membership') { await showMain(chatId, user); return; }
    if (await checkMembership(id)) {
      await db.update(users).set({ state: 'choose_country' }).where(eq(users.telegram_id, id)).run();
      user.state = 'choose_country';
      await showCountry(chatId, user);
    } else await sendPrompt(chatId, tx(user).membershipFail, { inline_keyboard: [[{ text: tx(user).joined, callback_data: 'reg:membership:check' }]] }, user);
    return;
  }

  const selectedLanguage = matchLanguage(input);
  if (selectedLanguage && (user.state === 'choose_language' || user.state === 'ready' ||
      user.state === 'check_membership' || user.state === 'choose_country' ||
      user.state === 'choose_gender' || user.state === 'choose_age' ||
      user.state === 'enter_name' || user.state === 'enter_surname')) {
    const nextState = user.country ? 'ready' : 'check_membership';
    await db.update(users).set({ language: selectedLanguage.code, state: nextState })
      .where(eq(users.telegram_id, id)).run();
    user.language = selectedLanguage.code;
    user.state = nextState;
    if (nextState === 'ready') {
      await showMain(chatId, user, tx(user).saved);
    } else {
      await showMembership(chatId, user);
    }
    return;
  }
  if (user.state === 'choose_language') {
    await showLanguage(chatId, user);
    return;
  }
  if (user.state === 'check_membership') {
    if (action !== 'joined') { await showMembership(chatId, user); return; }
    if (await checkMembership(id)) {
      await db.update(users).set({ state: 'choose_country' }).where(eq(users.telegram_id, id)).run();
      user.state = 'choose_country';
      await showCountry(chatId, user);
    } else await sendPrompt(chatId, tx(user).membershipFail, { inline_keyboard: [[{ text: tx(user).joined, callback_data: 'reg:membership:check' }]] }, user);
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
    const back = async (message) => { user.state = 'admin_management_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, message + '\n' + tx(user).adminManagementIntro, adminManagementKeyboard(user), user); };
    if (!Number.isSafeInteger(adminId) || adminId <= 0) { await back(tx(user).badId); return; }
    if (ROOT_ADMINS.includes(adminId) || await isAdmin(adminId)) { await back(tx(user).adminExists); return; }
    const target = await getUser(adminId);
    if (!target) { await back(tx(user).userNotFound); return; }
    await db.insert(admins).values({ telegram_id: adminId, created_at: new Date().toISOString() }).run();
    await back(tx(user).adminAdded); return;
  }
  if (user.state === 'waiting_remove_admin_id') {
    const adminId = Number(input);
    const back = async (message) => { user.state = 'admin_management_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, message + '\n' + tx(user).adminManagementIntro, adminManagementKeyboard(user), user); };
    if (!Number.isSafeInteger(adminId) || adminId <= 0) { await back(tx(user).badId); return; }
    if (ROOT_ADMINS.includes(adminId)) { await back(tx(user).rootAdmin); return; }
    if (!await getUser(adminId)) { await back(tx(user).userNotFound); return; }
    const existing = await db.select().from(admins).where(eq(admins.telegram_id, adminId)).get();
    if (!existing) { await back(tx(user).adminNotFound); return; }
    await db.delete(admins).where(eq(admins.telegram_id, adminId)).run();
    await back(tx(user).adminRemoved); return;
  }
  if (user.state === 'waiting_user_settings_id') {
    const targetId = Number(input);
    user.state = 'admin_menu';
    await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    if (!Number.isSafeInteger(targetId) || targetId <= 0) { await sendPrompt(chatId, tx(user).badId, adminKeyboard(user), user); return; }
    const target = await getUser(targetId);
    if (!target) { await sendPrompt(chatId, tx(user).userNotFound, adminKeyboard(user), user); return; }
    await showAdminUserSettings(chatId, user, target);
    return;
  }
  if (/^admin_edit_user_(name|surname):\d+$/.test(String(user.state || ''))) {
    const match = String(user.state).match(/^admin_edit_user_(name|surname):(\d+)$/);
    const field = match[1], targetId = Number(match[2]);
    const target = await getUser(targetId);
    user.state = 'admin_menu';
    await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    if (!target) { await sendPrompt(chatId, tx(user).userNotFound, adminKeyboard(user), user); return; }
    if (input.startsWith('/') && !(field === 'surname' && input === '/skip')) { await sendPrompt(chatId, tx(user).cancel, adminKeyboard(user), user); return; }
    if ((field === 'name' && (input.length < 2 || input.length > 60)) || input.length > 60) { await sendPrompt(chatId, tx(user).nameInvalid, adminKeyboard(user), user); return; }
    await db.update(users).set({ [field]: field === 'surname' && input === '/skip' ? null : (input || null) }).where(eq(users.telegram_id, targetId)).run();
    const updatedTarget = await getUser(targetId);
    await showAdminUserSettings(chatId, user, updatedTarget);
    return;
  }
  if (user.state === 'waiting_channel_details') {
    const requestedId = input.trim();
    const backToChannels = async (message) => { user.state = 'admin_channels_menu'; await db.update(users).set({ state: 'admin_channels_menu' }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, message, channelKeyboard(user), user); };
    if (!requestedId || !Number.isSafeInteger(Number(requestedId))) { await backToChannels(tx(user).channelFormat); return; }
    const existing = await db.select().from(required_chats).where(eq(required_chats.chat_id, requestedId)).get();
    if (existing) { await backToChannels(tx(user).channelExists); return; }
    let chat;
    try { chat = await api.getChat({ chat_id: requestedId }); } catch (e) { await backToChannels(channelError(user, 'invalid')); return; }
    if (!chat || !['group', 'supergroup', 'channel'].includes(chat.type)) { await backToChannels(channelError(user, 'invalid')); return; }
    let bot;
    try { bot = await api.getMe({}); } catch (e) { await backToChannels(channelError(user, 'invalid')); return; }
    let botMember;
    try { botMember = await api.getChatMember({ chat_id: requestedId, user_id: Number(bot.id) }); } catch (e) { await backToChannels(channelError(user, 'member')); return; }
    const botStatus = botMember && botMember.status;
    if (!['creator', 'administrator', 'member', 'restricted'].includes(botStatus)) { await backToChannels(channelError(user, 'member')); return; }
    if (!['creator', 'administrator'].includes(botStatus)) { await backToChannels(channelError(user, 'admin')); return; }
    let inviteLink = chat.invite_link || (chat.username ? 'https://t.me/' + chat.username : '');
    if (!inviteLink) { try { const invite = await api.createChatInviteLink({ chat_id: requestedId }); inviteLink = invite && invite.invite_link ? invite.invite_link : ''; } catch (e) {} }
    if (!inviteLink.startsWith('https://t.me/')) { await backToChannels(channelError(user, 'link')); return; }
    const chatType = chat.type === 'channel' ? 'channel' : 'group';
    const title = String(chat.title || chat.first_name || chat.username || requestedId).replace(/^(channel|group)::/, '');
    await db.insert(required_chats).values({ chat_id: requestedId, invite_link: inviteLink, title: chatType + '::' + title, is_active: 1, created_at: new Date().toISOString() }).run();
    await backToChannels(tx(user).channelAdded); return;
  }
  if (user.state === 'waiting_remove_channel_id') {
    const requestedId = input.trim(); user.state = 'admin_channels_menu';
    await db.update(users).set({ state: 'admin_channels_menu' }).where(eq(users.telegram_id, id)).run();
    if (!requestedId || !Number.isSafeInteger(Number(requestedId))) { await sendPrompt(chatId, tx(user).channelFormat, channelKeyboard(user), user); return; }
    const existing = await db.select().from(required_chats).where(eq(required_chats.chat_id, requestedId)).get();
    if (!existing) { await sendPrompt(chatId, tx(user).channelMissing, channelKeyboard(user), user); return; }
    await db.delete(required_chats).where(eq(required_chats.chat_id, requestedId)).run();
    await sendPrompt(chatId, tx(user).channelRemoved, channelKeyboard(user), user); return;
  }
  if (user.state === 'waiting_broadcast') {
    if (action === 'cancel') { await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run(); user.state = 'admin_menu'; await sendPrompt(chatId, tx(user).cancel, adminKeyboard(user), user); return; }
    const recipients = await db.select({ telegram_id: users.telegram_id }).from(users).all(); let sent = 0, failed = 0;
    for (const recipient of recipients) {
      try { await api.copyMessage({ chat_id: Number(recipient.telegram_id), from_chat_id: chatId, message_id: message.message_id }); sent += 1; }
      catch (e) { failed += 1; }
    }
    await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run(); user.state = 'admin_menu';
    await sendPrompt(chatId, tx(user).broadcastDone + sent + tx(user).broadcastFailed + failed, adminKeyboard(user), user); return;
  }

  if (user.state === 'settings_menu') {
    if (action === 'profileSettings') { user.state = 'profile_settings_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).profileSettingsTitle, profileSettingsKeyboard(user), user); return; }
    if (action === 'photoSettings') { user.state = 'settings_photo_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, (user.profile_photo_id ? '✅ ' : '➖ ') + (user.language === 'en' ? 'Profile photo settings:' : user.language === 'fa' ? 'تنظیمات عکس پروفایل:' : user.language === 'ur' ? 'پروفائل تصویر کی ترتیبات:' : user.language === 'ar' ? 'إعدادات صورة الملف الشخصي:' : 'د پروفایل عکس تنظیمات:'), photoSettingsKeyboard(user), user); return; }
    if (action === 'channelSettings') { user.state = 'settings_channel_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, (user.channel_username ? user.channel_username + '\n' : '➖ ') + (user.language === 'en' ? 'Public channel settings:' : user.language === 'fa' ? 'تنظیمات کانال عمومی:' : user.language === 'ur' ? 'عوامی چینل کی ترتیبات:' : user.language === 'ar' ? 'إعدادات القناة العامة:' : 'د عام چینل تنظیمات:'), channelSettingsKeyboard(user), user); return; }
    if (action === 'favoriteSettings') { user.state = 'settings_favorites_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, user.language === 'en' ? '❤️ Manage favorite friends:' : user.language === 'fa' ? '❤️ مدیریت دوستان محبوب:' : user.language === 'ur' ? '❤️ پسندیدہ دوستوں کا انتظام:' : user.language === 'ar' ? '❤️ إدارة الأصدقاء المفضلين:' : '❤️ د پالو ملګرو تنظیمات:', favoriteSettingsKeyboard(user), user); return; }
    if (action === 'connectionSettings') { await sendPrompt(chatId, '🔔 د اړیکې تنظیمات: د اړیکې پر مهال د راتلونکو غوښتنو ډول وټاکه.\n\nیادونه: د اړیکو د نښلولو سیستم لا د جوړېدو په پړاو کې دی.', { inline_keyboard: [[{ text: '🌐 د ټولو کسانو غوښتنې', callback_data: 'settings:connection:all' }], [{ text: '❤️ یوازې د پالو ملګرو غوښتنې', callback_data: 'settings:connection:followed' }], [{ text: '🔕 هېڅ غوښتنه نه', callback_data: 'settings:connection:none' }], [{ text: '🔙 تنظیمات', callback_data: 'settings:open' }]] }, user); return; }
    await showMain(chatId, user); return;
  }
  if (user.state === 'profile_settings_menu') {
    const i = tx(user).profileSettingsButtons.indexOf(input);
    const field = i >= 0 ? ['country','gender','age','name','surname','photoSettings','channelSettings','back'][i] : action;
    if (field === 'photoSettings') { user.state = 'settings_photo_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, '🖼 د پروفایل عکس تنظیمات:', photoSettingsKeyboard(user), user); return; }
    if (field === 'channelSettings') { user.state = 'settings_channel_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, '📢 د عام چینل تنظیمات:\n\n' + (user.channel_username || 'چینل نه دی ثبت شوی'), channelSettingsKeyboard(user), user); return; }
    if (field === 'back') { user.state = 'settings_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).settings, settingsKeyboard(user), user); return; }
    if (!['country','gender','age','name','surname'].includes(field)) { await sendPrompt(chatId, tx(user).settings, profileSettingsKeyboard(user), user); return; }
    user.state = 'settings_' + field; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
    if (field === 'country') await showCountry(chatId, user); else if (field === 'gender') await showGender(chatId, user); else if (field === 'age') await showAge(chatId, user); else if (field === 'name') await showName(chatId, user); else await showSurname(chatId, user); return;
  }
  if (user.state === 'settings_photo_menu') {
    if (action === 'photoSet') { user.state = 'waiting_profile_photo'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, user.language === 'en' ? 'Send the profile photo now.' : user.language === 'fa' ? 'اکنون عکس پروفایل را بفرستید.' : user.language === 'ur' ? 'اب پروفائل تصویر بھیجیں۔' : user.language === 'ar' ? 'أرسل صورة الملف الشخصي الآن.' : 'اوس د پروفایل عکس راولېږه.', { force_reply: true }, user); return; }
    if (action === 'photoRemove') { await db.update(users).set({ profile_photo_id: null, state: 'settings_menu' }).where(eq(users.telegram_id, id)).run(); user.profile_photo_id = null; user.state = 'settings_menu'; await sendPrompt(chatId, tx(user).saved + '\n' + tx(user).settings, settingsKeyboard(user), user); return; }
    if (action === 'back') { user.state = 'settings_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).settings, settingsKeyboard(user), user); return; }
    await sendPrompt(chatId, user.language === 'en' ? 'Choose an option below.' : 'لاندې یو انتخاب وټاکه.', photoSettingsKeyboard(user), user); return;
  }
  if (user.state === 'settings_channel_menu') {
    if (action === 'channelSet') { user.state = 'waiting_profile_channel'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, user.language === 'en' ? 'Send a public channel @username or https://t.me/username. Private invite links are not accepted.' : user.language === 'fa' ? 'نام کاربری یا لینک عمومی کانال را بفرستید؛ لینک خصوصی پذیرفته نیست.' : user.language === 'ur' ? 'عوامی چینل کا @username یا لنک بھیجیں؛ نجی لنک قبول نہیں۔' : user.language === 'ar' ? 'أرسل اسم المستخدم أو رابط القناة العامة؛ الروابط الخاصة غير مقبولة.' : 'د عام چینل @username یا لینک راولېږه؛ خصوصي لینک نه منل کېږي.', { force_reply: true }, user); return; }
    if (action === 'channelRemoveProfile') { await db.update(users).set({ channel_username: null, state: 'settings_menu' }).where(eq(users.telegram_id, id)).run(); user.channel_username = null; user.state = 'settings_menu'; await sendPrompt(chatId, tx(user).saved + '\n' + tx(user).settings, settingsKeyboard(user), user); return; }
    if (action === 'back') { user.state = 'settings_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).settings, settingsKeyboard(user), user); return; }
    await sendPrompt(chatId, user.language === 'en' ? 'Choose an option below.' : 'لاندې یو انتخاب وټاکه.', channelSettingsKeyboard(user), user); return;
  }
  if (user.state === 'settings_favorites_menu') {
    if (action === 'favoritesList') { await showFavoriteSettings(chatId, user, 0); return; }
    if (action === 'back') { user.state = 'settings_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).settings, settingsKeyboard(user), user); return; }
    await sendPrompt(chatId, user.language === 'en' ? 'Choose an option below.' : 'لاندې یو انتخاب وټاکه.', favoriteSettingsKeyboard(user), user); return;
  }

  if (user.state === 'admin_menu') {
    if (!(await isAdmin(id))) { user.state = 'ready'; await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user); return; }
    const i = tx(user).adminButtons.indexOf(input);
    const field = i >= 0 ? ['adminManagement','channels','broadcast','userSettings','usersList','back','rewardSettings'][i] : action;
    if (field === 'rewardSettings') { const stars = await getSetting('referral_reward_stars', 15), points = await getSetting('referral_reward_points', 5), likes = await getSetting('referral_reward_likes', 2); await sendPrompt(chatId, '🎁 د ریفرل جایزې تنظیمات:\n\n⭐ د هر دعوت ستوري: ' + stars + '\n\n🏆 د هر دعوت نمرې: ' + points + '\n\n❤️ د هر دعوت لایکونه: ' + likes + '\n\nد بدلون لپاره لاندې برخه وټاکه.', { inline_keyboard: [[{ text: '⭐ ستوري بدلول', callback_data: 'admin:reward:stars' }, { text: '🏆 نمرې بدلول', callback_data: 'admin:reward:points' }], [{ text: '❤️ لایکونه بدلول', callback_data: 'admin:reward:likes' }], [{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]] }, user); return; }
    if (field === 'adminManagement') {
      user.state = 'admin_management_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).adminManagementIntro, adminManagementKeyboard(user), user);
    } else if (field === 'channels') {
      user.state = 'admin_channels_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).channelIntro, channelKeyboard(user), user);
    } else if (field === 'broadcast') {
      user.state = 'waiting_broadcast'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askBroadcast, keyboard([[{ text: tx(user).cancel }]]), user);
    } else if (field === 'userSettings') {
      user.state = 'waiting_user_settings_id'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askUserSettings, { force_reply: true }, user);
    } else if (field === 'usersList') await showUserList(chatId, user, 0);
    else await showMain(chatId, user);
    return;
  }
  if (user.state === 'admin_management_menu') {
    const i = tx(user).adminManagementButtons.indexOf(input);
    const field = i >= 0 ? ['adminAdd','adminRemove','adminsList','back'][i] : action;
    if (field === 'adminAdd') {
      user.state = 'waiting_admin_id'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askAdmin, { force_reply: true }, user);
    } else if (field === 'adminRemove') {
      user.state = 'waiting_remove_admin_id'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askRemoveAdmin, { force_reply: true }, user);
    } else if (field === 'adminsList') await showAdminList(chatId, user, 0);
    else {
      user.state = 'admin_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).adminIntro, adminKeyboard(user), user);
    }
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