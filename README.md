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
- د ۵ دقیقو بې‌پیغامۍ او ۴۰ دقیقو اعظمي اړیکې، او د ۲ دقیقو د ګېم/ملګري انتظار موده د راتلونکو message/callback updates پر مهال ارزول کېږي. که هېڅ نوی update رانه شي، Serverless handler په خپله په ټاکلي وخت نه راویښېږي؛ د دقیق وخت لپاره scheduler/cron ته اړتیا ده، او نوی Event Handler نه دی جوړ شوی.
- د Telegram محدودیت له مخې بوټ د کارن اصلي پیغامونه په شخصي چټ کې نه شي حذفولای؛ د حذف تڼۍ یوازې د ملګري هغه کاپي شوي پیغامونه حذفوي چې بوټ په تېرو ۱۰ دقیقو کې کارن ته لېږلي وي.
- د غړیتوب د کتلو لپاره بوټ باید په هر اجباري ګروپ یا چینل کې د اړینې اجازې لرونکی وي.
- GitHub ته د کوډ ثبتول په خپله ژوندی Serverless کوډ نه بدلوي. لومړی کوډ Deploy/Push کړه، بیا د Database د Migration بدلونونه په دقت وګوره او تطبیق یې کړه. هېڅ خطرناک یا د حذف بدلون مه تاییدوه تر څو یې اغېز روښانه نه وي.
- د users جدول کې نوي فیلډونه: `profile_photo_id`، `channel_username`، `stars`، `points`، `likes`، `last_active_at`، `connection_request_mode`، `welcome_reward_claimed`، `profile_visibility`، `search_gender` او `search_language` دي. د chat_sessions جدول کې `last_activity_at` او `end_reason` هم ورزیات شوي. د نوي کوډ له Deploy مخکې د موجودو معلوماتو له حذف پرته migration تطبیق کړه.
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
