Random Connect — Telegram Random Chat Bot

موخه
Random Connect د کاروونکي ثبت، اجباري غړیتوب، تصادفي اړیکې، پیغامونو relay، د ملګرو فالو/نمرې/لایک، راپور او د 🎲 ګېم بنسټیز سیستم لري.

اوسنی message handler
- د ژبې انتخاب: پښتو، دري، English، اردو او عربي.
- د AskTechPs اجباري غړیتوب؛ د اډمین پینل له لارې نور ګروپونه او چینلونه هم زیاتېدای او لرې کېدای شي.
- د هېواد، جنسیت، عمر، نوم او اختیاري تخلص ثبتول.
- اصلي مېنو کې د ملګري لټون، ناڅاپي اړیکه، دعوت، پروفایل، تنظیمات، احصائیه او 🎲 ګېم؛ د اډمین پینل یوازې مجاز مدیرانو ته ښکاري.
- د پروفایل کارت؛ د پروفایل عکس ثبتول، بدلول او حذفول.
- د عام Telegram چینل د @username ثبتول؛ خصوصي دعوتي لینکونه نه منل کېږي.
- د پروفایل مېنو کې د هېواد، جنسیت، عمر، نوم، تخلص، عکس او عام چینل تنظیمات؛ د پالو ملګرو لېست/Unfollow جلا دی.
- د ریفرل د هر بریالي نوي ثبت جایزه: ډیفالټ ۱۵ ستوري، ۵ نمرې او ۲ لایکونه؛ اډمین یې له پینل څخه بدلولای شي.
- د آنلاین کاروونکو احصائیه د وروستیو ۱۵ دقیقو فعالیت له مخې محاسبه کېږي.
- د اړیکې غوښتنو تنظیمات: د ټولو کسانو غوښتنې، یوازې د پالو ملګرو غوښتنې، یا هېڅ غوښتنه نه؛ د پروفایل ښکاره کول ټولو ته یا یوازې پالو ملګرو ته.
- ځانګړی Referral Link او د شریکولو بټن.
- د مدیرانو تنظیمات په یوه فرعي مېنو کې؛ د کارن تنظیمات، مسدودول/خلاصول، عکس بدلول او د ستورو/نمرو/لایکونو بیلانس زیاتول یا کمول.
- د مدیرانو او کاروونکو پاڼه‌وار لېستونه؛ په هره پاڼه کې ۸ کسان، د مخکینۍ/راتلونکې پاڼې او اصلي مېنو بټنونه، او د ID د کاپي کولو بټن.
- د اډمین ډله‌ییز پیغام او انفرادي پیغام هر ډول Telegram محتوا کاپي کوي، نه یوازې متن.
- د اډمین احصائیه د ټول کاروونکو او آنلاین کاروونکو شمېر ښيي او ورسره د تر ټولو ډېرو ریفرلونو لرونکي ۵ کسان د نوم او د کاپي کېدونکي ID سره ښيي.
- د اډمین پینل کې «🏆 لوړ رتبه کسان» بټن د نمرو، ریفرلونو، فالو شوو کسانو او لایکونو څلور جلا درجه‌بندۍ ښيي؛ هر لېست تر ۵ کسانو پورې دی او ID د Telegram د کاپي کېدونکي code په بڼه ښکاري.
- د هر نوي لارښود پیغام تر لېږلو مخکې د پخواني بوټ پیغام د حذف هڅه.

لومړني مدیران
- 7851941608
- 7003093962

لومړنی اجباري غړیتوب
- Chat ID: -1004419974496
- Link: https://t.me/AskTechPs

مهم محدودیتونه
- د Telegram بټنونو اصلي سور، شین او نېلي رنګونه د عادي Bot API له لارې په خپل سر نه شي ټاکل کېدای.
- د ثبت‌نام د ژبې، غړیتوب، هېواد، جنسیت، عمر او د تخلص د نه لیکلو انتخابونه Inline Keyboard کاروي. د دې کلیکونه په tgcloud/handlers/callback_query.js کې پروسس کېږي؛ د اصلي مېنو تڼۍ Reply Keyboard پاتې دي.
- د تصادفي اړیکې لټون، د غوښتنې منل/ردول، د پیغامونو relay، د پروفایل د لیدلو محدودیت، فالو، د ۱ تر ۵ نمرو ورکول، یو ځل لایک/بېرته اخیستل، راپور او د وروستیو ۱۰ دقیقو د بوټ له خوا لېږل شوو relay پیغامونو حذفول د موجودو message او callback_query handlers له لارې جوړ شوي دي.
- د ګېم برخه د Telegram 🎲 dice، د لوبغاړو موندلو، د منلو/ردولو او د ستورو/نمرو حسابولو ملاتړ کوي.
- د ۵ دقیقو بې‌پیغامۍ او ۴۰ دقیقو اعظمي اړیکې، د ملګري لټون د ۲ دقیقو انتظار، او د ګېم/سیال د ۲ دقیقو انتظار په هر incoming message یا callback update کې د ټولو اړوندو کاروونکو لپاره بیا کتل کېږي. که هېڅ نوی update رانه شي، Serverless handler په خپله په ټاکلي وخت نه راویښېږي؛ د دقیق وخت لپاره scheduler/cron ته اړتیا ده، او نوی Event Handler نه دی جوړ شوی. د ګېم د سیال د منلو وخت چې پای ته ورسېږي، په راتلونکي update کې لوبه له بوټ سره بشپړېږي.
- د Telegram محدودیت له مخې بوټ د کارن اصلي پیغامونه په شخصي چټ کې نه شي حذفولای؛ د حذف تڼۍ یوازې د ملګري هغه کاپي شوي پیغامونه حذفوي چې بوټ په تېرو ۱۰ دقیقو کې کارن ته لېږلي وي.
- د غړیتوب د کتلو لپاره بوټ باید په هر اجباري ګروپ یا چینل کې د اړینې اجازې لرونکی وي.
- GitHub ته د کوډ ثبتول په خپله ژوندی Serverless کوډ نه بدلوي. لومړی کوډ Deploy/Push کړه، بیا د Database د Migration بدلونونه په دقت وګوره او تطبیق یې کړه. هېڅ خطرناک یا د حذف بدلون مه تاییدوه تر څو یې اغېز روښانه نه وي.
- د prompt tracking لپاره `users.last_prompt_id` هم اړین دی؛ که په موجود جدول کې نه وي، د migration کرښه یې اجرا کړه. د `user_blocks` او `reports` جدولونه هم د `CREATE TABLE IF NOT EXISTS` له لارې جوړېږي او موجود معلومات نه حذفوي. که د دغو جدولونو/فیلډونو له ډلې کوم یو مخکې موجود وي، تکراري ALTER مه اجرا کوه.

د users جدول کې نوي فیلډونه: `profile_photo_id`، `channel_username`، `stars`، `points`، `likes`، `last_active_at`، `connection_request_mode`، `welcome_reward_claimed`، `profile_visibility`، `search_gender` او `search_language` دي. د chat_sessions جدول کې `last_activity_at` او `end_reason` هم ورزیات شوي. د نوي کوډ له Deploy مخکې د موجودو معلوماتو له حذف پرته migration تطبیق کړه.
- لاندې migration کې د پخوانیو او نویو فیلډونو ټول اړین ALTER او CREATE بیانونه راغلي. هر ALTER یوازې هغه وخت اجرا کړه چې فیلډ موجود نه وي؛ که موجود وي، هغه کرښه پرېږده.
- د ښه راغلاست جایزه ډیفالټ ۱۰ ستوري، ۳ نمرې او ۲ لایکونه ده؛ هر کارن یې یوازې یو ځل اخلي. د ریفرل جایزه ډیفالټ ۱۵ ستوري، ۵ نمرې او ۲ لایکونه ده؛ دواړه جایزې د اډمین له پینل څخه بدلېدای شي.
- د آنلاین شمېر معیار د وروستیو ۱۵ دقیقو فعالیت دی؛ د کارن پیغام او د بوټ بټن کلیک د فعالیت وخت تازه کوي.
- د اړیکې د غوښتنو تنظیمات اوس انتخاب ثبتوي، خو د تصادفي اړیکې او پیغامونو relay سیستم لا نه دی فعال؛ له همدې امله دا تنظیم تر هغه وخته غوښتنې نه فلټر کوي چې matching سیستم جوړ شي.


د نوي matching او game schema لپاره د DB migration

دا بدلونونه یوازې یو ځل تطبیق کړه. د ALTER TABLE هره کرښه یوازې هغه وخت اجرا کړه چې فیلډ لا په جدول کې موجود نه وي. هېڅ جدول مه حذفوه.

ALTER TABLE users ADD COLUMN last_active_at TEXT;
ALTER TABLE users ADD COLUMN connection_request_mode TEXT NOT NULL DEFAULT 'all';
ALTER TABLE users ADD COLUMN welcome_reward_claimed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'everyone';
ALTER TABLE users ADD COLUMN search_gender TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE users ADD COLUMN search_language TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE chat_sessions ADD COLUMN last_activity_at TEXT;
ALTER TABLE chat_sessions ADD COLUMN end_reason TEXT;
ALTER TABLE users ADD COLUMN last_prompt_id INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_telegram_id INTEGER NOT NULL,
  blocked_telegram_id INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_telegram_id INTEGER NOT NULL,
  reported_telegram_id INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connection_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL,
  recipient_id INTEGER,
  status TEXT NOT NULL DEFAULT 'searching',
  request_type TEXT NOT NULL DEFAULT 'random',
  gender_filter TEXT NOT NULL DEFAULT 'auto',
  language_filter TEXT NOT NULL DEFAULT 'auto',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  recipient_message_id INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  rater_id INTEGER NOT NULL,
  rated_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  liker_id INTEGER NOT NULL,
  liked_id INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  opponent_id INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting',
  player_roll INTEGER,
  opponent_roll INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  fee_stars TEXT NOT NULL DEFAULT '0.5',
  win_stars TEXT NOT NULL DEFAULT '3',
  bot_loss_total_stars TEXT NOT NULL DEFAULT '3.5',
  points_award INTEGER NOT NULL DEFAULT 1
);


فایلونه
- tgcloud/handlers/message.js — د پیغام handler.
- tgcloud/schema.js — ۱۳ جدولونه: users، admins، required_chats، app_settings، favorites، chat_sessions، user_blocks، reports، connection_requests، chat_messages، user_ratings، user_likes او game_sessions.

رسمي اسناد
https://core.telegram.org/bots/serverless

## مهم: د Telegram Serverless له ویب پاڼې سره سمون

- `tgcloud/schema.js` د Serverless د **Database → Schema** برخې ته ځي؛ دا فایل باید په **Library** کې جوړ نه شي.
- په `tgcloud/handlers/message.js` او `tgcloud/handlers/callback_query.js` کې `import { ... } from '../schema.js';` د پروژې د اوسني `tgcloud/handlers/` او `tgcloud/schema.js` جوړښت لپاره سمه relative import لاره ده. یوازې د دې لپاره یې `from 'schema'` ته مه بدلوئ چې Library تشه ده.
- د GitHub بدلونونه په خپله د BotFather Serverless ته نه لېږدول کېږي. د Serverless په ویب پاڼه کې د Handler او Database کوډونه جلا دي؛ د GitHub نسخه او په Serverless کې خوندي شوې نسخه باید جلا پرتله شي.
- **د Migration مهم خبرداری:** که د Database → Migration په لېست کې `users.draft_*`، `ad_requests`، `ads` یا `listings` ښکاري، یا د `users.telegram_id` او `users.state` د بدلون خبرداری وي، تر ارزونې مخکې **Start Migration مه وهئ**. دا ښايي د پخواني/بل Schema او اوسني Random Connect Schema ترمنځ اختلاف وي؛ ځینې بدلونونه د معلوماتو یا جدولونو د حذف خطر لري. لومړی د موجودو جدولونو او د بدلونونو بشپړ لېست خوندي کړئ او د معلوماتو د ساتلو لپاره یې یو په یو وارزوئ.
- د Schema ثبتول او د Database Migration دوه جلا کارونه دي. د Migration لېست کې د `not in schema` مانا دا کېدای شي چې موجود جدول/ستنه په اوسني Schema کې نه تعریفېږي؛ دا په خپله د حذف اجازه نه ده.
