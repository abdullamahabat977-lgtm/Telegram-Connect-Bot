import { api, db } from 'sdk';
import { and, eq } from 'sdk/db';
import { users, admins, required_chats, app_settings, favorites, chat_sessions, connection_requests, chat_messages, user_ratings, user_likes, game_sessions, user_blocks, reports } from '../schema.js';
import { ROOT_ADMINS, LANGUAGES, COUNTRIES, AGES, languageKeyboard, countryKeyboard, ensureInlinePromptTracking, requiredChatInfo, listWords, isFollowing, otherSessionUser, getUser, safeDelete, isAdmin } from '../lib/shared.js';
import { T } from '../lib/message-text.js';




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
    [{ text: m[6] }, { text: m[7] }],
    [{ text: m[9] }, { text: m[10] }]
  ];
  if (admin) rows.push([{ text: m[8] }]);
  return keyboard(rows);
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
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }], [{ text: b[4] }, { text: b[5] }], [{ text: b[6] }], [{ text: b[7] }], [{ text: b[8] }]]);
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
  return keyboard([[{ text: b[0] }], [{ text: b[1] }, { text: b[2] }], [{ text: b[3] }, { text: b[4] }], [{ text: b[5] }], [{ text: b[6] }], [{ text: b[7] }, { text: b[8] }], [{ text: b[9] }]]);
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
      ['language', m[5]], ['settings', m[6]], ['stats', m[7]], ['admin', m[8]], ['game', m[9]], ['leaderboards', m[10]], ['joined', t.joined],
      ['country', t.profileSettingsButtons[0]], ['gender', t.profileSettingsButtons[1]], ['age', t.profileSettingsButtons[2]],
      ['name', t.profileSettingsButtons[3]], ['surname', t.profileSettingsButtons[4]],
      ['photoSettings', t.profileSettingsButtons[5]], ['channelSettings', t.profileSettingsButtons[6]], ['profileVisibility', t.profileSettingsButtons[7]],
      ['profileSettings', t.settingsButtons[0]], ['favoriteSettings', t.settingsButtons[1]],
      ['connectionSettings', t.settingsButtons[2]], ['rewardSettings', t.adminButtons[6]],
      ['adminManagement', t.adminButtons[0]], ['channels', t.adminButtons[1]], ['broadcast', t.adminButtons[2]],
      ['userSettings', t.adminButtons[3]], ['usersList', t.adminButtons[4]], ['rewardSettings', t.adminButtons[6]], ['connectionAdminSettings', t.adminButtons[7]], ['gameAdminSettings', t.adminButtons[8]], ['leaderboards', t.adminButtons[9]],
      ['adminAdd', t.adminManagementButtons[0]], ['adminRemove', t.adminManagementButtons[1]],
      ['adminsList', t.adminManagementButtons[2]], ['cancel', t.cancel], ['skip', t.skip],
      ['photoSet', t.photoSettingsButtons[0]], ['photoRemove', t.photoSettingsButtons[1]],
      ['channelSet', t.channelSettingsButtons[0]], ['channelRemoveProfile', t.channelSettingsButtons[1]],
      ['favoritesList', t.favoriteSettingsButtons[0]]
    ];
    const backLabels = [t.settingsButtons[3], t.profileSettingsButtons[8], t.photoSettingsButtons[2],
      t.channelSettingsButtons[2], t.favoriteSettingsButtons[1], t.adminManagementButtons[3]];
    for (const label of backLabels) if (label === input) return 'back';
    for (const pair of pairs) if (pair[1] === input) return pair[0];
  }
  return null;
}
async function sendPrompt(chatId, text, markup, user, parseMode) {
  await ensureInlinePromptTracking();
  if (user) {
    const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users)
      .where(eq(users.telegram_id, Number(user.telegram_id))).get();
    user.last_prompt_id = Number(latest && latest.last_prompt_id || 0);
  }
  if (user && Number(user.last_prompt_id) > 0) {
    await safeDelete(chatId, Number(user.last_prompt_id));
  }
  const sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: markup, ...(parseMode ? { parse_mode: parseMode } : {}) });
  if (user) {
    const inlineId = markup && Array.isArray(markup.inline_keyboard) && sent && sent.message_id ? sent.message_id : 0;
    await db.update(users).set({ last_prompt_id: inlineId }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = inlineId;
  }
  return sent;
}
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
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function rankingName(row) {
  return [row.name || row.first_name || row.username || 'کارن', row.surname || ''].filter(Boolean).join(' ');
}
async function topReferralText(allUsers) {
  const top = allUsers.slice().sort((a, b) => Number(b.referral_count || 0) - Number(a.referral_count || 0)).filter(row => Number(row.referral_count || 0) > 0).slice(0, 5);
  if (!top.length) return 'تر اوسه ریفرل نه شته.';
  return top.map((row, i) => (i + 1) + '. ' + escapeHtml(rankingName(row)) + ' — ریفرلونه: ' + Number(row.referral_count || 0) + ' — ID: <code>' + Number(row.telegram_id) + '</code>').join('\n');
}
async function showStats(chatId, user) {
  const t = tx(user), allUsers = await db.select().from(users).all();
  const cutoff = Date.now() - 15 * 60 * 1000;
  const onlineUsers = allUsers.filter(row => row.last_active_at && Date.parse(row.last_active_at) >= cutoff);
  const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(user.telegram_id)));
  const topRefs = await topReferralText(allUsers);
  if (await isAdmin(user.telegram_id)) {
    const text = '📊 د بوټ احصائیې\n━━━━━━━━━━━━━━\n\n👥 ټول کاروونکي: ' + allUsers.length +
      '\n\n🟢 آنلاین کاروونکي: ' + onlineUsers.length + '\n\n🏆 تر ټولو ډېر ریفرل لرونکي ۵ کسان:\n\n' + topRefs;
    await sendPrompt(chatId, text, menuKeyboard(user, true), user, 'HTML');
  } else {
    const text = t.stats + '\n━━━━━━━━━━━━━━\n\n📨 ستا ریفرلونه: ' + Number(user.referral_count || 0) +
      '\n\n❤️ پالو ملګري: ' + favCount + '\n\n⭐ ستوري: ' + Number(user.stars || 0) +
      '\n\n🏆 نمرې: ' + Number(user.points || 0) + '\n\n❤️ لایکونه: ' + Number(user.likes || 0) +
      '\n\n🏆 د بوټ تر ټولو ډېر ریفرل لرونکي ۵ کسان:\n\n' + topRefs;
    await sendPrompt(chatId, text, menuKeyboard(user, false), user, 'HTML');
  }
}
async function showReferral(chatId, user) {
  const t = tx(user);
  const me = await api.getMe();
  const link = 'https://t.me/' + me.username + '?start=' + String(user.telegram_id);
  const rewardStars = await getSetting('referral_reward_stars', 15), rewardPoints = await getSetting('referral_reward_points', 5), rewardLikes = await getSetting('referral_reward_likes', 2);
  const rewardLine = user.language === 'en' ? '\n\n🎁 Reward per successful invite: ⭐ ' + rewardStars + ' stars, 🏆 ' + rewardPoints + ' points, ❤️ ' + rewardLikes + ' likes.' : user.language === 'fa' ? '\n\n🎁 پاداش هر دعوت موفق: ⭐ ' + rewardStars + ' ستاره، 🏆 ' + rewardPoints + ' امتیاز، ❤️ ' + rewardLikes + ' لایک.' : user.language === 'ur' ? '\n\n🎁 ہر کامیاب دعوت کا انعام: ⭐ ' + rewardStars + ' ستارے، 🏆 ' + rewardPoints + ' پوائنٹس، ❤️ ' + rewardLikes + ' لائکس۔' : user.language === 'ar' ? '\n\n🎁 مكافأة كل دعوة ناجحة: ⭐ ' + rewardStars + ' نجوم، 🏆 ' + rewardPoints + ' نقاط، ❤️ ' + rewardLikes + ' إعجابات.' : '\n\n🎁 د هر بریالي دعوت جایزه: ⭐ ' + rewardStars + ' ستوري، 🏆 ' + rewardPoints + ' نمرې، ❤️ ' + rewardLikes + ' لایکونه.';
  const shareText = t.referralText + rewardLine + '\n\n🔗 ' + link;
  const share = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
  await sendPrompt(chatId, t.referralTitle + '\n\n' + t.referralText + rewardLine + '\n\n🔗 ' + link,
    { inline_keyboard: [[{ text: t.share, url: share }]] }, user);
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

async function hasBlockEitherWay(firstId, secondId) {
  const rows = await db.select().from(user_blocks).all();
  return rows.some(row => (Number(row.blocker_telegram_id) === Number(firstId) && Number(row.blocked_telegram_id) === Number(secondId)) ||
    (Number(row.blocker_telegram_id) === Number(secondId) && Number(row.blocked_telegram_id) === Number(firstId)));
}
async function activeSessionFor(userId) {
  const rows = await db.select().from(chat_sessions).all();
  return rows.find(row => row.status === 'connected' &&
    (Number(row.first_user_telegram_id) === Number(userId) || Number(row.second_user_telegram_id) === Number(userId))) || null;
}
async function publicProfileText(target, viewerId) {
  const fullName = [target.name || target.first_name || 'کارن', target.surname || ''].filter(Boolean).join(' ');
  const gender = target.gender === 'female' ? 'ښځینه' : target.gender === 'male' ? 'نارینه' : 'نه دی ثبت';
  const followerOnly = target.profile_visibility === 'followers' && !(await isFollowing(viewerId, target.telegram_id));
  if (followerOnly) return '👤 نوم: ' + fullName + '\n\n⚧ جنسیت: ' + gender + '\n\n🔒 د بشپړ پروفایل لیدلو لپاره لومړی دا کارن فالو کړه.';
  const country = COUNTRIES.find(item => item.code === target.country);
  const language = LANGUAGES.find(item => item.code === target.language);
  const favCount = await db.$count(favorites, eq(favorites.user_telegram_id, Number(target.telegram_id)));
  return '👤 نوم: ' + fullName + '\n\n⚧ جنسیت: ' + gender + '\n\n🌍 هېواد: ' + (country ? country.label : '—') +
    '\n\n🎂 عمر: ' + (target.age || '—') + '\n\n🗣️ ژبه: ' + (language ? language.label : target.language || '—') +
    '\n\n📢 عام چینل: ' + (target.channel_username || '—') + '\n\n📨 ریفرلونه: ' + Number(target.referral_count || 0) +
    '\n\n👥 پالو ملګري: ' + favCount + '\n\n🏆 نمرې: ' + Number(target.points || 0) +
    '\n\n❤️ لایکونه: ' + Number(target.likes || 0);
}
function sessionKeyboard(targetId, sessionId, isFollowingTarget, liked) {
  return { inline_keyboard: [
    [{ text: isFollowingTarget ? '❤️ فالو شوی' : '➕ فالو کول', callback_data: 'session:follow:' + targetId + ':' + sessionId },
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
  const targetId = otherSessionUser(session, viewerId);
  const target = await getUser(targetId), viewer = await getUser(viewerId);
  if (!target || !viewer) return;
  const following = await isFollowing(viewerId, targetId);
  const likes = await db.select().from(user_likes).where(eq(user_likes.liker_id, Number(viewerId))).all();
  const liked = likes.some(row => Number(row.liked_id) === targetId);
  const text = '🤝 اړیکه فعاله ده.\n\n' + await publicProfileText(target, viewerId) +
    '\n\n💡 د بل کس د بشپړ پروفایل لپاره، که یې پروفایل یوازې پالو ملګرو ته ښکاري، هغه فالو کړه.';
  await sendPrompt(viewerId, text, sessionKeyboard(targetId, session.id, following, liked), viewer);
}
async function endConnection(session, reason) {
  if (!session || session.status !== 'connected') return;
  const endedAt = new Date().toISOString();
  await db.update(chat_sessions).set({ status: 'ended', ended_at: endedAt, end_reason: reason || 'ended' })
    .where(eq(chat_sessions.id, Number(session.id))).run();
  const firstId = Number(session.first_user_telegram_id), secondId = Number(session.second_user_telegram_id);
  for (const pair of [{ id: firstId, partnerId: secondId }, { id: secondId, partnerId: firstId }]) {
    const user = await getUser(pair.id), partner = await getUser(pair.partnerId);
    if (!user) continue;
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, pair.id)).run();
    const name = partner ? [partner.name || partner.first_name || 'کارن', partner.surname || ''].filter(Boolean).join(' ') : 'کارن';
    const following = await isFollowing(pair.id, pair.partnerId);
    const rows = [
      [{ text: '🚩 راپور کول', callback_data: 'session:report:' + pair.partnerId + ':' + session.id }],
      [{ text: '🗑 د وروستیو ۱۰ دقیقو پیغامونه حذفول', callback_data: 'session:delete_recent:' + pair.partnerId + ':' + session.id }]
    ];
    if (!following) rows.unshift([{ text: '➕ ' + name + ' فالو کول', callback_data: 'session:follow:' + pair.partnerId + ':' + session.id }]);
    rows.push([{ text: '🔙 اصلي مېنو', callback_data: 'settings:main' }]);
    try { await sendPrompt(pair.id, '🛑 اړیکه پای ته ورسېده.\n\n👤 د تېر ملګري نوم: ' + name + '\n\nکه اړتیا وي، راپور یې کړه، فالو یې کړه یا د هغه له خوا درلېږل شوي د وروستیو ۱۰ دقیقو پیغامونه حذف کړه.', { inline_keyboard: rows }, user); }
    catch (e) { try { await api.sendMessage({ chat_id: pair.id, text: '🛑 اړیکه پای ته ورسېده. ملګری: ' + name }); } catch (ignored) {} }
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
    try { await sendPrompt(id, '⌛ ستا پخوانی عمل د وخت د تېرېدو له امله لغوه شو. دا پیغام یوازې د لغوه کولو لپاره و؛ اوس بیا هڅه کولای شې.', menuKeyboard(user, await isAdmin(id)), user); }
    catch (e) { try { await api.sendMessage({ chat_id: id, text: '⌛ ستا پخوانی عمل د وخت د تېرېدو له امله لغوه شو. بیا هڅه وکړه.' }); } catch (ignored) {} }
  }
  return expired;
}
async function tryOfferSearches() {
  const allRequests = await db.select().from(connection_requests).all();
  const allUsers = await db.select().from(users).all();
  const allSessions = await db.select().from(chat_sessions).all();
  const allBlocks = await db.select().from(user_blocks).all();
  const allFavorites = await db.select().from(favorites).all();
  const now = Date.now(), waitSeconds = Math.max(1, Number(await getSetting('connection_search_seconds', 120)) || 120);
  const searches = allRequests.filter(row => row.status === 'searching' && !row.recipient_id);
  for (const search of searches) {
    const age = now - Date.parse(search.created_at || '');
    if (!Number.isFinite(age) || age >= waitSeconds * 1000) continue;
    if (allRequests.some(row => Number(row.requester_id) === Number(search.requester_id) && row.status === 'pending' && row.recipient_id &&
      Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < waitSeconds * 1000) ||
        allRequests.some(row => Number(row.recipient_id) === Number(search.requester_id) && row.status === 'pending' &&
      Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < waitSeconds * 1000)) continue;
    const requester = allUsers.find(row => Number(row.telegram_id) === Number(search.requester_id));
    if (!requester || Number(requester.is_blocked) === 1) continue;
    const alreadyTried = new Set(allRequests.filter(row => Number(row.requester_id) === Number(search.requester_id) && row.recipient_id && Number(row.id) > Number(search.id))
      .map(row => Number(row.recipient_id)));
    const candidates = allUsers.filter(candidate => {
      const candidateId = Number(candidate.telegram_id);
      if (candidateId === Number(search.requester_id) || Number(candidate.is_blocked) === 1) return false;
      if (!candidate.country || !candidate.gender || !candidate.age) return false;
      const active = Date.parse(candidate.last_active_at || '');
      if (!Number.isFinite(active) || now - active > 120000) return false;
      if (alreadyTried.has(candidateId)) return false;
      if (allBlocks.some(row => (Number(row.blocker_telegram_id) === candidateId && Number(row.blocked_telegram_id) === Number(search.requester_id)) ||
        (Number(row.blocker_telegram_id) === Number(search.requester_id) && Number(row.blocked_telegram_id) === candidateId))) return false;
      if (candidate.connection_request_mode === 'none') return false;
      const connected = allSessions.some(row => row.status === 'connected' &&
        (Number(row.first_user_telegram_id) === candidateId || Number(row.second_user_telegram_id) === candidateId));
      if (connected && candidate.connection_request_mode !== 'all') return false;
      const pendingForCandidate = allRequests.some(row => Number(row.recipient_id) === candidateId && row.status === 'pending' && Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < waitSeconds * 1000);
      if (pendingForCandidate) return false;
      if (candidate.connection_request_mode === 'followed' &&
        !allFavorites.some(row => Number(row.user_telegram_id) === candidateId && Number(row.favorite_telegram_id) === Number(search.requester_id))) return false;
      if (search.request_type === 'find' && search.gender_filter !== 'auto' && candidate.gender !== search.gender_filter) return false;
      if (search.request_type === 'find' && search.language_filter !== 'auto' && candidate.language !== search.language_filter) return false;
      return true;
    });
    if (!candidates.length) continue;
    candidates.sort((a, b) => {
      const aConnected = allSessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === Number(a.telegram_id) || Number(row.second_user_telegram_id) === Number(a.telegram_id)));
      const bConnected = allSessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === Number(b.telegram_id) || Number(row.second_user_telegram_id) === Number(b.telegram_id)));
      const aFollowed = allFavorites.some(row => Number(row.user_telegram_id) === Number(search.requester_id) && Number(row.favorite_telegram_id) === Number(a.telegram_id));
      const bFollowed = allFavorites.some(row => Number(row.user_telegram_id) === Number(search.requester_id) && Number(row.favorite_telegram_id) === Number(b.telegram_id));
      const rank = item => allSessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === Number(item.telegram_id) || Number(row.second_user_telegram_id) === Number(item.telegram_id))) ? 1 :
        allFavorites.some(row => Number(row.user_telegram_id) === Number(search.requester_id) && Number(row.favorite_telegram_id) === Number(item.telegram_id)) ? 2 : 0;
      return rank(a) - rank(b) || Date.parse(b.last_active_at || '') - Date.parse(a.last_active_at || '');
    });
    const candidate = candidates[0];
    const claimAt = new Date().toISOString();
    const claim = await db.update(connection_requests).set({ status: 'matching', updated_at: claimAt })
      .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'searching')))
      .returning({ id: connection_requests.id }).run();
    if (!claim || !Array.isArray(claim.rows) || claim.rows.length === 0) continue;
    let offer;
    try {
      const nowIso = new Date().toISOString();
      const inserted = await db.insert(connection_requests).values({
        requester_id: Number(search.requester_id), recipient_id: Number(candidate.telegram_id), status: 'pending',
        request_type: search.request_type, gender_filter: search.gender_filter, language_filter: search.language_filter,
        created_at: nowIso, updated_at: nowIso
      }).returning().run();
      offer = inserted && Array.isArray(inserted.rows) ? inserted.rows[0] : null;
      if (!offer) throw new Error('Connection offer insert returned no row');
      const released = await db.update(connection_requests).set({ status: 'searching', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'matching'), eq(connection_requests.updated_at, claimAt)))
        .returning({ id: connection_requests.id }).run();
      if (!released || !Array.isArray(released.rows) || released.rows.length === 0) {
        await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, Number(offer.id))).run();
        console.error('Could not release claimed connection search', { searchId: search.id, offerId: offer.id });
        continue;
      }
      allRequests.push(offer);
    } catch (error) {
      try {
        await db.update(connection_requests).set({ status: 'searching', updated_at: new Date().toISOString() })
          .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'matching'), eq(connection_requests.updated_at, claimAt)))
          .run();
      } catch (releaseError) {
        console.error('Failed to release connection search after offer creation error', { searchId: search.id, error: releaseError });
      }
      console.error('Failed to create connection offer', { searchId: search.id, requesterId: search.requester_id, candidateId: candidate.telegram_id, error });
      continue;
    }
    try {
      await api.sendMessage({ chat_id: Number(candidate.telegram_id),
        text: '🎲 یو ناڅاپي کس غواړي له تا سره اړیکه پیل کړي.\n\nته د غوښتونکي نوم، عکس، جنسیت او نور معلومات نه وینې. که غوښتنه ومنې، اړیکه به وصل شي؛ که رد یې کړې، بل کس ته به غوښتنه واستول شي.',
        reply_markup: { inline_keyboard: [[{ text: '✅ غوښتنه منل', callback_data: 'conn:accept:' + offer.id }, { text: '❌ ردول', callback_data: 'conn:reject:' + offer.id }]] }
      });
    } catch (error) {
      console.error('Failed to send connection offer to candidate', { searchId: search.id, offerId: offer.id, candidateId: candidate.telegram_id, error });
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(offer.id)), eq(connection_requests.status, 'pending'))).run();
    }
  }
}
async function beginConnectionSearch(chatId, user, type) {
  const cost = Number(await getSetting('connection_cost_stars', 1));
  if (Number(user.stars || 0) < cost) {
    await sendPrompt(chatId, '⭐ د اړیکې غوښتنې لپاره لږ تر لږه ' + cost + ' ستوري پکار دي.\n\nستا اوسنی بیلانس: ' + Number(user.stars || 0), menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  const current = await activeSessionFor(user.telegram_id);
  if (current) {
    await sendPrompt(chatId, '⚠️ ته اوس له یوه کس سره په اړیکه کې یې. لومړی اړیکه پای ته ورسوه.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  const requests = await db.select().from(connection_requests).where(eq(connection_requests.requester_id, Number(user.telegram_id))).all();
  if (requests.some(row => ['searching', 'matching'].includes(row.status) && !row.recipient_id)) {
    await sendPrompt(chatId, '🔎 د ملګري لټون لا روان دی. مهرباني وکړه لږ انتظار وکړه.', { inline_keyboard: [[{ text: '❌ لټون لغوه کول', callback_data: 'conn:cancel_search' }]] }, user);
    return;
  }
  const now = new Date().toISOString();
  await db.insert(connection_requests).values({
    requester_id: Number(user.telegram_id), recipient_id: null, status: 'searching', request_type: type,
    gender_filter: type === 'find' ? (user.search_gender || 'auto') : 'auto',
    language_filter: type === 'find' ? (user.search_language || 'auto') : 'auto',
    created_at: now, updated_at: now
  }).run();
  const all = await db.select().from(connection_requests).all();
  const search = all.filter(row => Number(row.requester_id) === Number(user.telegram_id) && row.status === 'searching' && !row.recipient_id)
    .sort((a,b) => Number(b.id)-Number(a.id))[0];
  user.state = 'searching_connection';
  await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
  await sendPrompt(chatId, '🔎 د ملګري لټون پیل شو.\n\n⏳ د مناسب کس لټون تر ۲ دقیقو دوام کوي. که وخت تېر شي، د ستا راتلونکي پیغام یا تڼۍ پر مهال به لټون لغوه شي.\n\n⭐ د اړیکې منلو پر مهال به له تا ' + cost + ' ستوری کم شي.', { inline_keyboard: [[{ text: '❌ لټون لغوه کول', callback_data: 'conn:cancel_search:' + search.id }]] }, user);
  try { await tryOfferSearches(); } catch (error) { console.error('Connection search matching failed after request creation', { userId: Number(user.telegram_id), type: type, error: error }); }
}
async function relayConnectionMessage(message, session) {
  const senderId = Number(message.from.id), recipientId = otherSessionUser(session, senderId);
  const idleMinutes = Number(await getSetting('connection_idle_minutes', 5));
  const maxMinutes = Number(await getSetting('connection_max_minutes', 40));
  const now = Date.now(), last = Date.parse(session.last_activity_at || session.connected_at || session.created_at || ''), start = Date.parse(session.connected_at || session.created_at || '');
  if ((Number.isFinite(last) && now - last >= idleMinutes * 60000) || (Number.isFinite(start) && now - start >= maxMinutes * 60000)) {
    await endConnection(session, 'timeout');
    return;
  }
  try {
    const copied = await api.copyMessage({ chat_id: recipientId, from_chat_id: senderId, message_id: Number(message.message_id) });
    if (copied && copied.message_id) {
      await db.insert(chat_messages).values({ session_id: Number(session.id), sender_id: senderId, recipient_id: recipientId,
        recipient_message_id: Number(copied.message_id), created_at: new Date().toISOString() }).run();
    }
    await db.update(chat_sessions).set({ last_activity_at: new Date().toISOString() }).where(eq(chat_sessions.id, Number(session.id))).run();
  } catch (error) {
    try { await api.sendMessage({ chat_id: senderId, text: '⚠️ دا پیغام بل ملګري ته ونه لېږل شو. بل ډول پیغام واستوه.' }); } catch (e) {}
  }
}
async function startDiceGame(chatId, user) {
  const minStars = Number(await getSetting('game_min_stars', 3.5));
  if (Number(user.stars || 0) < minStars) {
    await sendPrompt(chatId, '🎲 د ګېم لپاره لږ تر لږه ' + minStars + ' ستوري پکار دي.\n\nستا بیلانس: ' + Number(user.stars || 0), menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  const rows = await db.select().from(game_sessions).all();
  if (rows.some(row => row.status === 'settlement_error' &&
      (Number(row.player_id) === Number(user.telegram_id) || Number(row.opponent_id) === Number(user.telegram_id)))) {
    await sendPrompt(chatId, '⚠️ ستا په یوه پخواني ګېم کې تخنیکي ستونزه ثبت شوې ده. د فیس او پایلې د کتنې لپاره له اډمین سره اړیکه ونیسه؛ تر هغې نوی ګېم مه پیلوه.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  if (rows.some(row => Number(row.player_id) === Number(user.telegram_id) && ['waiting','pending','playing'].includes(row.status)) ||
      rows.some(row => Number(row.opponent_id) === Number(user.telegram_id) && ['pending','playing'].includes(row.status))) {
    await sendPrompt(chatId, '🎲 ستا د ګېم غوښتنه لا روانه ده.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  const now = new Date().toISOString();
  await db.insert(game_sessions).values({ player_id: Number(user.telegram_id), opponent_id: null, status: 'waiting',
    created_at: now, updated_at: now, fee_stars: Number(await getSetting('game_fee_stars', 0.5)),
    win_stars: Number(await getSetting('game_win_stars', 3)), bot_loss_total_stars: Number(await getSetting('game_bot_loss_total_stars', 3.5)),
    points_award: Number(await getSetting('game_win_points', 1)) }).run();
  await sendPrompt(chatId, '🎲 د ګېم سیال لټول کېږي.\n\n⏳ که په ټاکلي وخت کې سیال پیدا نه شي، ستا راتلونکی پیغام به دا ګېم لغوه کړي؛ فیس به نه اخیستل کېږي.', { inline_keyboard: [[{ text: '❌ ګېم لغوه کول', callback_data: 'game:cancel' }]] }, user);
  await tryMatchGames();
}
async function resolveBotGame(game) {
  const player = await getUser(game.player_id);
  if (!player || game.status !== 'waiting') return;
  const fee = Number(await getSetting('game_fee_stars', 0.5));
  const winStars = Number(await getSetting('game_win_stars', 3));
  const botLossTotal = Number(await getSetting('game_bot_loss_total_stars', 3.5));
  const points = Number(await getSetting('game_win_points', 1));
  const balance = Number(player.stars || 0);
  if (balance < fee) {
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() }).where(eq(game_sessions.id, Number(game.id))).run();
    return;
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
  const playerRoll = Number(playerDice && playerDice.dice && playerDice.dice.value || 0);
  const botRoll = Number(botDice && botDice.dice && botDice.dice.value || 0);
  let outcome = '🤝 مساوي! هېڅ ستوري یا نمرې نه ګټل کېږي؛ یوازې د ګېم فیس حساب شو.';
  let newBalance = balance - fee;
  if (playerRoll > botRoll) {
    newBalance += winStars;
    await db.update(users).set({ stars: newBalance, points: Number(player.points || 0) + points }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
    outcome = '🎉 ته وګټلې! +' + winStars + ' ستوري او +' + points + ' نمره.';
  } else if (botRoll > playerRoll) {
    const extraLoss = Math.max(0, botLossTotal - fee);
    const actualLoss = Math.min(extraLoss, newBalance);
    newBalance -= actualLoss;
    await db.update(users).set({ stars: newBalance }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
    outcome = '🤖 بوټ وګټله! ستا ټول لګښت ' + (fee + actualLoss) + ' ستوري شو.';
  } else {
    await db.update(users).set({ stars: newBalance }).where(eq(users.telegram_id, Number(player.telegram_id))).run();
  }
  await db.update(game_sessions).set({ status: 'completed', player_roll: playerRoll, opponent_roll: botRoll, updated_at: new Date().toISOString() })
    .where(eq(game_sessions.id, Number(game.id))).run();
  try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '🎲 د ګېم پایله\n\nستا 🎲: ' + playerRoll + '\n\nد بوټ 🎲: ' + botRoll + '\n\n' + outcome + '\n\n⭐ اوسنی بیلانس: ' + newBalance }); } catch (e) {}
}
async function tryMatchGames() {
  const rows = await db.select().from(game_sessions).all(), allUsers = await db.select().from(users).all();
  const allSessions = await db.select().from(chat_sessions).all();
  const waitSeconds = Math.max(1, Number(await getSetting('game_wait_seconds', 120)) || 120);
  const opponentMin = Number(await getSetting('game_opponent_min_stars', 3.5));
  const now = Date.now();
  for (const game of rows.filter(row => row.status === 'waiting' || row.status === 'pending')) {
    const timerStart = game.status === 'pending' ? (game.updated_at || game.created_at) : game.created_at;
    const age = now - Date.parse(timerStart || '');
    if (!Number.isFinite(age) || age >= waitSeconds * 1000) continue;
    if (game.status !== 'waiting') continue;
    const isFreshGame = row => { const start = row.status === 'waiting' ? (row.created_at || row.updated_at) : (row.updated_at || row.created_at); const age = now - Date.parse(start || ''); return Number.isFinite(age) && age < waitSeconds * 1000; };
    const busyGameIds = new Set(rows.filter(row => ['pending','playing'].includes(row.status) && isFreshGame(row)).flatMap(row => [Number(row.player_id), Number(row.opponent_id || 0)]).concat(rows.filter(row => row.status === 'waiting' && isFreshGame(row)).map(row => Number(row.player_id))).concat(rows.filter(row => row.status === 'settlement_error').flatMap(row => [Number(row.player_id), Number(row.opponent_id || 0)])));
    const candidates = allUsers.filter(candidate => {
      const id = Number(candidate.telegram_id);
      if (id === Number(game.player_id) || id === Number(game.opponent_id || 0) || Number(candidate.is_blocked) === 1 || Number(candidate.stars || 0) < opponentMin) return false;
      const last = Date.parse(candidate.last_active_at || '');
      if (!Number.isFinite(last) || now - last > 120000) return false;
      if (busyGameIds.has(id)) return false;
      if (allSessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === id || Number(row.second_user_telegram_id) === id))) return false;
      return true;
    }).sort((a,b) => Date.parse(b.last_active_at || '') - Date.parse(a.last_active_at || ''));
    if (!candidates.length) continue;
    const candidate = candidates[0];
    const claimed = await db.update(game_sessions)
      .set({ opponent_id: Number(candidate.telegram_id), status: 'pending', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'waiting')))
      .returning({ id: game_sessions.id }).run();
    if (!claimed || !Array.isArray(claimed.rows) || claimed.rows.length === 0) continue;
    game.status = 'pending'; game.opponent_id = Number(candidate.telegram_id);
    try {
      await api.sendMessage({ chat_id: Number(candidate.telegram_id), text: '🎲 یو فعال کارن غواړي له تا سره د ګېم لوبه وکړي.\\n\\nد لوبې د منلو لپاره باید لږ تر لږه ' + opponentMin + ' ستوري ولرې. د منلو یا ردولو انتخاب وکړه.',
        reply_markup: { inline_keyboard: [[{ text: '✅ ګېم منل', callback_data: 'game:accept:' + game.id }, { text: '❌ ردول', callback_data: 'game:reject:' + game.id }]] } });
    } catch (e) {
      await db.update(game_sessions).set({ status: 'waiting', opponent_id: null, updated_at: new Date().toISOString() })
        .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'pending'), eq(game_sessions.opponent_id, Number(candidate.telegram_id)))).run();
    }
  }
}
async function renderAdminRewardSettings(chatId, user) {
  const keys = [
    ['welcome_reward_stars','⭐ د ښه راغلاست ستوري',10], ['welcome_reward_points','🏆 د ښه راغلاست نمرې',3], ['welcome_reward_likes','❤️ د ښه راغلاست لایکونه',2],
    ['referral_reward_stars','⭐ د ریفرل ستوري',15], ['referral_reward_points','🏆 د ریفرل نمرې',5], ['referral_reward_likes','❤️ د ریفرل لایکونه',2]
  ];
  let text = '🎁 د جایزو تنظیمات\n\nهره جایزه جلا بدله کړه:\n\n';
  const rows = [];
  for (const item of keys) {
    text += item[1] + ': ' + await getSetting(item[0], item[2]) + '\n\n';
    rows.push([{ text: item[1], callback_data: 'admin:setting:' + item[0] }]);
  }
  rows.push([{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, user);
}
async function renderAdminConnectionSettings(chatId, user) {
  const keys = [
    ['connection_search_seconds','⏱ د ملګري لټون ثانیې',120], ['connection_idle_minutes','💤 د بې‌پیغامۍ دقیقې',5],
    ['connection_max_minutes','⌛ د اړیکې اعظمي دقیقې',40], ['connection_cost_stars','⭐ د اړیکې قیمت',1]
  ];
  let text = '🔗 د اړیکو تنظیمات\n\n';
  const rows = [];
  for (const item of keys) { text += item[1] + ': ' + await getSetting(item[0], item[2]) + '\n\n'; rows.push([{ text: item[1], callback_data: 'admin:setting:' + item[0] }]); }
  rows.push([{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, user);
}
async function renderAdminGameSettings(chatId, user) {
  const keys = [
    ['game_min_stars','⭐ د لوبې لږ تر لږه بیلانس',3.5], ['game_opponent_min_stars','👤 د سیال لږ تر لږه بیلانس',3.5],
    ['game_fee_stars','💰 د لوبې فیس',0.5], ['game_win_stars','🏆 د ګټلو ستوري',3],
    ['game_bot_loss_total_stars','🤖 د بوټ پر وړاندې د بایللو ټول لګښت',3.5], ['game_win_points','⭐ د ګټلو نمرې',1],
    ['game_wait_seconds','⏱ د سیال انتظار ثانیې',120]
  ];
  let text = '🎲 د ګېم تنظیمات\n\n';
  const rows = [];
  for (const item of keys) { text += item[1] + ': ' + await getSetting(item[0], item[2]) + '\n\n'; rows.push([{ text: item[1], callback_data: 'admin:setting:' + item[0] }]); }
  rows.push([{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, user);
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
        const rewardText = '🎉 یو کس ستا د دعوتي لینک له لارې بوټ ته راغی!\n\nستا د ریفرل جایزه:\n⭐ ' + rewardStars + ' ستوري\n\n🏆 ' + rewardPoints + ' نمرې\n\n❤️ ' + rewardLikes + ' لایکونه';
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
  if (Number(user.welcome_reward_claimed || 0) !== 1) {
    const welcomeStars = Number(await getSetting('welcome_reward_stars', 10));
    const welcomePoints = Number(await getSetting('welcome_reward_points', 3));
    const welcomeLikes = Number(await getSetting('welcome_reward_likes', 2));
    await db.update(users).set({ stars: Number(user.stars || 0) + welcomeStars, points: Number(user.points || 0) + welcomePoints, likes: Number(user.likes || 0) + welcomeLikes, welcome_reward_claimed: 1 }).where(eq(users.telegram_id, id)).run();
    user.stars = Number(user.stars || 0) + welcomeStars; user.points = Number(user.points || 0) + welcomePoints; user.likes = Number(user.likes || 0) + welcomeLikes; user.welcome_reward_claimed = 1;
    const welcomeText = user.language === 'en'
      ? '🎉 Welcome! Your welcome reward has been added to your account.\n\n⭐ Stars: ' + welcomeStars + '\n🏆 Points: ' + welcomePoints + '\n❤️ Likes: ' + welcomeLikes
      : user.language === 'fa'
        ? '🎉 خوش آمدید! جایزه خوش‌آمدگویی به حساب شما اضافه شد.\n\n⭐ ستاره: ' + welcomeStars + '\n🏆 امتیاز: ' + welcomePoints + '\n❤️ لایک: ' + welcomeLikes
        : user.language === 'ur'
          ? '🎉 خوش آمدید! آپ کا استقبالی انعام آپ کے اکاؤنٹ میں شامل کر دیا گیا ہے۔\n\n⭐ ستارے: ' + welcomeStars + '\n🏆 پوائنٹس: ' + welcomePoints + '\n❤️ لائکس: ' + welcomeLikes
          : user.language === 'ar'
            ? '🎉 أهلاً بك! أُضيفت مكافأة الترحيب إلى حسابك.\n\n⭐ النجوم: ' + welcomeStars + '\n🏆 النقاط: ' + welcomePoints + '\n❤️ الإعجابات: ' + welcomeLikes
            : '🎉 ښه راغلاست! ستا د ښه راغلاست جایزه ستا حساب ته اضافه شوه.\n\n⭐ ستوري: ' + welcomeStars + '\n🏆 نمرې: ' + welcomePoints + '\n❤️ لایکونه: ' + welcomeLikes;
    try { await api.sendMessage({ chat_id: chatId, text: welcomeText }); } catch (e) { console.error('Welcome reward notification failed', e); }
  }
  try { await expireUserTimedActions(id); } catch (e) { console.error('User timed-action check failed', e); }
  try { await tryOfferSearches(); } catch (e) { console.error('Connection matching check failed', e); }
  try { await tryMatchGames(); } catch (e) { console.error('Game matching check failed', e); }
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
    else if (user.state === 'admin_menu' || user.state.startsWith('waiting_') || user.state.startsWith('admin_edit_user_') || user.state.startsWith('admin_adjust_balance:') || user.state.startsWith('admin_send_user_message:') || user.state.startsWith('admin_set_referral_reward:') || user.state.startsWith('admin_set_setting:')) {
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
  const adminSettingMatch = String(user.state || '').match(/^admin_set_setting:([a-z_]+)$/);
  if (adminSettingMatch) {
    const key = adminSettingMatch[1], value = Number(input);
    const allowed = ['welcome_reward_stars','welcome_reward_points','welcome_reward_likes','referral_reward_stars','referral_reward_points','referral_reward_likes','connection_search_seconds','connection_idle_minutes','connection_max_minutes','connection_cost_stars','game_min_stars','game_opponent_min_stars','game_fee_stars','game_win_stars','game_bot_loss_total_stars','game_win_points','game_wait_seconds'];
    if (!(await isAdmin(id))) { await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run(); user.state = 'ready'; await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user); return; }
    if (!allowed.includes(key) || !Number.isFinite(value) || value < 0 || value > 1000000 || ((key.startsWith('welcome_reward_') || key.startsWith('referral_reward_') || key.includes('seconds') || key.includes('minutes') || key === 'game_win_points') && !Number.isInteger(value))) { await sendPrompt(chatId, '⚠️ معتبر عدد ولیکه. د ستورو فیس اعشاري کېدای شي، لکه 0.5.', { force_reply: true }, user); return; }
    await setSetting(key, value);
    user.state = 'admin_menu'; await db.update(users).set({ state: 'admin_menu' }).where(eq(users.telegram_id, id)).run();
    if (key.startsWith('welcome_reward_') || key.startsWith('referral_reward_')) await renderAdminRewardSettings(chatId, user);
    else if (key.startsWith('connection_')) await renderAdminConnectionSettings(chatId, user);
    else await renderAdminGameSettings(chatId, user);
    return;
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

  const sessionForRelay = await activeSessionFor(id);
  if (sessionForRelay && action === null && !start) { await relayConnectionMessage(message, sessionForRelay); return; }

  if (user.state === 'settings_menu') {
    if (action === 'profileSettings') { user.state = 'profile_settings_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).profileSettingsTitle, profileSettingsKeyboard(user), user); return; }
    if (action === 'photoSettings') { user.state = 'settings_photo_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, (user.profile_photo_id ? '✅ ' : '➖ ') + (user.language === 'en' ? 'Profile photo settings:' : user.language === 'fa' ? 'تنظیمات عکس پروفایل:' : user.language === 'ur' ? 'پروفائل تصویر کی ترتیبات:' : user.language === 'ar' ? 'إعدادات صورة الملف الشخصي:' : 'د پروفایل عکس تنظیمات:'), photoSettingsKeyboard(user), user); return; }
    if (action === 'channelSettings') { user.state = 'settings_channel_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, (user.channel_username ? user.channel_username + '\n' : '➖ ') + (user.language === 'en' ? 'Public channel settings:' : user.language === 'fa' ? 'تنظیمات کانال عمومی:' : user.language === 'ur' ? 'عوامی چینل کی ترتیبات:' : user.language === 'ar' ? 'إعدادات القناة العامة:' : 'د عام چینل تنظیمات:'), channelSettingsKeyboard(user), user); return; }
    if (action === 'favoriteSettings') { user.state = 'settings_favorites_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, user.language === 'en' ? '❤️ Manage favorite friends:' : user.language === 'fa' ? '❤️ مدیریت دوستان محبوب:' : user.language === 'ur' ? '❤️ پسندیدہ دوستوں کا انتظام:' : user.language === 'ar' ? '❤️ إدارة الأصدقاء المفضلين:' : '❤️ د پالو ملګرو تنظیمات:', favoriteSettingsKeyboard(user), user); return; }
    if (action === 'connectionSettings') { await sendPrompt(chatId, '🔔 د اړیکې پر مهال د نوو غوښتنو ډول وټاکه:', { inline_keyboard: [[{ text: '🌐 د ټولو کسانو غوښتنې', callback_data: 'settings:connection:all' }], [{ text: '❤️ یوازې د پالو ملګرو غوښتنې', callback_data: 'settings:connection:followed' }], [{ text: '🔕 هېڅ غوښتنه نه', callback_data: 'settings:connection:none' }], [{ text: '🔙 تنظیمات', callback_data: 'settings:open' }]] }, user); return; }
    await showMain(chatId, user); return;
  }
  if (user.state === 'profile_settings_menu') {
    const i = tx(user).profileSettingsButtons.indexOf(input);
    const field = i >= 0 ? ['country','gender','age','name','surname','photoSettings','channelSettings','profileVisibility','back'][i] : action;
    if (field === 'profileVisibility') { await sendPrompt(chatId, '🔒 د خپل پروفایل د ښکاره کېدو حالت وټاکه:', { inline_keyboard: [[{ text: '🌐 ټولو ته ښکاره', callback_data: 'settings:visibility:everyone' }], [{ text: '❤️ یوازې پالو ملګرو ته', callback_data: 'settings:visibility:followers' }], [{ text: '🔙 بېرته', callback_data: 'settings:open' }]] }, user); return; }
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
    const field = i >= 0 ? ['adminManagement','channels','broadcast','userSettings','usersList','back','rewardSettings','connectionAdminSettings','gameAdminSettings','leaderboards'][i] : action;
    if (field === 'rewardSettings') { await renderAdminRewardSettings(chatId, user); return; }
    if (field === 'connectionAdminSettings') { await renderAdminConnectionSettings(chatId, user); return; }
    if (field === 'gameAdminSettings') { await renderAdminGameSettings(chatId, user); return; }
    if (field === 'leaderboards') { await sendPrompt(chatId, '🏆 لوړ رتبه کسان\n\nلاندې درجه‌بندي وټاکه:', { inline_keyboard: [[{ text: '🏆 تر ټولو ډېرې نمرې', callback_data: 'admin:rank:points' }], [{ text: '📨 تر ټولو ډېر ریفرلونه', callback_data: 'admin:rank:referrals' }], [{ text: '👥 تر ټولو ډېر فالو', callback_data: 'admin:rank:follows' }], [{ text: '❤️ تر ټولو ډېر لایکونه', callback_data: 'admin:rank:likes' }], [{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]] }, user); return; }
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

  if (user.state === 'ready') {
    const session = await activeSessionFor(id);
    const quickAction = actionFor(input);
    const allowedDuringChat = ['find','favorites','random','invite','profile','language','settings','stats','admin','game','leaderboards'];
    if (session && !allowedDuringChat.includes(quickAction) && !start) { await relayConnectionMessage(message, session); return; }
  }
  if (!['ready','searching_connection'].includes(user.state)) { await showLanguage(chatId, user); return; }
  if (user.state === 'searching_connection' && !['/start'].includes(input)) {
    const quickAction = actionFor(input);
    if (!['settings','profile','stats','invite','favorites','language','admin','game','leaderboards','find','random'].includes(quickAction)) return;
  }
  const m = tx(user).menu;
  const i = m.indexOf(input);
  const field = i >= 0 ? ['find', 'favorites', 'random', 'invite', 'profile', 'language', 'settings', 'stats', 'admin', 'game', 'leaderboards'][i] : action;
  if (field === 'find') await sendPrompt(chatId, '🔎 کوم ډول ملګری غواړې؟', { inline_keyboard: [[{ text: '👨 نارینه', callback_data: 'find:gender:male' }, { text: '👩 ښځینه', callback_data: 'find:gender:female' }], [{ text: '🌐 اتومات', callback_data: 'find:gender:auto' }], [{ text: '❌ لغوه', callback_data: 'find:cancel' }]] }, user);
  else if (field === 'random') {
    const cost = Number(await getSetting('connection_cost_stars', 1));
    if (Number(user.stars || 0) < cost) await sendPrompt(chatId, '⭐ د ناڅاپي اړیکې لپاره لږ تر لږه ' + cost + ' ستوري پکار دي. ستا بیلانس: ' + Number(user.stars || 0), menuKeyboard(user, await isAdmin(id)), user);
    else await sendPrompt(chatId, '🎲 ناڅاپي اړیکه پیل کړو؟\n\nد غوښتنې د منلو پر مهال به ' + cost + ' ستوری کم شي.\n\nغواړې غوښتنه واستوې؟', { inline_keyboard: [[{ text: '✅ تایید او غوښتنه واستوه', callback_data: 'conn:confirm:random' }, { text: '❌ لغوه', callback_data: 'conn:cancel' }]] }, user);
  }
  else if (field === 'game') await startDiceGame(chatId, user);
  else if (field === 'leaderboards') await sendPrompt(chatId, '🏆 لوړ رتبه کسان\n\nلاندې درجه‌بندي وټاکه:', { inline_keyboard: [[{ text: '🏆 تر ټولو ډېرې نمرې', callback_data: 'admin:rank:points' }], [{ text: '📨 تر ټولو ډېر ریفرلونه', callback_data: 'admin:rank:referrals' }], [{ text: '👥 تر ټولو ډېر فالو', callback_data: 'admin:rank:follows' }], [{ text: '❤️ تر ټولو ډېر لایکونه', callback_data: 'admin:rank:likes' }], [{ text: '🔙 اصلي مېنو', callback_data: 'admin:main' }]] }, user);
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