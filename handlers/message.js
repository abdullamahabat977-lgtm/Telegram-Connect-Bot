import { api, db } from 'sdk';
import { eq, or, like } from 'sdk/db';
import { users, listings, ads } from 'schema';

const L = {
  ps: {
    welcome:'🚀 Telegram Connect ته ښه راغلاست!\n\nچینلونه، ګروپونه او بوټونه پیدا کړه، خپل توکي ثبت کړه او د اعلان غوښتنه ولېږه.',
    menu:'👇 له لاندې مینو څخه یو انتخاب وکړه.',
    search:'🔎 لټون', register:'➕ ثبتول', ads:'📢 اعلانونه', account:'👤 زما حساب', help:'ℹ️ مرسته', language:'🌐 ژبه', admin:'🛠️ د مديريت پينل', adminListings:'📋 د ثبتونو کتنه', adminAds:'📢 د اعلانونو کتنه', adminUsers:'👥 کاروونکي', adminBroadcast:'📣 ټولو ته پیغام',
    chooseLanguage:'🌐 خپله ژبه وټاکه:', chooseType:'څه شی ثبتول غواړې؟', channel:'📢 چینل', group:'👥 ګروپ', bot:'🤖 بوټ',
    askName:'د چینل، ګروپ یا بوټ نوم ولیکه:', askUsername:'Username ولیکه، لکه @MyChannel. که نه لري، /skip ولیکه:',
    askDescription:'لنډه پېژندنه ولیکه یا /skip ولیکه:', saved:'✅ ستا ثبت د کتنې لپاره ولېږل شو.',
    searchPrompt:'د نوم یا Username له مخې لټون وکړه:', noResults:'🔎 تایید شوې پایله ونه موندل شوه.', results:'🔎 د لټون پایلې:',
    account:'👤 زما حساب', noListings:'تر اوسه دې کوم چینل، ګروپ یا بوټ نه دی ثبت کړی.',
    adsIntro:'📢 د اعلان غوښتنه ثبتولی شې. اوس د اعلان سرلیک ولیکه:', adDescription:'د اعلان تشریح ولیکه یا /skip ولیکه:',
    adBudget:'د اعلان بودیجه په عدد ولیکه، یا /skip ولیکه که بودیجه لا نه ده ټاکل شوې:',
    adSaved:'✅ د اعلان غوښتنه دې د کتنې لپاره ثبت شوه.', noAds:'تر اوسه دې د اعلان غوښتنه نه ده ثبت کړې.',
    helpText:'ℹ️ لارښود\n🔎 لټون — تایید شوي توکي پیدا کړه.\n➕ ثبتول — خپل چینل، ګروپ یا بوټ ثبت کړه.\n📢 اعلانونه — د اعلان غوښتنه ثبت کړه.\n👤 زما حساب — خپل ثبتونه وګوره.\n🌐 ژبه — ژبه بدله کړه.\n/cancel — عملیات لغوه کړه.',
    cancel:'عملیات لغوه شول.', back:'🏠 اصلي مینو', unknown:'له مینو څخه یو انتخاب وکړه یا /help ولیکه.',
    invalidName:'مهرباني وکړه معتبر نوم ولیکه.', invalidUsername:'Username باید ۵ تر ۳۲ انګلیسي توري، عدد یا _ ولري؛ یا /skip ولیکه.',
    invalidBudget:'بودیجه باید صفر یا مثبت عدد وي، یا /skip ولیکه.', languageSaved:'ژبه بدله شوه.',
    statuses:{pending:'تر کتنې لاندې', approved:'تایید شوی', rejected:'رد شوی'}
  },
  fa: {
    welcome:'🚀 به Telegram Connect خوش آمدید!\n\nکانال‌ها، گروه‌ها و ربات‌ها را پیدا کنید، مورد خود را ثبت کنید و درخواست اعلان بفرستید.',
    menu:'👇 یک گزینه را از منوی زیر انتخاب کنید.', search:'🔎 جستجو', register:'➕ ثبت', ads:'📢 اعلان‌ها', account:'👤 حساب من', help:'ℹ️ راهنما', language:'🌐 زبان', admin:'🛠️ پنل مدیریت', adminListings:'📋 بررسی موارد ثبت‌شده', adminAds:'📢 بررسی درخواست‌های اعلان', adminUsers:'👥 کاربران', adminBroadcast:'📣 پیام همگانی',
    chooseLanguage:'🌐 زبان خود را انتخاب کنید:', chooseType:'چه چیزی را ثبت می‌کنید؟', channel:'📢 کانال', group:'👥 گروه', bot:'🤖 ربات',
    askName:'نام کانال، گروه یا ربات را بنویسید:', askUsername:'Username را مانند @MyChannel بفرستید؛ اگر ندارد /skip را بفرستید:',
    askDescription:'معرفی کوتاه بنویسید یا /skip بفرستید:', saved:'✅ مورد شما برای بررسی ثبت شد.',
    searchPrompt:'نام یا Username را برای جستجو بفرستید:', noResults:'🔎 نتیجهٔ تأییدشده‌ای پیدا نشد.', results:'🔎 نتایج جستجو:',
    noListings:'هنوز موردی ثبت نکرده‌اید.', adsIntro:'📢 می‌توانید درخواست اعلان ثبت کنید. عنوان اعلان را بنویسید:', adDescription:'توضیح اعلان را بنویسید یا /skip بفرستید:',
    adBudget:'بودجه را به عدد بنویسید یا اگر مشخص نیست /skip بفرستید:', adSaved:'✅ درخواست اعلان برای بررسی ثبت شد.', noAds:'هنوز درخواست اعلانی ثبت نکرده‌اید.',
    helpText:'ℹ️ راهنما\n🔎 جستجو — موارد تأییدشده را پیدا کنید.\n➕ ثبت — کانال، گروه یا ربات خود را ثبت کنید.\n📢 اعلان‌ها — درخواست اعلان ثبت کنید.\n👤 حساب من — موارد خود را ببینید.\n🌐 زبان — زبان را تغییر دهید.\n/cancel — لغو عملیات.',
    cancel:'عملیات لغو شد.', back:'🏠 منوی اصلی', unknown:'از منو انتخاب کنید یا /help را بفرستید.',
    invalidName:'لطفاً نام معتبر بنویسید.', invalidUsername:'Username باید ۵ تا ۳۲ حرف انگلیسی، عدد یا _ باشد؛ یا /skip بفرستید.',
    invalidBudget:'بودجه باید عدد صفر یا مثبت باشد یا /skip بفرستید.', languageSaved:'زبان تغییر کرد.',
    statuses:{pending:'در انتظار بررسی', approved:'تأیید شده', rejected:'رد شده'}
  },
  en: {
    welcome:'🚀 Welcome to Telegram Connect!\n\nDiscover channels, groups and bots, submit your listing, and send ad requests.',
    menu:'👇 Choose an option below.', search:'🔎 Search', register:'➕ Submit listing', ads:'📢 Advertise', account:'👤 My account', help:'ℹ️ Help', language:'🌐 Language', admin:'🛠️ Admin panel', adminListings:'📋 Review listings', adminAds:'📢 Review ad requests', adminUsers:'👥 Users', adminBroadcast:'📣 Broadcast message',
    chooseLanguage:'🌐 Choose your language:', chooseType:'What would you like to submit?', channel:'📢 Channel', group:'👥 Group', bot:'🤖 Bot',
    askName:'Enter the channel, group, or bot name:', askUsername:'Send its username, e.g. @MyChannel. If it has none, send /skip:',
    askDescription:'Send a short description or /skip:', saved:'✅ Your listing was submitted for review.',
    searchPrompt:'Enter a name or username to search:', noResults:'🔎 No approved results found.', results:'🔎 Search results:',
    noListings:'You have not submitted any listings yet.', adsIntro:'📢 You can submit an ad request. Enter the ad title:', adDescription:'Enter the ad description or send /skip:',
    adBudget:'Enter the budget as a number, or /skip if undecided:', adSaved:'✅ Your ad request was submitted for review.', noAds:'You have not submitted any ad requests yet.',
    helpText:'ℹ️ Help\n🔎 Search — find approved listings.\n➕ Submit listing — add your channel, group, or bot.\n📢 Advertise — submit an ad request.\n👤 My account — view your submissions.\n🌐 Language — change language.\n/cancel — cancel the current operation.',
    cancel:'Operation cancelled.', back:'🏠 Main menu', unknown:'Choose a menu button or send /help.',
    invalidName:'Please enter a valid name.', invalidUsername:'Username must be 5–32 English letters, digits, or underscores, or send /skip.',
    invalidBudget:'Budget must be a non-negative number, or send /skip.', languageSaved:'Language updated.',
    statuses:{pending:'Pending review', approved:'Approved', rejected:'Rejected'}
  },
  ur: {
    welcome:'🚀 Telegram Connect میں خوش آمدید!\n\nچینلز، گروپس اور بوٹس تلاش کریں، اپنی لسٹنگ درج کریں اور اشتہار کی درخواست بھیجیں۔',
    menu:'👇 نیچے مینو سے ایک اختیار منتخب کریں۔', search:'🔎 تلاش', register:'➕ لسٹنگ درج کریں', ads:'📢 اشتہار', account:'👤 میرا اکاؤنٹ', help:'ℹ️ مدد', language:'🌐 زبان', admin:'🛠️ ایڈمن پینل', adminListings:'📋 لسٹنگز دیکھیں', adminAds:'📢 اشتہارات دیکھیں', adminUsers:'👥 صارفین', adminBroadcast:'📣 سب کو پیغام',
    chooseLanguage:'🌐 اپنی زبان منتخب کریں:', chooseType:'آپ کیا درج کرنا چاہتے ہیں؟', channel:'📢 چینل', group:'👥 گروپ', bot:'🤖 بوٹ',
    askName:'چینل، گروپ یا بوٹ کا نام لکھیں:', askUsername:'یوزرنیم مثلاً @MyChannel بھیجیں، نہ ہو تو /skip بھیجیں:',
    askDescription:'مختصر تعارف لکھیں یا /skip بھیجیں:', saved:'✅ آپ کی لسٹنگ جائزے کے لیے جمع ہوگئی۔',
    searchPrompt:'تلاش کے لیے نام یا یوزرنیم لکھیں:', noResults:'🔎 کوئی منظور شدہ نتیجہ نہیں ملا۔', results:'🔎 تلاش کے نتائج:',
    noListings:'آپ نے ابھی کوئی لسٹنگ جمع نہیں کی۔', adsIntro:'📢 اشتہار کی درخواست دے سکتے ہیں۔ اشتہار کا عنوان لکھیں:', adDescription:'اشتہار کی وضاحت لکھیں یا /skip بھیجیں:',
    adBudget:'بجٹ عدد میں لکھیں یا نامعلوم ہونے پر /skip بھیجیں:', adSaved:'✅ اشتہار کی درخواست جائزے کے لیے جمع ہوگئی۔', noAds:'آپ نے ابھی اشتہار کی درخواست نہیں دی۔',
    helpText:'ℹ️ مدد\n🔎 تلاش — منظور شدہ لسٹنگ تلاش کریں۔\n➕ لسٹنگ درج کریں — اپنا چینل، گروپ یا بوٹ شامل کریں۔\n📢 اشتہار — درخواست جمع کریں۔\n👤 میرا اکاؤنٹ — اپنی لسٹنگ دیکھیں۔\n🌐 زبان — زبان تبدیل کریں۔\n/cancel — منسوخ کریں۔',
    cancel:'عمل منسوخ ہوگیا۔', back:'🏠 مرکزی مینو', unknown:'مینو کا بٹن منتخب کریں یا /help بھیجیں.',
    invalidName:'درست نام درج کریں۔', invalidUsername:'یوزرنیم ۵ سے ۳۲ انگریزی حروف، اعداد یا _ پر مشتمل ہو، یا /skip بھیجیں.',
    invalidBudget:'بجٹ صفر یا مثبت عدد ہونا چاہیے، یا /skip بھیجیں۔', languageSaved:'زبان تبدیل ہوگئی۔',
    statuses:{pending:'جائزے کے انتظار میں', approved:'منظور شدہ', rejected:'مسترد'}
  },
  ar: {
    welcome:'🚀 أهلاً بك في Telegram Connect!\n\nاكتشف القنوات والمجموعات والروبوتات، وسجّل قائمتك وأرسل طلب إعلان.',
    menu:'👇 اختر خياراً من القائمة.', search:'🔎 بحث', register:'➕ إضافة قائمة', ads:'📢 إعلان', account:'👤 حسابي', help:'ℹ️ مساعدة', language:'🌐 اللغة', admin:'🛠️ لوحة الإدارة', adminListings:'📋 مراجعة القوائم', adminAds:'📢 مراجعة طلبات الإعلان', adminUsers:'👥 المستخدمون', adminBroadcast:'📣 رسالة للجميع',
    chooseLanguage:'🌐 اختر لغتك:', chooseType:'ماذا تريد أن تضيف؟', channel:'📢 قناة', group:'👥 مجموعة', bot:'🤖 روبوت',
    askName:'اكتب اسم القناة أو المجموعة أو الروبوت:', askUsername:'أرسل اسم المستخدم مثل @MyChannel، أو /skip إن لم يوجد:',
    askDescription:'اكتب وصفاً قصيراً أو أرسل /skip:', saved:'✅ تم إرسال قائمتك للمراجعة.',
    searchPrompt:'اكتب الاسم أو اسم المستخدم للبحث:', noResults:'🔎 لم يتم العثور على نتائج معتمدة.', results:'🔎 نتائج البحث:',
    noListings:'لم تضف أي قوائم بعد.', adsIntro:'📢 يمكنك إرسال طلب إعلان. اكتب عنوان الإعلان:', adDescription:'اكتب وصف الإعلان أو أرسل /skip:',
    adBudget:'اكتب الميزانية كرقم أو أرسل /skip إذا لم تحددها:', adSaved:'✅ تم إرسال طلب الإعلان للمراجعة.', noAds:'لم ترسل أي طلب إعلان بعد.',
    helpText:'ℹ️ المساعدة\n🔎 بحث — ابحث عن القوائم المعتمدة.\n➕ إضافة قائمة — سجّل قناتك أو مجموعتك أو روبوتك.\n📢 إعلان — أرسل طلب إعلان.\n👤 حسابي — اعرض قوائمك.\n🌐 اللغة — غيّر اللغة.\n/cancel — إلغاء العملية.',
    cancel:'تم إلغاء العملية.', back:'🏠 القائمة الرئيسية', unknown:'اختر زرًا من القائمة أو أرسل /help.',
    invalidName:'يرجى كتابة اسم صحيح.', invalidUsername:'يجب أن يتكون اسم المستخدم من 5 إلى 32 حرفاً أو رقماً إنجليزياً أو _، أو أرسل /skip.',
    invalidBudget:'يجب أن تكون الميزانية رقماً غير سالب أو أرسل /skip.', languageSaved:'تم تغيير اللغة.',
    statuses:{pending:'قيد المراجعة', approved:'معتمد', rejected:'مرفوض'}
  }
};

const LANGUAGE_BUTTONS = {
  ps:'🇦🇫 پښتو', fa:'🇦🇫 دری', en:'🇬🇧 English', ur:'🇵🇰 اردو', ar:'🇸🇦 العربية'
};
const LANG_FROM_BUTTON = Object.fromEntries(Object.entries(LANGUAGE_BUTTONS).map(([k,v]) => [v,k]));

function keyboard(rows) {
  return { keyboard: rows.map(row => row.map(text => ({ text }))), resize_keyboard: true };
}
function isAdmin(telegramId) { return [7851941608,7003093962].includes(Number(telegramId)); }
function mainKeyboard(t, admin=false) {
  const rows=[[t.search,t.register],[t.ads,t.account],[t.help,t.language]];
  if (admin) rows.push([t.admin]);
  return keyboard(rows);
}
function adminKeyboard(t) { return keyboard([[t.adminListings,t.adminAds],[t.adminUsers,t.adminBroadcast],[t.back]]); }
function languageKeyboard() {
  return { ...keyboard([[LANGUAGE_BUTTONS.ps,LANGUAGE_BUTTONS.fa],[LANGUAGE_BUTTONS.en,LANGUAGE_BUTTONS.ur],[LANGUAGE_BUTTONS.ar]]), one_time_keyboard:true };
}
function typeKeyboard(t) {
  return keyboard([[t.channel,t.group],[t.bot],[t.back]]);
}
function getLang(user) { return L[user?.language] ? user.language : 'ps'; }
async function send(chatId, text, reply_markup) {
  const payload = { chat_id:chatId, text };
  if (reply_markup) payload.reply_markup = reply_markup;
  await api.sendMessage(payload);
}
async function getOrCreateUser(from) {
  let row = await db.select().from(users).where(eq(users.telegram_id,from.id)).get();
  if (!row) {
    await db.insert(users).values({
      telegram_id:from.id, username:from.username ?? null, first_name:from.first_name ?? 'User',
      language:'ps', is_blocked:0, state:null, draft_type:null, draft_name:null, draft_username:null,
      draft_description:null, draft_title:null, draft_budget:null, created_at:new Date().toISOString()
    }).run();
    row = await db.select().from(users).where(eq(users.telegram_id,from.id)).get();
  } else {
    await db.update(users).set({ username:from.username ?? null, first_name:from.first_name ?? 'User' })
      .where(eq(users.id,row.id)).run();
    row = { ...row, username:from.username ?? null, first_name:from.first_name ?? 'User' };
  }
  return row;
}
async function updateUser(user, values) {
  await db.update(users).set(values).where(eq(users.id,user.id)).run();
  return await db.select().from(users).where(eq(users.id,user.id)).get();
}
async function clearDraft(user) {
  return updateUser(user, {
    state:null, draft_type:null, draft_name:null, draft_username:null,
    draft_description:null, draft_title:null, draft_budget:null
  });
}
async function showMain(chatId,user,prefix='') {
  const t=L[getLang(user)];
  await send(chatId,[prefix,t.welcome,t.menu].filter(Boolean).join('\n\n'),mainKeyboard(t,isAdmin(user.telegram_id)));
}
function cleanUsername(value) {
  const v=value.trim().replace(/^@/,'');
  if (!/^[A-Za-z0-9_]{5,32}$/.test(v)) return undefined;
  return '@'+v;
}
function cleanText(value,max=500) {
  const v=value.trim();
  return v.length ? v.slice(0,max) : '';
}

export default async function(message) {
  if (!message?.chat?.id || !message?.from) return;
  if (message.chat.type !== 'private') return;
  const chatId=message.chat.id;
  const text=(message.text ?? '').trim();
  if (!text) return;
  let user=await getOrCreateUser(message.from);
  let t=L[getLang(user)];

  // Admin panel: accessible only to the two configured Telegram IDs
  const admin = isAdmin(message.from.id);
  if (text==='/admin' || text===t.admin) {
    if (!admin) { await send(chatId,'⛔ دا برخه یوازې د بوټ مدیرانو لپاره ده.'); return; }
    await send(chatId,'🛠️ د مديريت پينل\n\nله لاندې څخه انتخاب وکړه. دلته یوازې مدیران د ثبتونو د تایید/رد او د کاروونکو د شمېر لیدلو اجازه لري.',adminKeyboard(t)); return;
  }
  if ([t.adminListings,t.adminAds,t.adminUsers,t.adminBroadcast].includes(text) && !admin) {
    await send(chatId,'⛔ دا برخه یوازې د بوټ مدیرانو لپاره ده.'); return;
  }
  if (admin && (text===t.adminListings || text==='/pending_listings')) {
    const rows=await db.select().from(listings).where(eq(listings.status,'pending')).all();
    const body=rows.length ? rows.slice(0,20).map(x=>`#${x.id} | ${x.type} | ${x.name}\nکارن ID: ${x.owner_id}\nUsername: ${x.username ?? 'نشته'}\nتشریح: ${x.description ?? 'نشته'}\nتایید: /approve_listing ${x.id}\nرد: /reject_listing ${x.id}`).join('\n\n') : 'اوس د کتنې لپاره ثبتونه نشته.';
    await send(chatId,'📋 د تایید په تمه ثبتونه:\n\n'+body,adminKeyboard(t)); return;
  }
  if (admin && (text===t.adminAds || text==='/pending_ads')) {
    const rows=await db.select().from(ads).where(eq(ads.status,'pending')).all();
    const body=rows.length ? rows.slice(0,20).map(x=>`#${x.id} | ${x.title}\nد کارن داخلي ID: ${x.owner_id}\nبوديجه: ${x.budget ?? 'نه ده ټاکل شوې'}\nتشریح: ${x.description ?? 'نشته'}\nتایید: /approve_ad ${x.id}\nرد: /reject_ad ${x.id}`).join('\n\n') : 'اوس د کتنې لپاره د اعلان غوښتنې نشته.';
    await send(chatId,'📢 د تایید په تمه اعلانونه:\n\n'+body,adminKeyboard(t)); return;
  }
  if (admin && text===t.adminBroadcast) {
    user=await updateUser(user,{state:'admin_broadcast'});
    await send(chatId,'📣 د ټولو کاروونکو لپاره پیغام ولیکه. د لېږلو مخکې یې متن په دقت وګوره. د لغوه کولو لپاره /cancel ولیکه.',keyboard([[t.back]])); return;
  }
  if (user.state==='admin_broadcast') {
    if (!admin) { user=await clearDraft(user); await send(chatId,'⛔ اجازه نشته.'); return; }
    if (text.startsWith('/')) { await send(chatId,'مهرباني وکړه د پیغام متن ولیکه، یا /cancel واستوه.'); return; }
    const recipients=await db.select().from(users).all();
    let sent=0, failed=0;
    for (const recipient of recipients) {
      if (Number(recipient.is_blocked)===1) continue;
      try { await send(recipient.telegram_id,'📣 د Telegram Connect پیغام:\\n\\n'+text); sent++; }
      catch { failed++; }
    }
    user=await clearDraft(user);
    await send(chatId,`✅ عمومي پیغام واستول شو.\\nبریالي لېږل: ${sent}\\nناکام/نه رسېدلي: ${failed}`,adminKeyboard(t)); return;
  }
  const blockAction=text.match(/^\\/(block|unblock)\\s+(\\d+)$/);
  if (blockAction) {
    if (!admin) { await send(chatId,'⛔ دا امر یوازې مدیران کارولی شي.'); return; }
    const [,action,idText]=blockAction;
    const targetId=Number(idText);
    if ([7851941608,7003093962].includes(targetId)) { await send(chatId,'⛔ د اصلي مدیرانو لاسرسی نه شي بندېدای.'); return; }
    const target=await db.select().from(users).where(eq(users.telegram_id,targetId)).get();
    if (!target) { await send(chatId,'❌ دا Telegram ID په بوټ کې نه دی ثبت شوی.'); return; }
    await db.update(users).set({is_blocked:action==='block'?1:0}).where(eq(users.id,target.id)).run();
    await send(chatId,`${action==='block'?'🚫 کاروونکی بند شو':'✅ کاروونکی بېرته فعال شو'}\\nTelegram ID: ${targetId}`,adminKeyboard(t)); return;
  }
  if (admin && (text===t.adminUsers || text==='/stats')) {
    const allUsers=await db.select().from(users).all();
    const allListings=await db.select().from(listings).all();
    const allAds=await db.select().from(ads).all();
    await send(chatId,`📊 د بوټ احصائیه\n\n👥 کاروونکي: ${allUsers.length}\n📋 ټول ثبتونه: ${allListings.length} (د تایید په تمه: ${allListings.filter(x=>x.status==='pending').length})\n📢 ټول اعلانونه: ${allAds.length} (د تایید په تمه: ${allAds.filter(x=>x.status==='pending').length})`,adminKeyboard(t)); return;
  }
  const adminAction = text.match(new RegExp('^/(approve|reject)_(listing|ad)\\s+(\\d+)$'));
  if (adminAction) {
    if (!admin) { await send(chatId,'⛔ دا امر یوازې مدیران کارولی شي.'); return; }
    const [,decision,kind,idText]=adminAction;
    const id=Number(idText);
    const table=kind==='listing' ? listings : ads;
    const row=await db.select().from(table).where(eq(table.id,id)).get();
    if (!row) { await send(chatId,'❌ دا شمېره ونه موندل شوه.'); return; }
    const status=decision==='approve' ? 'approved' : 'rejected';
    await db.update(table).set({status}).where(eq(table.id,id)).run();
    await send(chatId,`${decision==='approve'?'✅ تایید شو':'❌ رد شو'}: #${id} — ${row.name ?? row.title}`,adminKeyboard(t)); return;
  }

  if (text==='/cancel') {
    user=await clearDraft(user); t=L[getLang(user)];
    await showMain(chatId,user,t.cancel); return;
  }
  if (text==='/start' || text.startsWith('/start ')) {
    user=await clearDraft(user);
    await showMain(chatId,user); return;
  }
  if (text==='/language' || text===t.language || ['🌐 ژبه','🌐 زبان','🌐 اللغة','🌐 Language'].includes(text)) {
    await send(chatId,t.chooseLanguage,languageKeyboard()); return;
  }
  if (LANG_FROM_BUTTON[text]) {
    user=await updateUser(user,{language:LANG_FROM_BUTTON[text]});
    t=L[getLang(user)]; await showMain(chatId,user,t.languageSaved); return;
  }

  const backLabels=['🏠 اصلي مینو','🏠 منوی اصلی','🏠 مرکزی مینو','🏠 Main menu','🏠 القائمة الرئيسية'];
  if (text===t.back || backLabels.includes(text)) {
    user=await clearDraft(user); await showMain(chatId,user); return;
  }

  // Multi-step listing registration
  if (user.state==='listing_name') {
    const name=cleanText(text,120);
    if (!name || text.startsWith('/')) { await send(chatId,t.invalidName); return; }
    user=await updateUser(user,{draft_name:name,state:'listing_username'});
    await send(chatId,t.askUsername,keyboard([['/skip'],[t.back]])); return;
  }
  if (user.state==='listing_username') {
    let username=null;
    if (text.toLowerCase()!=='/skip') {
      username=cleanUsername(text);
      if (username===undefined) { await send(chatId,t.invalidUsername); return; }
    }
    user=await updateUser(user,{draft_username:username,state:'listing_description'});
    await send(chatId,t.askDescription,keyboard([['/skip'],[t.back]])); return;
  }
  if (user.state==='listing_description') {
    const description=text.toLowerCase()==='/skip' ? null : cleanText(text,1000);
    if (!user.draft_type || !user.draft_name) {
      user=await clearDraft(user); await showMain(chatId,user,t.cancel); return;
    }
    await db.insert(listings).values({
      owner_id:user.id, type:user.draft_type, name:user.draft_name, username:user.draft_username ?? null,
      description:description || null, category:null, status:'pending', created_at:new Date().toISOString()
    }).run();
    user=await clearDraft(user); t=L[getLang(user)]; await showMain(chatId,user,t.saved); return;
  }

  // Multi-step advertisement request
  if (user.state==='ad_title') {
    const title=cleanText(text,160);
    if (!title || text.startsWith('/')) { await send(chatId,t.invalidName); return; }
    user=await updateUser(user,{draft_title:title,state:'ad_description'});
    await send(chatId,t.adDescription,keyboard([['/skip'],[t.back]])); return;
  }
  if (user.state==='ad_description') {
    const description=text.toLowerCase()==='/skip' ? null : cleanText(text,1500);
    user=await updateUser(user,{draft_description:description || null,state:'ad_budget'});
    await send(chatId,t.adBudget,keyboard([['/skip'],[t.back]])); return;
  }
  if (user.state==='ad_budget') {
    let budget=null;
    if (text.toLowerCase()!=='/skip') {
      if (!/^\d{1,10}$/.test(text)) { await send(chatId,t.invalidBudget); return; }
      budget=Number(text);
    }
    await db.insert(ads).values({
      owner_id:user.id, title:user.draft_title, description:user.draft_description ?? null,
      budget, status:'pending', created_at:new Date().toISOString()
    }).run();
    user=await clearDraft(user); t=L[getLang(user)]; await showMain(chatId,user,t.adSaved); return;
  }

  if (text===t.help || text==='/help') { await send(chatId,t.helpText,mainKeyboard(t,isAdmin(user.telegram_id))); return; }
  if (text===t.account) {
    const ownListings=await db.select().from(listings).where(eq(listings.owner_id,user.id)).all();
    const ownAds=await db.select().from(ads).where(eq(ads.owner_id,user.id)).all();
    const listingText=ownListings.length
      ? ownListings.slice(0,10).map((x,i)=>`${i+1}. ${x.name} — ${t.statuses[x.status] ?? x.status}`).join('\n')
      : t.noListings;
    const adText=ownAds.length
      ? ownAds.slice(0,10).map((x,i)=>`${i+1}. ${x.title} — ${t.statuses[x.status] ?? x.status}`).join('\n')
      : t.noAds;
    await send(chatId,`${t.account}\n\n🆔 Telegram ID: ${message.from.id}\n👤 ${message.from.first_name ?? ''}\n🔗 ${message.from.username ? '@'+message.from.username : '—'}\n\n📋 ${ownListings.length} listing(s)\n${listingText}\n\n📢 ${ownAds.length} ad request(s)\n${adText}`,mainKeyboard(t,isAdmin(user.telegram_id)));
    return;
  }
  if (text===t.register) { await send(chatId,t.chooseType,typeKeyboard(t)); return; }
  if ([t.channel,t.group,t.bot].includes(text)) {
    const type=text===t.channel ? 'channel' : text===t.group ? 'group' : 'bot';
    user=await updateUser(user,{state:'listing_name',draft_type:type,draft_name:null,draft_username:null,draft_description:null});
    await send(chatId,t.askName,keyboard([[t.back]])); return;
  }
  if (text===t.search) {
    user=await updateUser(user,{state:'search'});
    await send(chatId,t.searchPrompt,keyboard([[t.back]])); return;
  }
  if (user.state==='search') {
    const raw=text.replace(/[%_]/g,'').slice(0,80);
    const query='%'+raw+'%';
    const matches=await db.select().from(listings)
      .where(or(eq(listings.username,text.startsWith('@')?text:'@'+text),like(listings.name,query)))
      .all();
    const visible=matches.filter(item=>item.status==='approved').slice(0,10);
    user=await updateUser(user,{state:null});
    if (!visible.length) { await send(chatId,t.noResults,mainKeyboard(t,isAdmin(user.telegram_id))); return; }
    const lines=visible.map((item,i)=>`${i+1}. ${item.type}: ${item.name}${item.username?'\n'+item.username:''}${item.description?'\n'+item.description:''}`);
    await send(chatId,t.results+'\n\n'+lines.join('\n\n'),mainKeyboard(t,isAdmin(user.telegram_id))); return;
  }
  if (text===t.ads) {
    user=await updateUser(user,{state:'ad_title',draft_title:null,draft_description:null,draft_budget:null});
    await send(chatId,t.adsIntro,keyboard([[t.back]])); return;
  }
  await send(chatId,t.unknown,mainKeyboard(t,isAdmin(user.telegram_id)));
}
