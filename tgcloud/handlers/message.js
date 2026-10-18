import { api, db } from 'sdk';
import { and, eq } from 'sdk/db';
import { users, admins, required_chats, app_settings, favorites, chat_sessions, connection_requests, chat_messages, game_sessions, user_blocks, user_likes, user_ratings } from '../schema.js';
import { activeSessionFor, ROOT_ADMINS, LANGUAGES, COUNTRIES, AGES, languageKeyboard, countryKeyboard, ensureInlinePromptTracking, requiredChatInfo, listWords, isFollowing, otherSessionUser, getUser, safeDelete, isAdmin, styleKeyboardMarkup, notifyRuntimeError, reportDiagnostic, getSetting as sharedGetSetting } from '../lib/shared.js';
import { T } from '../lib/message-text.js';



async function getSetting(key, fallback) {
  return sharedGetSetting(key, fallback);
}

// ── Keyboard builders and localized UI ──
function tx(user) { return T[user && T[user.language] ? user.language : 'ps']; }

function keyboard(rows, extra) {
  const result = { keyboard: rows, resize_keyboard: true };
  if (extra) Object.assign(result, extra);
  return result;
}
function menuKeyboard(user, admin) {
  const m = tx(user).menu;
  const rows = [
    [{ text: m[0] }, { text: m[4] }],
    [{ text: m[2] }, { text: m[3] }],
    [{ text: m[6] }, { text: m[5] }],
    [{ text: m[9] }, { text: m[7] }],
    [{ text: m[10] }]
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
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }]]);
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
  return keyboard([[{ text: b[0] }], [{ text: b[1] }, { text: b[2] }], [{ text: b[3] }, { text: b[4] }], [{ text: b[6] }], [{ text: b[7] }, { text: b[8] }], [{ text: b[5] }]]);
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
  return keyboard([[{ text: b[0] }], [{ text: b[1] }, { text: b[2] }]]);
}
function actionFor(input) {
  for (const lang of Object.keys(T)) {
    const t = T[lang], m = t.menu;
    const pairs = [
      ['find', m[0]], ['random', m[2]], ['invite', m[3]], ['profile', m[4]],
      ['language', m[5]], ['settings', m[6]], ['stats', m[7]], ['admin', m[8]], ['game', m[9]], ['leaderboards', m[10]], ['joined', t.joined],
      ['country', t.profileSettingsButtons[0]], ['gender', t.profileSettingsButtons[1]], ['age', t.profileSettingsButtons[2]],
      ['name', t.profileSettingsButtons[3]], ['surname', t.profileSettingsButtons[4]],
      ['photoSettings', t.profileSettingsButtons[5]], ['channelSettings', t.profileSettingsButtons[6]], ['profileVisibility', t.profileSettingsButtons[7]],
      ['profileSettings', t.settingsButtons[0]], ['favoriteSettings', t.settingsButtons[1]],
      ['rewardSettings', t.adminButtons[6]],
      ['adminManagement', t.adminButtons[0]], ['channels', t.adminButtons[1]], ['broadcast', t.adminButtons[2]],
      ['userSettings', t.adminButtons[3]], ['usersList', t.adminButtons[4]], ['rewardSettings', t.adminButtons[6]], ['connectionAdminSettings', t.adminButtons[7]], ['gameAdminSettings', t.adminButtons[8]],
      ['publicChannel', t.channelTypeButtons[0]], ['privateChannel', t.channelTypeButtons[1]],
      ['adminAdd', t.adminManagementButtons[0]], ['adminRemove', t.adminManagementButtons[1]],
      ['adminsList', t.adminManagementButtons[2]], ['cancel', t.cancel], ['skip', t.skip],
      ['photoSet', t.photoSettingsButtons[0]], ['photoRemove', t.photoSettingsButtons[1]],
      ['channelSet', t.channelSettingsButtons[0]], ['channelRemoveProfile', t.channelSettingsButtons[1]],
      ['favoritesList', t.favoriteSettingsButtons[0]]
    ];
    const backLabels = [t.settingsButtons[2], t.profileSettingsButtons[8], t.photoSettingsButtons[2],
      t.channelSettingsButtons[2], t.favoriteSettingsButtons[1], t.settingsButtons[2], t.adminManagementButtons[3]];
    for (const label of backLabels) if (label === input) return 'back';
    for (const pair of pairs) if (pair[1] === input) return pair[0];
  }
  return null;
}
// ── Prompt delivery and settings ──
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
  const sent = await api.sendMessage({ chat_id: chatId, text: text, reply_markup: styleKeyboardMarkup(markup), ...(parseMode ? { parse_mode: parseMode } : {}) });
  if (user) {
    const inlineId = markup && Array.isArray(markup.inline_keyboard) && sent && sent.message_id ? sent.message_id : 0;
    await db.update(users).set({ last_prompt_id: inlineId }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = inlineId;
  }
  return sent;
}
async function setSetting(key, value) {
  const storedValue = String(value);
  const old = await db.select().from(app_settings).where(eq(app_settings.setting_key, key)).get();
  if (old) {
    await db.update(app_settings).set({ setting_value: storedValue }).where(eq(app_settings.setting_key, key)).run();
  } else {
    await db.insert(app_settings).values({ setting_key: key, setting_value: storedValue }).run();
  }

  // Read the value back so the admin is not told a setting was saved when
  // the database adapter failed to persist it.
  const saved = await db.select().from(app_settings).where(eq(app_settings.setting_key, key)).get();
  if (!saved || String(saved.setting_value) !== storedValue) {
    throw new Error('Setting persistence verification failed for key: ' + key);
  }
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
// ── Registration and required-chat membership ──
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
// ── Profiles, favorites, referrals, and statistics ──
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
  const favCount = await db.$count(favorites, eq(favorites.favorite_telegram_id, Number(user.telegram_id)));
  const idLabel = t.telegramIdLabel || '🆔 Telegram ID number:';
  const text = t.profile + '\n━━━━━━━━━━━━━━\n\n👤 نوم: ' + escapeHtml(fullName) +
    '\n\n' + idLabel + ' <code>' + Number(user.telegram_id) + '</code>' +
    '\n\n🌍 هېواد: ' + escapeHtml(c ? c.label : t.notSet) + '\n\n⚧ جنسیت: ' + escapeHtml(genderLabel) + '\n\n🎂 عمر: ' + escapeHtml(user.age || t.notSet) +
    '\n\n🗣️ ژبه: ' + escapeHtml(l.label) + '\n\n📢 عام چینل: ' + escapeHtml(user.channel_username || t.notSet) +
    '\n\n📨 ریفرلونه: ' + Number(user.referral_count || 0) + '\n\n👥 پالو ملګري: ' + favCount +
    '\n\n⭐ ستوري: ' + Number(user.stars || 0) + '\n\n🏆 نمرې: ' + Number(user.points || 0) + '\n\n❤️ لایکونه: ' + Number(user.likes || 0);
  const markup = null;
  if (!user.profile_photo_id) {
    await sendPrompt(chatId, text, markup, user, 'HTML');
    return;
  }
  await ensureInlinePromptTracking();
  const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users).where(eq(users.telegram_id, Number(user.telegram_id))).get();
  const previousId = Number(latest && latest.last_prompt_id || 0);
  if (previousId > 0) await safeDelete(chatId, previousId);
  try {
    const sent = await api.sendPhoto({ chat_id: chatId, photo: user.profile_photo_id, caption: text, parse_mode: 'HTML', reply_markup: styleKeyboardMarkup(markup) });
    const sentId = Number(sent && sent.message_id || 0);
    await db.update(users).set({ last_prompt_id: sentId }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
    user.last_prompt_id = sentId;
  } catch (e) {
    await sendPrompt(chatId, text, markup, user, 'HTML');
  }
}

async function showFavoriteSettings(chatId, user, page) {
  const w = listWords(user), all = await db.select().from(favorites).where(eq(favorites.user_telegram_id, Number(user.telegram_id))).all();
  const size = 8, pages = Math.max(1, Math.ceil(all.length / size)), current = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const items = all.slice(current * size, current * size + size), rows = [];
  let text = '❤️ ' + w.fav + '\n' + (current + 1) + '/' + pages + '\n\n';
  for (const item of items) {
    const friend = await getUser(item.favorite_telegram_id); if (!friend) continue;
    const name = [friend.name || friend.first_name || 'User', friend.surname || ''].filter(Boolean).join(' ');
    text += '👤 ' + name + '\n🆔 ' + friend.telegram_id + '\n\n';
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
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function rankingName(row) {
  return [row.name || row.first_name || row.username || 'کارن', row.surname || ''].filter(Boolean).join(' ');
}
async function topReferralText(allUsers, user) {
  const top = allUsers.slice().sort((a, b) => Number(b.referral_count || 0) - Number(a.referral_count || 0)).filter(row => Number(row.referral_count || 0) > 0).slice(0, 5);
  if (!top.length) return tx(user).noReferrals;
  return top.map((row, i) => (i + 1) + '. ' + escapeHtml(rankingName(row)) +
    '\n🆔 ID: <code>' + Number(row.telegram_id) + '</code>' +
    '\n📨 ریفرلونه: ' + Number(row.referral_count || 0)).join('\n\n\n');
}
async function showStats(chatId, user) {
  const t = tx(user), allUsers = await db.select().from(users).all();
  const cutoff = Date.now() - 15 * 60 * 1000;
  const onlineUsers = allUsers.filter(row => row.last_active_at && Date.parse(row.last_active_at) >= cutoff);
  const topRefs = await topReferralText(allUsers, user);
  const text = t.statsTitle + '\n━━━━━━━━━━━━━━\n\n' + t.statsAll + allUsers.length +
    '\n\n' + t.statsOnline + onlineUsers.length + '\n\n' + t.statsTop + '\n\n' + topRefs;
  await sendPrompt(chatId, text, menuKeyboard(user, await isAdmin(user.telegram_id)), user, 'HTML');
}
async function showReferral(chatId, user) {
  const t = tx(user);
  const me = await api.getMe();
  const link = 'https://t.me/' + me.username + '?start=' + String(user.telegram_id);
  const rewardStars = await getSetting('referral_reward_stars', 15), rewardPoints = await getSetting('referral_reward_points', 5), rewardLikes = await getSetting('referral_reward_likes', 2);
  const rewardLine = user.language === 'en'
    ? '\n\n🎁 Reward for each successful invite:\n⭐ Stars: ' + rewardStars + '\n🏆 Points: ' + rewardPoints + '\n❤️ Likes: ' + rewardLikes
    : user.language === 'fa'
      ? '\n\n🎁 پاداش هر دعوت موفق:\n⭐ ستاره: ' + rewardStars + '\n🏆 امتیاز: ' + rewardPoints + '\n❤️ لایک: ' + rewardLikes
      : user.language === 'ur'
        ? '\n\n🎁 ہر کامیاب دعوت کا انعام:\n⭐ ستارے: ' + rewardStars + '\n🏆 پوائنٹس: ' + rewardPoints + '\n❤️ لائکس: ' + rewardLikes
        : user.language === 'ar'
          ? '\n\n🎁 مكافأة كل دعوة ناجحة:\n⭐ النجوم: ' + rewardStars + '\n🏆 النقاط: ' + rewardPoints + '\n❤️ الإعجابات: ' + rewardLikes
          : '\n\n🎁 د هر بریالي دعوت جایزه:\n⭐ ستوري: ' + rewardStars + '\n🏆 نمرې: ' + rewardPoints + '\n❤️ لایکونه: ' + rewardLikes;
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
    const name = profile ? [profile.name || profile.first_name || tx(user).adminFallback, profile.surname || ''].filter(Boolean).join(' ') : tx(user).adminFallback;
    text += tx(user).adminName + name + '\n\n' + tx(user).telegramID + ' ' + row.telegram_id + '\n\n' + tx(user).username + ' ' + (profile && profile.username ? '@' + profile.username : '—') + '\n\n━━━━━━━━━━━━━━\n\n';
    rows.push([{ text: w.copy + ' ' + row.telegram_id, copy_text: { text: String(row.telegram_id) } }]);
  }
  const nav = [];
  if (current > 0) nav.push({ text: w.prev, callback_data: 'admin:admins:page:' + (current - 1) });
  if (current < pages - 1) nav.push({ text: w.next, callback_data: 'admin:admins:page:' + (current + 1) });
  if (nav.length) rows.push(nav);
  rows.push([{ text: w.main, callback_data: 'admin:main' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, user);
}
async function showChannelList(chatId, user, notice) {
  const t = tx(user);
  const list = await getRequiredChats();
  const rows = list.map(row => {
    const info = requiredChatInfo(row);
    return [{ text: (info.type === 'channel' ? '📢 ' : '👥 ') + String(info.title || row.chat_id).slice(0, 48), callback_data: 'admin:channels:item:' + encodeURIComponent(String(row.chat_id)) }];
  });
  rows.push([{ text: t.channelBack, callback_data: 'admin:channels:back' }]);
  const heading = (notice ? notice + '\n\n' : '') + t.channelButtons[1] + '\n\n' + (list.length ? t.channelPrompt : t.channelEmpty);
  await sendPrompt(chatId, heading, { inline_keyboard: rows }, user);
}
async function completeProfile(chatId, user, extra) {
  await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, Number(user.telegram_id))).run();
  user.state = 'ready';
  await showMain(chatId, user, (extra ? extra + '\n' : '') + tx(user).ready);
}

// ── Chat sessions and connection lifecycle ──
function sessionControlLabels(user) {
  const labels = {
    ps: { profile: '👤 پروفایل لیدل', end: '🛑 اړیکه پای ته رسول', delete: '🗑 د وروستیو ۱۰ دقیقو پیغامونه حذفول' },
    fa: { profile: '👤 مشاهده پروفایل', end: '🛑 پایان دادن به ارتباط', delete: '🗑 حذف پیام‌های ۱۰ دقیقه اخیر' },
    en: { profile: '👤 View profile', end: '🛑 End connection', delete: '🗑 Delete last 10 minutes of messages' },
    ur: { profile: '👤 پروفائل دیکھیں', end: '🛑 رابطہ ختم کریں', delete: '🗑 گزشتہ ۱۰ منٹ کے پیغامات حذف کریں' },
    ar: { profile: '👤 عرض الملف الشخصي', end: '🛑 إنهاء الاتصال', delete: '🗑 حذف رسائل آخر 10 دقائق' }
  };
  return labels[user && labels[user.language] ? user.language : 'ps'];
}
function sessionControlAction(input) {
  for (const lang of ['ps', 'fa', 'en', 'ur', 'ar']) {
    const labels = sessionControlLabels({ language: lang });
    if (input === labels.profile) return 'profile';
    if (input === labels.end) return 'end';
    if (input === labels.delete) return 'delete_recent';
  }
  return null;
}
function sessionControlKeyboard(user) {
  const b = sessionControlLabels(user);
  return { keyboard: [[{ text: b.profile }, { text: b.end }], [{ text: b.delete }]], resize_keyboard: true };
}
function sessionEndedKeyboard(user, admin) {
  const markup = menuKeyboard(user, admin);
  markup.keyboard.unshift([{ text: sessionControlLabels(user).delete }]);
  return markup;
}
function sessionInteractionKeyboard(targetId, sessionId, following, liked, user) {
  const p = tx(user).sessionText;
  return { inline_keyboard: [[
    { text: following ? p.followed : p.follow, callback_data: 'session:follow:' + targetId + ':' + sessionId },
    { text: liked ? p.unlike : p.like, callback_data: 'session:like:' + targetId + ':' + sessionId }
  ]] };
}
async function sessionProfileText(target, viewerId) {
  const p = tx(await getUser(viewerId)).sessionText;
  const name = [target.name || target.first_name || p.fallbackName, target.surname || ''].filter(Boolean).join(' ');
  const gender = target.gender === 'female' ? p.female : target.gender === 'male' ? p.male : p.genderUnset;
  if (target.profile_visibility === 'followers' && !(await isFollowing(viewerId, target.telegram_id))) {
    return '👤 ' + p.name + ': ' + name + '\n\n⚧ ' + p.gender + ': ' + gender + '\n\n' + p.privateProfile;
  }
  const country = COUNTRIES.find(item => item.code === target.country);
  const language = LANGUAGES.find(item => item.code === target.language);
  const favCount = await db.$count(favorites, eq(favorites.favorite_telegram_id, Number(target.telegram_id)));
  return '👤 ' + p.name + ': ' + name + '\n\n⚧ ' + p.gender + ': ' + gender +
    '\n\n🌍 ' + p.country + ': ' + (country ? country.label : '—') +
    '\n\n🎂 ' + p.age + ': ' + (target.age || '—') + '\n\n🗣️ ' + p.language + ': ' + (language ? language.label : target.language || '—') +
    '\n\n📢 ' + p.channel + ': ' + (target.channel_username || '—') + '\n\n📨 ' + p.referrals + ': ' + Number(target.referral_count || 0) +
    '\n\n👥 ' + p.favorites + ': ' + favCount + '\n\n🏆 ' + p.points + ': ' + Number(target.points || 0) + '\n\n❤️ ' + p.likes + ': ' + Number(target.likes || 0);
}
async function showSessionProfileFromMessage(session, viewerId) {
  const targetId = otherSessionUser(session, viewerId);
  const target = await getUser(targetId), viewer = await getUser(viewerId);
  if (!target || !viewer) return;
  const following = await isFollowing(viewerId, targetId);
  const likes = await db.select().from(user_likes).where(eq(user_likes.liker_id, Number(viewerId))).all();
  const liked = likes.some(row => Number(row.liked_id) === targetId);
  const fullProfileAllowed = target.profile_visibility !== 'followers' || following;
  const text = '🤝 اړیکه فعاله ده.\n\n' + await sessionProfileText(target, viewerId);
  const markup = sessionInteractionKeyboard(targetId, session.id, following, liked, viewer);
  if (fullProfileAllowed && target.profile_photo_id) {
    try {
      await ensureInlinePromptTracking();
      const latest = await db.select({ last_prompt_id: users.last_prompt_id }).from(users)
        .where(eq(users.telegram_id, Number(viewerId))).get();
      const previousId = Number(latest && latest.last_prompt_id || 0);
      if (previousId > 0) await safeDelete(viewerId, previousId);
      const sent = await api.sendPhoto({
        chat_id: Number(viewerId), photo: target.profile_photo_id,
        caption: text.slice(0, 1024), reply_markup: styleKeyboardMarkup(markup)
      });
      const sentId = Number(sent && sent.message_id || 0);
      await db.update(users).set({ last_prompt_id: sentId }).where(eq(users.telegram_id, Number(viewerId))).run();
      viewer.last_prompt_id = sentId;
      return;
    } catch (photoError) {
      console.warn('Could not send connection partner profile photo; falling back to text', {
        viewerId: Number(viewerId), targetId, photoError
      });
    }
  }
  await sendPrompt(viewerId, text, markup, viewer);
}
async function deleteRecentPartnerMessages(session, viewerId) {
  const partnerId = otherSessionUser(session, viewerId);
  const cutoff = Date.now() - 10 * 60000;
  const rows = await db.select().from(chat_messages).all();
  let deleted = 0;
  for (const row of rows.filter(item =>
    Number(item.sender_id) === partnerId &&
    Number(item.recipient_id) === Number(viewerId) &&
    Number(item.session_id) === Number(session.id) &&
    Date.parse(item.created_at || '') >= cutoff &&
    Number(item.recipient_message_id) > 0
  )) {
    try {
      await api.deleteMessage({ chat_id: Number(viewerId), message_id: Number(row.recipient_message_id) });
      await db.update(chat_messages).set({ recipient_message_id: 0 }).where(eq(chat_messages.id, Number(row.id))).run();
      deleted++;
    } catch (error) {
      // Retain the message ID if Telegram refuses deletion, so retries remain possible.
    }
  }
  return deleted;
}
async function latestSessionForUser(userId) {
  const rows = await db.select().from(chat_sessions).all();
  return rows.filter(row =>
    ['connected', 'ended'].includes(String(row.status || '')) &&
    (Number(row.first_user_telegram_id) === Number(userId) || Number(row.second_user_telegram_id) === Number(userId))
  ).sort((a, b) => {
    const aTime = Date.parse(a.ended_at || a.connected_at || a.created_at || '') || 0;
    const bTime = Date.parse(b.ended_at || b.connected_at || b.created_at || '') || 0;
    return bTime - aTime || Number(b.id) - Number(a.id);
  })[0] || null;
}
async function availableRatingButtons(raterId, ratedId, sessionId) {
  const allRatings = await db.select().from(user_ratings).all();
  const alreadyGiven = allRatings
    .filter(row => Number(row.rater_id) === Number(raterId) && Number(row.rated_id) === Number(ratedId))
    .reduce((sum, row) => sum + Math.max(0, Number(row.rating) || 0), 0);
  const remaining = Math.max(0, 5 - alreadyGiven);
  const buttons = [];
  for (let rating = 1; rating <= remaining; rating++) {
    buttons.push({ text: '⭐ ' + rating, callback_data: 'session:rate:' + ratedId + ':' + rating + ':' + sessionId });
  }
  return buttons;
}
async function endConnection(session, reason) {
  if (!session || session.status !== 'connected') return;
  const endedAt = new Date().toISOString();
  const ended = await db.update(chat_sessions).set({ status: 'ended', ended_at: endedAt, end_reason: reason || 'ended' })
    .where(and(eq(chat_sessions.id, Number(session.id)), eq(chat_sessions.status, 'connected')))
    .returning({ id: chat_sessions.id }).run();
  let endVerified = Boolean(ended && Array.isArray(ended.rows) && ended.rows.length > 0);
  if (!endVerified) {
    const persisted = await db.select().from(chat_sessions).where(eq(chat_sessions.id, Number(session.id))).get();
    endVerified = Boolean(persisted && persisted.status === 'ended' && String(persisted.ended_at || '') === endedAt);
  }
  if (!endVerified) return;
  const firstId = Number(session.first_user_telegram_id), secondId = Number(session.second_user_telegram_id);
  for (const pair of [{ id: firstId, partnerId: secondId }, { id: secondId, partnerId: firstId }]) {
    const user = await getUser(pair.id), partner = await getUser(pair.partnerId);
    if (!user) continue;
    await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, pair.id)).run();
    const p = tx(user).sessionText;\n    const name = partner ? [partner.name || partner.first_name || p.fallbackName, partner.surname || ''].filter(Boolean).join(' ') : p.fallbackName;
    const following = await isFollowing(pair.id, pair.partnerId);
    const ratingButtons = await availableRatingButtons(pair.id, pair.partnerId, session.id);
    const rows = [];
    if (ratingButtons.length) rows.push(ratingButtons);
    if (!following) rows.push([{ text: p.follow + ' · ' + name, callback_data: 'session:follow:' + pair.partnerId + ':' + session.id }]);
    rows.push([{ text: p.mainMenu, callback_data: 'settings:main' }]);
    try {
      await sendPrompt(pair.id, p.ended + '\n\n' + p.partnerName + name + '\n\n' + p.afterEnd, { inline_keyboard: rows }, user);
    } catch (e) {}
    try {
      await api.sendMessage({
        chat_id: pair.id,
        text: p.deleteHint,
        reply_markup: styleKeyboardMarkup(sessionEndedKeyboard(user, await isAdmin(pair.id)))
      });
    } catch (keyboardError) {
      reportDiagnostic('message-handler', 'Could not show post-connection reply keyboard', { sessionId: Number(session.id), userId: pair.id, keyboardError });
    }
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
  // Recover searches left in the temporary "matching" state if a previous invocation crashed.
  // Expire any associated offers too, so recipients cannot accept an orphaned offer later.
  for (const stuck of requests.filter(row => Number(row.requester_id) === id && row.status === 'matching')) {
    const stamp = Date.parse(stuck.updated_at || stuck.created_at || '');
    if (Number.isFinite(stamp) && now - stamp < connectionWait * 1000) continue;
    const expiredSearch = await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
      .where(and(eq(connection_requests.id, Number(stuck.id)), eq(connection_requests.status, 'matching')))
      .returning({ id: connection_requests.id }).run();
    if (!expiredSearch || !Array.isArray(expiredSearch.rows) || expiredSearch.rows.length === 0) continue;
    stuck.status = 'expired';
    for (const offer of requests.filter(row => Number(row.requester_id) === id && row.status === 'pending')) {
      const expiredOffer = await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(offer.id)), eq(connection_requests.status, 'pending')))
        .returning({ id: connection_requests.id }).run();
      if (!expiredOffer || !Array.isArray(expiredOffer.rows) || expiredOffer.rows.length === 0) continue;
      offer.status = 'expired';
      if (Number(offer.recipient_id) > 0) {
        try { await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د تخنیکي ځنډ له امله لغوه شوه.' }); } catch (e) {}
      }
    }
    if (user.state === 'searching_connection') await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run();
    expired = true;
  }

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
  for (const game of games) {
    const isOwnGame = Number(game.player_id) === id;
    const isIncomingOffer = Number(game.opponent_id) === id && game.status === 'pending';
    // On the user's next interaction, clear stale games (including a "playing"
    // row left behind by a crashed serverless invocation) after the configured timeout.
    if (!['waiting', 'pending', 'playing'].includes(game.status) || (!isOwnGame && !isIncomingOffer && Number(game.opponent_id) !== id)) continue;
    const timerStart = game.status === 'waiting' ? (game.created_at || game.updated_at) : (game.updated_at || game.created_at);
    const age = now - Date.parse(timerStart || '');
    if (Number.isFinite(age) && age < gameWait * 1000) continue;
    const ownerCondition = isOwnGame
      ? eq(game_sessions.player_id, id)
      : eq(game_sessions.opponent_id, id);
    const cancelled = await db.update(game_sessions)
      .set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, game.status), ownerCondition))
      .returning({ id: game_sessions.id }).run();
    if (!cancelled || !Array.isArray(cancelled.rows) || cancelled.rows.length === 0) continue;
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
// ── Connection search and message relay ──
async function tryOfferSearches() {
  const allRequests = await db.select().from(connection_requests).all();
  const allUsers = await db.select().from(users).all();
  const allSessions = await db.select().from(chat_sessions).all();
  const allGames = await db.select().from(game_sessions).all();
  const allBlocks = await db.select().from(user_blocks).all();
  const allFavorites = await db.select().from(favorites).all();
  const now = Date.now(), waitSeconds = Math.max(1, Number(await getSetting('connection_search_seconds', 120)) || 120);
  const searches = allRequests.filter(row => row.status === 'searching' && !row.recipient_id);
  // Expire abandoned searches here as well as during user callbacks; otherwise old rows can block a new search indefinitely.
  for (const staleSearch of searches) {
    const staleAge = now - Date.parse(staleSearch.created_at || '');
    if (Number.isFinite(staleAge) && staleAge < waitSeconds * 1000) continue;
    const expiredSearch = await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
      .where(and(eq(connection_requests.id, Number(staleSearch.id)), eq(connection_requests.status, 'searching')))
      .returning({ id: connection_requests.id }).run();
    let didExpireSearch = Boolean(expiredSearch && Array.isArray(expiredSearch.rows) && expiredSearch.rows.length > 0);
    if (!didExpireSearch) {
      const verifyRequests = await db.select().from(connection_requests).all();
      const verified = verifyRequests.find(row => Number(row.id) === Number(staleSearch.id));
      didExpireSearch = Boolean(verified && verified.status === 'expired');
    }
    if (!didExpireSearch) {
      await notifyRuntimeError('connection-timeout:expire-search', new Error('Could not expire stale connection search'), {
        requestId: Number(staleSearch.id),
        requesterId: Number(staleSearch.requester_id),
        ageSeconds: Number.isFinite(staleAge) ? Math.floor(staleAge / 1000) : 'unknown'
      });
      continue;
    }
    staleSearch.status = 'expired';
    await db.update(users).set({ state: 'ready' }).where(and(eq(users.telegram_id, Number(staleSearch.requester_id)), eq(users.state, 'searching_connection'))).run();
    for (const staleOffer of allRequests.filter(row => Number(row.requester_id) === Number(staleSearch.requester_id) && row.status === 'pending')) {
      const expiredOffer = await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(staleOffer.id)), eq(connection_requests.status, 'pending')))
        .returning({ id: connection_requests.id }).run();
      if (expiredOffer && Array.isArray(expiredOffer.rows) && expiredOffer.rows.length > 0) {
        staleOffer.status = 'expired';
        if (Number(staleOffer.recipient_id) > 0) try { await api.sendMessage({ chat_id: Number(staleOffer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}
      }
    }
    try { await api.sendMessage({ chat_id: Number(staleSearch.requester_id), text: '⌛ د ملګري لټون وخت پای ته ورسېد؛ غوښتنه لغوه شوه. بیا هڅه وکړه.' }); } catch (e) {}
  }
  for (const search of searches.filter(row => row.status === 'searching')) {
    const age = now - Date.parse(search.created_at || '');
    if (!Number.isFinite(age) || age >= waitSeconds * 1000) continue;
    if (allRequests.some(row => Number(row.requester_id) === Number(search.requester_id) && row.status === 'pending' && row.recipient_id &&
      Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < waitSeconds * 1000) ||
        allRequests.some(row => Number(row.recipient_id) === Number(search.requester_id) && row.status === 'pending' &&
      Number.isFinite(Date.parse(row.created_at || '')) && now - Date.parse(row.created_at || '') < waitSeconds * 1000)) continue;
    const requester = allUsers.find(row => Number(row.telegram_id) === Number(search.requester_id));
    if (!requester || Number(requester.is_blocked) === 1) continue;
    if (allGames.some(row => ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
        (Number(row.player_id) === Number(search.requester_id) || Number(row.opponent_id) === Number(search.requester_id)))) continue;
    const alreadyTried = new Set(allRequests.filter(row => Number(row.requester_id) === Number(search.requester_id) && row.recipient_id && Number(row.id) > Number(search.id))
      .map(row => Number(row.recipient_id)));
    const candidates = allUsers.filter(candidate => {
      const candidateId = Number(candidate.telegram_id);
      if (candidateId === Number(search.requester_id) || Number(candidate.is_blocked) === 1) return false;
      if (allGames.some(row => ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status) &&
          (Number(row.player_id) === candidateId || Number(row.opponent_id) === candidateId))) return false;
      if (!candidate.country || !candidate.gender || !candidate.age) return false;
      const active = Date.parse(candidate.last_active_at || '');
      if (!Number.isFinite(active) || now - active > waitSeconds * 1000) return false;
      if (alreadyTried.has(candidateId)) return false;
      if (allBlocks.some(row => (Number(row.blocker_telegram_id) === candidateId && Number(row.blocked_telegram_id) === Number(search.requester_id)) ||
        (Number(row.blocker_telegram_id) === Number(search.requester_id) && Number(row.blocked_telegram_id) === candidateId))) return false;
      const connected = allSessions.some(row => row.status === 'connected' &&
        (Number(row.first_user_telegram_id) === candidateId || Number(row.second_user_telegram_id) === candidateId));
      // Do not offer a connection to someone already connected; acceptance rejects a second session.
      if (connected) return false;
      const candidateHasActiveRequest = allRequests.some(row =>
        ['searching', 'matching', 'pending'].includes(row.status) &&
        (Number(row.requester_id) === candidateId || Number(row.recipient_id) === candidateId));
      if (candidateHasActiveRequest) return false;
      if (search.request_type === 'find' && search.gender_filter !== 'auto' && candidate.gender !== search.gender_filter) return false;
      if (search.request_type === 'find' && search.language_filter !== 'auto' && candidate.language !== search.language_filter) return false;
      return true;
    });
    if (!candidates.length) continue;
    candidates.sort((a, b) => {
      const rank = item => allSessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === Number(item.telegram_id) || Number(row.second_user_telegram_id) === Number(item.telegram_id))) ? 1 :
        allFavorites.some(row => Number(row.user_telegram_id) === Number(search.requester_id) && Number(row.favorite_telegram_id) === Number(item.telegram_id)) ? 2 : 0;
      return rank(a) - rank(b) || Date.parse(b.last_active_at || '') - Date.parse(a.last_active_at || '');
    });
    const candidate = candidates[0];
    const claimAt = new Date().toISOString();
    const claim = await db.update(connection_requests).set({ status: 'matching', updated_at: claimAt })
      .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'searching')))
      .returning({ id: connection_requests.id }).run();
    let claimVerified = Boolean(claim && Array.isArray(claim.rows) && claim.rows.length > 0);
    if (!claimVerified) {
      const persistedClaim = await db.select().from(connection_requests).where(eq(connection_requests.id, Number(search.id))).get();
      claimVerified = Boolean(persistedClaim && persistedClaim.status === 'matching' &&
        String(persistedClaim.updated_at || '') === claimAt);
    }
    if (!claimVerified) continue;
    let offer;
    let offerCreatedAt = null;
    try {
      const nowIso = new Date().toISOString();
      offerCreatedAt = nowIso;
      const inserted = await db.insert(connection_requests).values({
        requester_id: Number(search.requester_id), recipient_id: Number(candidate.telegram_id), status: 'pending',
        request_type: search.request_type, gender_filter: search.gender_filter, language_filter: search.language_filter,
        created_at: nowIso, updated_at: nowIso
      }).returning().run();
      offer = inserted && Array.isArray(inserted.rows) ? inserted.rows[0] : null;
      if (!offer || !Number.isSafeInteger(Number(offer.id)) || Number(offer.id) <= 0) {
        const persistedRequests = await db.select().from(connection_requests).all();
        const matchingOffers = persistedRequests.filter(row =>
          Number(row.requester_id) === Number(search.requester_id) &&
          Number(row.recipient_id) === Number(candidate.telegram_id) &&
          row.status === 'pending' && row.request_type === search.request_type &&
          String(row.created_at || '') === nowIso &&
          Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0
        );
        if (matchingOffers.length > 0) {
          matchingOffers.sort((a, b) => Number(b.id) - Number(a.id));
          offer = matchingOffers[0];
          console.info('Verified connection offer insert after empty RETURNING result', {
            searchId: Number(search.id), offerId: Number(offer.id), candidateId: Number(candidate.telegram_id)
          });
        }
      }
      if (!offer || !Number.isSafeInteger(Number(offer.id)) || Number(offer.id) <= 0) {
        throw new Error('Connection offer insert returned no usable row after persisted-row verification');
      }
      const releaseAt = new Date().toISOString();
      const released = await db.update(connection_requests).set({ status: 'searching', updated_at: releaseAt })
        .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'matching'), eq(connection_requests.updated_at, claimAt)))
        .returning({ id: connection_requests.id }).run();
      let releaseVerified = Boolean(released && Array.isArray(released.rows) && released.rows.length > 0);
      if (!releaseVerified) {
        const persistedRelease = await db.select().from(connection_requests).where(eq(connection_requests.id, Number(search.id))).get();
        releaseVerified = Boolean(persistedRelease && persistedRelease.status === 'searching' &&
          String(persistedRelease.updated_at || '') === releaseAt);
      }
      if (!releaseVerified) {
        await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
          .where(and(eq(connection_requests.id, Number(offer.id)), eq(connection_requests.status, 'pending'))).run();
        reportDiagnostic('message-handler', 'Could not release claimed connection search', { searchId: search.id, offerId: offer.id });
        continue;
      }
      allRequests.push(offer);
    } catch (error) {
      try {
        const releaseAt = new Date().toISOString();
        await db.update(connection_requests).set({ status: 'searching', updated_at: releaseAt })
          .where(and(eq(connection_requests.id, Number(search.id)), eq(connection_requests.status, 'matching'), eq(connection_requests.updated_at, claimAt)))
          .run();
      } catch (releaseError) {
        reportDiagnostic('message-handler', 'Failed to release connection search after offer creation error', { searchId: search.id, error: releaseError });
      }
      reportDiagnostic('message-handler', 'Failed to create connection offer', {
        searchId: search.id, requesterId: search.requester_id, candidateId: candidate.telegram_id, offerCreatedAt, error
      });
      continue;
    }
    try {
      await api.sendMessage({ chat_id: Number(candidate.telegram_id),
        text: '🎲 یو ناڅاپي کس غواړي له تا سره اړیکه پیل کړي.\n\nته د غوښتونکي نوم، عکس، جنسیت او نور معلومات نه وینې. که غوښتنه ومنې، اړیکه به وصل شي؛ که رد یې کړې، بل کس ته به غوښتنه واستول شي.',
        reply_markup: styleKeyboardMarkup({ inline_keyboard: [[{ text: '✅ غوښتنه منل', callback_data: 'conn:accept:' + offer.id }, { text: '❌ ردول', callback_data: 'conn:reject:' + offer.id }]] })
      });
    } catch (error) {
      reportDiagnostic('message-handler', 'Failed to send connection offer to candidate', { searchId: search.id, offerId: offer.id, candidateId: candidate.telegram_id, error });
      await db.update(connection_requests).set({ status: 'rejected', updated_at: new Date().toISOString() })
        .where(and(eq(connection_requests.id, Number(offer.id)), eq(connection_requests.status, 'pending'))).run();
    }
  }
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
    let replyToPartnerMessageId = 0;
    const repliedMessageId = Number(message.reply_to_message && message.reply_to_message.message_id || 0);
    if (repliedMessageId > 0) {
      const mappings = await db.select().from(chat_messages).where(and(
        eq(chat_messages.session_id, Number(session.id)),
        eq(chat_messages.recipient_id, senderId),
        eq(chat_messages.recipient_message_id, repliedMessageId)
      )).all();
      const mapping = mappings.find(row =>
        Number(row.sender_id) === recipientId && Number(row.source_message_id || 0) > 0
      );
      if (mapping) replyToPartnerMessageId = Number(mapping.source_message_id);
    }
    const copyArgs = { chat_id: recipientId, from_chat_id: senderId, message_id: Number(message.message_id) };
    if (replyToPartnerMessageId > 0) {
      copyArgs.reply_parameters = { message_id: replyToPartnerMessageId, allow_sending_without_reply: true };
    }
    const copied = await api.copyMessage(copyArgs);
    if (copied && copied.message_id) {
      await db.insert(chat_messages).values({
        session_id: Number(session.id), sender_id: senderId, recipient_id: recipientId,
        recipient_message_id: Number(copied.message_id), source_message_id: Number(message.message_id),
        created_at: new Date().toISOString()
      }).run();
    }
    await db.update(chat_sessions).set({ last_activity_at: new Date().toISOString() }).where(eq(chat_sessions.id, Number(session.id))).run();
  } catch (error) {
    reportDiagnostic('message-handler', 'Could not relay connection message or reply', {
      sessionId: Number(session.id), senderId, recipientId, error
    });
    try { await api.sendMessage({ chat_id: senderId, text: '⚠️ دا پیغام یا د هغه Reply بل ملګري ته ونه لېږل شو. بل ډول پیغام واستوه.' }); } catch (e) {}
  }
}
// ── Dice game lifecycle ──
async function startDiceGame(chatId, user) {
  const minStars = Number(await getSetting('game_min_stars', 3.5));
  const fee = Number(await getSetting('game_fee_stars', 0.5));
  const requiredBalance = minStars;
  if (![minStars, fee, requiredBalance].every(Number.isFinite) || minStars <= 0 || fee < 0 || fee >= minStars) {
    await sendPrompt(chatId, '⚠️ د ګېم تنظیمات ناسم دي: فیس باید له جایزې څخه کم وي. له اډمین سره اړیکه ونیسه.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  if (Number(user.stars || 0) < requiredBalance) {
    await sendPrompt(chatId, '🎲 د ګېم لپاره لږ تر لږه ' + requiredBalance + ' ستوري پکار دي (جایزه ' + minStars + '؛ فیس ' + fee + ' د جایزې له اندازې کمېږي).\n\nستا بیلانس: ' + Number(user.stars || 0), menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  const rows = await db.select().from(game_sessions).all();
  const userId = Number(user.telegram_id);
  const activeConnection = await activeSessionFor(userId);
  const connectionRequests = await db.select().from(connection_requests).all();
  const hasActiveConnectionRequest = connectionRequests.some(row =>
    ['searching', 'pending', 'matching'].includes(row.status) &&
    (Number(row.requester_id) === userId || Number(row.recipient_id) === userId)
  );
  if (activeConnection || hasActiveConnectionRequest) {
    await sendPrompt(chatId, '⚠️ ته لا د اړیکې یا د ملګري د لټون په بهیر کې یې. لومړی هغه پای ته ورسوه، بیا ګېم پیل کړه.', menuKeyboard(user, await isAdmin(userId)), user);
    return;
  }
  const waitSeconds = Math.max(1, Number(await getSetting('game_wait_seconds', 120)) || 120);
  const nowMs = Date.now();
  // Expire only this user's stale waiting/offered games. Conditional status updates
  // prevent this cleanup from overwriting a concurrent accept/cancel transition.
  for (const row of rows) {
    const isOwnGame = Number(row.player_id) === userId;
    const isIncomingOffer = Number(row.opponent_id) === userId && row.status === 'pending';
    if (!isOwnGame && !isIncomingOffer) continue;
    if (!['waiting', 'pending'].includes(row.status)) continue;
    const stamp = row.status === 'waiting' ? (row.created_at || row.updated_at) : (row.updated_at || row.created_at);
    const age = nowMs - Date.parse(stamp || '');
    if (Number.isFinite(age) && age < waitSeconds * 1000) continue;
    const expired = await db.update(game_sessions)
      .set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(row.id)), eq(game_sessions.status, row.status)))
      .returning({ id: game_sessions.id }).run();
    if (expired && Array.isArray(expired.rows) && expired.rows.length > 0 && row.status === 'pending') {
      const otherId = isOwnGame ? Number(row.opponent_id || 0) : Number(row.player_id);
      if (otherId > 0 && otherId !== userId) {
        try { await api.sendMessage({ chat_id: otherId, text: '⌛ د ګېم غوښتنې وخت پای ته رسېدلی؛ دا ګېم نور فعال نه دی.' }); } catch (e) {}
      }
    }
  }
  const freshRows = await db.select().from(game_sessions).all();
  if (freshRows.some(row => row.status === 'settlement_error' &&
      (Number(row.player_id) === userId || Number(row.opponent_id) === userId))) {
    await sendPrompt(chatId, '⚠️ ستا په یوه پخواني ګېم کې تخنیکي ستونزه ثبت شوې ده. د فیس او پایلې د کتنې لپاره له اډمین سره اړیکه ونیسه؛ تر هغې نوی ګېم مه پیلوه.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  if (freshRows.some(row => Number(row.player_id) === userId && ['waiting','pending','playing'].includes(row.status)) ||
      freshRows.some(row => Number(row.opponent_id) === userId && ['pending','playing'].includes(row.status))) {
    await sendPrompt(chatId, '🎲 ستا د ګېم غوښتنه لا روانه ده.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);
    return;
  }
  const now = new Date().toISOString();
  const insertedGame = await db.insert(game_sessions).values({ player_id: Number(user.telegram_id), opponent_id: null, status: 'waiting',
    created_at: now, updated_at: now, fee_stars: fee,
    win_stars: minStars, points_award: Number(await getSetting('game_win_points', 1)) }).returning().run();
  // Some Serverless SDK/database adapters may not expose RETURNING rows consistently.
  // Confirm the insert by its exact player + timestamps before declaring it failed.
  let createdGame = insertedGame && Array.isArray(insertedGame.rows) ? insertedGame.rows[0] : null;
  if (!createdGame || !Number.isSafeInteger(Number(createdGame.id)) || Number(createdGame.id) <= 0) {
    const verifiedRows = await db.select().from(game_sessions)
      .where(and(eq(game_sessions.player_id, userId), eq(game_sessions.status, 'waiting'), eq(game_sessions.created_at, now)))
      .all();
    createdGame = Array.isArray(verifiedRows)
      ? verifiedRows.find(row => row.updated_at === now && row.opponent_id == null) || null
      : null;
  }
  if (!createdGame || !Number.isSafeInteger(Number(createdGame.id)) || Number(createdGame.id) <= 0) {
    throw new Error('Game insert could not be verified after insert; returning rows were empty and fallback lookup found no matching row');
  }
  try {
    await sendPrompt(chatId, '🎲 د ګېم سیال لټول کېږي.\n\n📩 د منلو/ردولو پیغام یوازې هغه کارن ته استول کېږي چې په تېرو ۲ دقیقو کې له بوټ سره فعال و، کافي ستوري ولري، او بل فعال ګېم یا اړیکه ونه لري.\n\n⏳ که په ټاکلي وخت کې مناسب سیال پیدا نه شي، ګېم به د بوټ پر وړاندې حل شي؛ که لغوه کول غواړې، لاندې تڼۍ ووهه.', { inline_keyboard: [[{ text: '❌ ګېم لغوه کول', callback_data: 'game:cancel' }]] }, user);
  } catch (promptError) {
    // If the status prompt cannot be delivered, remove only this new request from
    // active matchmaking so it cannot silently block future games/connections.
    try {
      const latest = await db.select().from(game_sessions).where(eq(game_sessions.id, Number(createdGame.id))).get();
      if (latest && ['waiting', 'pending'].includes(latest.status)) {
        const conditions = [
          eq(game_sessions.id, Number(createdGame.id)),
          eq(game_sessions.player_id, Number(user.telegram_id)),
          eq(game_sessions.status, latest.status)
        ];
        if (latest.status === 'pending' && Number(latest.opponent_id || 0) > 0) {
          conditions.push(eq(game_sessions.opponent_id, Number(latest.opponent_id)));
        } else {
          conditions.push(eq(game_sessions.opponent_id, null));
        }
        const cancelled = await db.update(game_sessions)
          .set({ status: 'cancelled', updated_at: new Date().toISOString() })
          .where(and(...conditions))
          .returning({ id: game_sessions.id }).run();
        if (cancelled && Array.isArray(cancelled.rows) && cancelled.rows.length > 0 && latest.status === 'pending' && Number(latest.opponent_id || 0) > 0) {
          try {
            await api.sendMessage({ chat_id: Number(latest.opponent_id), text: '⌛ د ګېم غوښتنه د تخنیکي ستونزې له امله لغوه شوه.' });
          } catch (notifyError) {
            console.warn('Could not notify opponent about game request cleanup', {
              gameId: Number(createdGame.id), opponentId: Number(latest.opponent_id), notifyError
            });
          }
        }
      }
    } catch (cleanupError) {
      reportDiagnostic('message-handler', 'Could not clean up game after startup prompt failure', {
        gameId: Number(createdGame.id), playerId: Number(user.telegram_id), cleanupError
      });
    }
    throw promptError;
  }
  try {
    await tryMatchGames();
  } catch (error) {
    // Keep the persisted waiting game recoverable and avoid turning a matcher error
    // into the generic message-handler failure. Record the actual cause for logs.
    reportDiagnostic('message-handler', 'Game request was saved but matchmaking failed', {
      gameId: Number(createdGame.id),
      playerId: Number(user.telegram_id),
      error: error && (error.stack || error.message || String(error))
    });
    try {
      await api.sendMessage({
        chat_id: Number(chatId),
        text: '⚠️ د ګېم غوښتنه ثبت شوه، خو د سیال لټولو پر مهال تخنیکي ستونزه وشوه. غوښتنه لا د لټون په حالت کې ده؛ لږ وروسته بیا هڅه وکړه.'
      });
    } catch (notifyError) {
      reportDiagnostic('message-handler', 'Could not notify player about matchmaking failure', {
        playerId: Number(user.telegram_id), notifyError
      });
    }
  }
}
export async function resolveBotGame(game) {
  if (!game || game.status !== 'playing') return;
  const player = await getUser(game.player_id);
  if (!player) {
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    return;
  }
  const fee = Number(game.fee_stars ?? await getSetting('game_fee_stars', 0.5));
  const winStars = Number(game.win_stars ?? await getSetting('game_min_stars', 3.5));
  const points = Number(game.points_award ?? await getSetting('game_win_points', 1));
  const balance = Number(player.stars || 0), pointsBalance = Number(player.points || 0);
  if (![fee, winStars, points].every(Number.isFinite) || fee < 0 || winStars <= 0 || fee >= winStars || points < 0 || !Number.isInteger(points)) {
    await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د ګېم مالي تنظیمات ناسم دي؛ فیس نه دی تصفیه شوی. له اډمین سره اړیکه ونیسه.' }); } catch (e) {}
    return;
  }
  if (balance < winStars) {
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ ستوري نور د ګېم د جایزې لپاره کافي نه دي؛ ګېم لغوه شو او فیس نه دی اخیستل شوی.' }); } catch (e) {}
    return;
  }
  let playerDice;
  try {
    playerDice = await api.sendDice({ chat_id: Number(player.telegram_id), emoji: '🎲' });
  } catch (error) {
    reportDiagnostic('message-handler', 'Bot game dice failed', { gameId: game.id, playerId: player.telegram_id, error });
    await db.update(game_sessions).set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د ګېم تخنیکي ستونزه وه؛ ګېم لغوه شو او فیس نه دی اخیستل شوی. بیا هڅه وکړه.' }); } catch (e) {}
    return;
  }
  const playerRoll = Number(playerDice && playerDice.dice && playerDice.dice.value || 0);
  // Keep the bot's roll internal so the player sees only their own Telegram die.
  const botRoll = Math.floor(Math.random() * 6) + 1;
  if (![playerRoll, botRoll].every(value => Number.isInteger(value) && value >= 1 && value <= 6)) {
    await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د تاس پایله تایید نه شوه؛ مالي تصفیه ونه شوه. له اډمین سره اړیکه ونیسه.' }); } catch (e) {}
    return;
  }
  let outcome = '🤝 مساوي! یوازې د ګېم فیس ' + fee + ' ستوری کم شو.';
  let newBalance = balance - fee, newPoints = pointsBalance;
  if (playerRoll > botRoll) {
    newBalance = balance + winStars - fee;
    newPoints += points;
    outcome = '🎉 ته وګټلې! ستا خالصه جایزه ' + (winStars - fee) + ' ستوري او +' + points + ' نمرې ده.';
  } else if (botRoll > playerRoll) {
    newBalance = balance - winStars;
    outcome = '🤖 بوټ وګټله! ستا ټول لګښت ' + winStars + ' ستوري شو (فیس پکې شامل دی).';
  }
  const balanceUpdate = await db.update(users).set({ stars: newBalance, points: newPoints })
    .where(and(eq(users.telegram_id, Number(player.telegram_id)), eq(users.stars, balance), eq(users.points, pointsBalance)))
    .returning({ telegram_id: users.telegram_id }).run();
  if (!balanceUpdate || !Array.isArray(balanceUpdate.rows) || balanceUpdate.rows.length === 0) {
    await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د ګېم پر مهال ستا بیلانس بدل شو؛ د ناسم حساب د مخنیوي لپاره تصفیه ودرول شوه. له اډمین سره اړیکه ونیسه.' }); } catch (e) {}
    return;
  }
  const completed = await db.update(game_sessions)
    .set({ status: 'completed', player_roll: playerRoll, opponent_roll: botRoll, updated_at: new Date().toISOString() })
    .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing')))
    .returning({ id: game_sessions.id }).run();
  if (!completed || !Array.isArray(completed.rows) || completed.rows.length === 0) {
    await db.update(game_sessions).set({ status: 'settlement_error', updated_at: new Date().toISOString() })
      .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'playing'))).run();
    try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ مالي بدلون وشو، خو د ګېم پایله په ډیټابیس کې بشپړه ثبت نه شوه. له اډمین سره اړیکه ونیسه.' }); } catch (e) {}
    return;
  }
  try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '🎲 د ګېم پایله\n\nستا 🎲: ' + playerRoll + '\n\nد بوټ 🎲: ' + botRoll + '\n\n' + outcome + '\n\n⭐ اوسنی بیلانس: ' + newBalance }); } catch (e) {}
}
export async function tryMatchGames() {
  let rows = await db.select().from(game_sessions).all();
  const allUsers = await db.select().from(users).all();
  const allSessions = await db.select().from(chat_sessions).all();
  const allConnectionRequests = await db.select().from(connection_requests).all();
  const allBlocks = await db.select().from(user_blocks).all();
  const waitSeconds = Math.max(1, Number(await getSetting('game_wait_seconds', 120)) || 120);
  const minStars = Number(await getSetting('game_min_stars', 3.5));
  const fee = Number(await getSetting('game_fee_stars', 0.5));
  const requiredBalance = minStars;
  const now = Date.now();

  // Expire stale incoming offers globally, not only when one of their players
  // starts another game. Otherwise an old pending offer can overlap a new one.
  for (const staleOffer of rows.filter(row => row.status === 'pending')) {
    const stamp = staleOffer.updated_at || staleOffer.created_at;
    const offerAge = now - Date.parse(stamp || '');
    if (Number.isFinite(offerAge) && offerAge < waitSeconds * 1000) continue;
    const conditions = [
      eq(game_sessions.id, Number(staleOffer.id)),
      eq(game_sessions.status, 'pending'),
      eq(game_sessions.player_id, Number(staleOffer.player_id)),
      eq(game_sessions.opponent_id, Number(staleOffer.opponent_id))
    ];
    if (staleOffer.updated_at != null) conditions.push(eq(game_sessions.updated_at, staleOffer.updated_at));
    const expired = await db.update(game_sessions)
      .set({ status: 'cancelled', updated_at: new Date().toISOString() })
      .where(and(...conditions))
      .returning({ id: game_sessions.id }).run();
    let didExpire = Boolean(expired && Array.isArray(expired.rows) && expired.rows.length > 0);
    if (!didExpire) {
      // Verify persisted state when this adapter applies UPDATE but omits RETURNING rows.
      const verifyRows = await db.select().from(game_sessions).all();
      const verified = verifyRows.find(row => Number(row.id) === Number(staleOffer.id));
      didExpire = Boolean(verified && verified.status === 'cancelled');
    }
    if (!didExpire) {
      await notifyRuntimeError('game-timeout:expire-pending-offer', new Error('Could not expire stale pending game offer'), {
        gameId: Number(staleOffer.id),
        playerId: Number(staleOffer.player_id),
        opponentId: Number(staleOffer.opponent_id),
        ageSeconds: Number.isFinite(offerAge) ? Math.floor(offerAge / 1000) : 'unknown'
      });
      continue;
    }
    for (const targetId of [Number(staleOffer.player_id), Number(staleOffer.opponent_id)]) {
      if (!Number.isSafeInteger(targetId) || targetId <= 0) continue;
      try {
        await api.sendMessage({ chat_id: targetId, text: '⌛ د ګېم غوښتنې وخت پای ته رسېدلی؛ دا ګېم نور فعال نه دی. نوې غوښتنه پیلولای شې.' });
      } catch (notifyError) {
        console.warn('Could not notify player about expired game offer', {
          gameId: Number(staleOffer.id), targetId, notifyError
        });
      }
    }
  }
  rows = await db.select().from(game_sessions).all();
  for (const game of rows.filter(row => row.status === 'waiting' || row.status === 'pending')) {
    const timerStart = game.status === 'pending' ? (game.updated_at || game.created_at) : game.created_at;
    const age = now - Date.parse(timerStart || '');
    if (!Number.isFinite(age)) continue;
    if (game.status !== 'waiting') continue;
    if (allConnectionRequests.some(row => ['searching', 'pending', 'matching'].includes(row.status) &&
        (Number(row.requester_id) === Number(game.player_id) || Number(row.recipient_id) === Number(game.player_id)))) continue;
    const isFreshGame = row => { const start = row.status === 'waiting' ? (row.created_at || row.updated_at) : (row.updated_at || row.created_at); const age = now - Date.parse(start || ''); return Number.isFinite(age) && age < waitSeconds * 1000; };
    // Even an expired waiting request remains occupied until this pass resolves it
    // against the bot; don't offer that player a second game earlier in the same pass.
    const busyGameIds = new Set(rows.filter(row => ['pending','playing'].includes(row.status) && isFreshGame(row)).flatMap(row => [Number(row.player_id), Number(row.opponent_id || 0)]).concat(rows.filter(row => row.status === 'waiting').map(row => Number(row.player_id))).concat(rows.filter(row => row.status === 'settlement_error').flatMap(row => [Number(row.player_id), Number(row.opponent_id || 0)])));
    const candidates = allUsers.filter(candidate => {
      const id = Number(candidate.telegram_id);
      if (id === Number(game.player_id) || id === Number(game.opponent_id || 0) || Number(candidate.is_blocked) === 1 || Number(candidate.stars || 0) < requiredBalance) return false;
      const last = Date.parse(candidate.last_active_at || '');
      if (!Number.isFinite(last) || now - last > waitSeconds * 1000) return false;
      if (busyGameIds.has(id)) return false;
      if (allConnectionRequests.some(row => ['searching', 'pending', 'matching'].includes(row.status) &&
          (Number(row.requester_id) === id || Number(row.recipient_id) === id))) return false;
      if (allSessions.some(row => row.status === 'connected' && (Number(row.first_user_telegram_id) === id || Number(row.second_user_telegram_id) === id))) return false;
      if (allBlocks.some(row =>
          (Number(row.blocker_telegram_id) === id && Number(row.blocked_telegram_id) === Number(game.player_id)) ||
          (Number(row.blocker_telegram_id) === Number(game.player_id) && Number(row.blocked_telegram_id) === id))) return false;
      const recentlyRejected = rows.some(row => {
        if (Number(row.player_id) !== Number(game.player_id) ||
            Number(row.opponent_id) !== id || row.status !== 'rejected') return false;
        const rejectedAt = Date.parse(row.updated_at || row.created_at || '');
        return Number.isFinite(rejectedAt) && now - rejectedAt < waitSeconds * 1000;
      });
      if (recentlyRejected) return false;
      return true;
    }).sort((a,b) => Date.parse(b.last_active_at || '') - Date.parse(a.last_active_at || ''));
    if (!candidates.length) {
      const otherUsers = allUsers.filter(candidate => Number(candidate.telegram_id) !== Number(game.player_id));
      const recentUsers = otherUsers.filter(candidate => {
        const last = Date.parse(candidate.last_active_at || '');
        return Number.isFinite(last) && now - last <= 2 * 60 * 1000;
      });
      const recentWithStars = recentUsers.filter(candidate => Number(candidate.stars || 0) >= requiredBalance);
      const connectedUserIds = new Set(allSessions.filter(row => row.status === 'connected')
        .flatMap(row => [Number(row.first_user_telegram_id), Number(row.second_user_telegram_id)]));
      const activeRequestUserIds = new Set(allConnectionRequests.filter(row => ['searching', 'pending', 'matching'].includes(row.status))
        .flatMap(row => [Number(row.requester_id), Number(row.recipient_id || 0)]));
      const busyUserIds = new Set(rows.filter(row => ['waiting', 'pending', 'playing', 'settlement_error'].includes(row.status))
        .flatMap(row => [Number(row.player_id), Number(row.opponent_id || 0)]));
      console.info('No eligible game opponent found yet', {
        gameId: Number(game.id),
        playerId: Number(game.player_id),
        otherUsers: otherUsers.length,
        notBlockedUsers: otherUsers.filter(candidate => Number(candidate.is_blocked) !== 1).length,
        recentUsers: recentUsers.length,
        recentUsersWithEnoughStars: recentWithStars.length,
        connectedUsers: otherUsers.filter(candidate => connectedUserIds.has(Number(candidate.telegram_id))).length,
        usersWithActiveConnectionRequests: otherUsers.filter(candidate => activeRequestUserIds.has(Number(candidate.telegram_id))).length,
        usersBusyWithGames: otherUsers.filter(candidate => busyUserIds.has(Number(candidate.telegram_id))).length,
        waitSeconds
      });
      if (age < waitSeconds * 1000) continue;
      const claimedForBot = await db.update(game_sessions)
        .set({ status: 'playing', updated_at: new Date().toISOString() })
        .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'waiting')))
        .returning({ id: game_sessions.id }).run();
      if (!claimedForBot || !Array.isArray(claimedForBot.rows) || claimedForBot.rows.length === 0) continue;
      const playingGame = await db.select().from(game_sessions).where(eq(game_sessions.id, Number(game.id))).get();
      if (playingGame && playingGame.status === 'playing') {
        try {
          await resolveBotGame(playingGame);
        } catch (error) {
          reportDiagnostic('message-handler', 'Bot game resolution failed unexpectedly', {
            gameId: Number(game.id),
            playerId: Number(game.player_id),
            error: error && (error.message || String(error))
          });
          // Never leave a claimed game permanently in "playing" or risk a second settlement.
          // Only the still-playing row can be moved to settlement_error.
          try {
            const failed = await db.update(game_sessions)
              .set({ status: 'settlement_error', updated_at: new Date().toISOString() })
              .where(and(
                eq(game_sessions.id, Number(game.id)),
                eq(game_sessions.status, 'playing')
              ))
              .returning({ id: game_sessions.id }).run();
            if (failed && Array.isArray(failed.rows) && failed.rows.length > 0) {
              try {
                await api.sendMessage({
                  chat_id: Number(game.player_id),
                  text: '⚠️ د بوټ پر وړاندې د ګېم پر مهال تخنیکي ستونزه رامنځته شوه. د ستورو او پایلې حالت باید اډمین وڅېړي؛ مهرباني وکړه نوی ګېم مه پیلوه.'
                });
              } catch (notifyError) {
                reportDiagnostic('message-handler', 'Could not notify player about bot game settlement error', {
                  gameId: Number(game.id), notifyError
                });
              }
            }
          } catch (stateError) {
            reportDiagnostic('message-handler', 'Could not mark bot game settlement error', {
              gameId: Number(game.id), stateError
            });
          }
        }
      }
      continue;
    }
    // Telegram may reject a recipient who blocked the bot or is unreachable.
    // Retry the next eligible candidate instead of silently leaving the request waiting.
    let offerDelivered = false, lastDeliveryError = null;
    for (const candidate of candidates) {
      const candidateId = Number(candidate.telegram_id);
      const offeredAt = new Date().toISOString();
      const claimed = await db.update(game_sessions)
        .set({ opponent_id: candidateId, status: 'pending', updated_at: offeredAt })
        .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'waiting')))
        .returning({ id: game_sessions.id }).run();
      let didClaim = Boolean(claimed && Array.isArray(claimed.rows) && claimed.rows.length > 0);
      // The Serverless adapter may apply the update but return no RETURNING rows.
      // Verify the exact persisted state before abandoning the candidate.
      if (!didClaim) {
        const verifyGames = await db.select().from(game_sessions).all();
        const verifiedGame = verifyGames.find(row =>
          Number(row.id) === Number(game.id) &&
          Number(row.player_id) === Number(game.player_id)
        );
        didClaim = Boolean(verifiedGame &&
          verifiedGame.status === 'pending' &&
          Number(verifiedGame.opponent_id) === candidateId &&
          verifiedGame.updated_at === offeredAt);
      }
      if (!didClaim) continue;
      // Keep the in-memory snapshot current so this same matcher run cannot offer one candidate multiple games.
      game.opponent_id = candidateId;
      game.status = 'pending';
      game.updated_at = offeredAt;

      try {
        await api.sendMessage({
          chat_id: candidateId,
          text: '🎲 یو فعال کارن غواړي له تا سره د ګېم لوبه وکړي.\n\nد لوبې لپاره لږ تر لږه ' + requiredBalance + ' ستوري پکار دي. د ګټلو جایزه ' + minStars + ' ده او فیس ' + fee + ' له جایزې کمېږي. د منلو یا ردولو انتخاب وکړه.',
          reply_markup: styleKeyboardMarkup({ inline_keyboard: [[
            { text: '✅ ګېم منل', callback_data: 'game:accept:' + game.id },
            { text: '❌ ردول', callback_data: 'game:reject:' + game.id }
          ]] })
        });
        offerDelivered = true;
        console.info('Game offer delivered', {
          gameId: Number(game.id),
          playerId: Number(game.player_id),
          candidateId
        });
        break;
      } catch (error) {
        const errorDescription = String(error && (error.description || error.message || error.stack) || error || 'Unknown Telegram delivery error');
        lastDeliveryError = {
          description: errorDescription,
          errorCode: error && (error.error_code || error.code) || null
        };
        reportDiagnostic('message-handler', 'Game offer delivery failed; checking style compatibility and then trying next candidate', {
          gameId: Number(game.id),
          playerId: Number(game.player_id),
          candidateId,
          errorCode: lastDeliveryError.errorCode,
          description: errorDescription
        });

        // If the Telegram gateway/SDK rejects only the new button style field,
        // retry this same offer once without styles before abandoning this candidate.
        if (/style|keyboardbutton|inline keyboard button/i.test(errorDescription)) {
          try {
            await api.sendMessage({
              chat_id: candidateId,
              text: '🎲 یو فعال کارن غواړي له تا سره د ګېم لوبه وکړي.\n\nد لوبې لپاره لږ تر لږه ' + requiredBalance + ' ستوري پکار دي. د ګټلو جایزه ' + minStars + ' ده او فیس ' + fee + ' له جایزې کمېږي. د منلو یا ردولو انتخاب وکړه.',
              reply_markup: { inline_keyboard: [[
                { text: '✅ ګېم منل', callback_data: 'game:accept:' + game.id },
                { text: '❌ ردول', callback_data: 'game:reject:' + game.id }
              ]] }
            });
            offerDelivered = true;
            console.warn('Game offer delivered using unstyled keyboard compatibility fallback', {
              gameId: Number(game.id), playerId: Number(game.player_id), candidateId
            });
            break;
          } catch (fallbackError) {
            const fallbackDescription = String(fallbackError && (fallbackError.description || fallbackError.message || fallbackError.stack) || fallbackError);
            lastDeliveryError = {
              description: errorDescription + ' | unstyled fallback: ' + fallbackDescription,
              errorCode: fallbackError && (fallbackError.error_code || fallbackError.code) || lastDeliveryError.errorCode
            };
            reportDiagnostic('message-handler', 'Unstyled game offer fallback also failed', {
              gameId: Number(game.id), candidateId,
              errorCode: lastDeliveryError.errorCode,
              description: fallbackDescription
            });
          }
        }

        try {
          const reset = await db.update(game_sessions)
            .set({ status: 'waiting', opponent_id: null, updated_at: new Date().toISOString() })
            .where(and(
              eq(game_sessions.id, Number(game.id)),
              eq(game_sessions.status, 'pending'),
              eq(game_sessions.opponent_id, candidateId)
            ))
            .returning({ id: game_sessions.id }).run();
          if (!reset || !Array.isArray(reset.rows) || reset.rows.length === 0) {
            reportDiagnostic('message-handler', 'Could not reset undelivered game offer safely', {
              gameId: Number(game.id), candidateId
            });
            break;
          }
          game.status = 'waiting';
          game.opponent_id = null;
          game.updated_at = new Date().toISOString();
        } catch (resetError) {
          reportDiagnostic('message-handler', 'Error resetting undelivered game offer', {
            gameId: Number(game.id), candidateId, error: resetError
          });
          break;
        }
      }
    }
    if (!offerDelivered && candidates.length > 0) {
      // All eligible candidates failed Telegram delivery. Do not leave an invisible
      // waiting game that blocks connection search forever; close only the exact
      // state this matcher last wrote, so a concurrent accept/cancel is preserved.
      // Re-read the persisted row instead of relying only on the in-memory
      // timestamp: gateways may normalize timestamp precision between writes.
      // Close only waiting/pending offers; never overwrite a concurrent accept.
      let closed = false;
      let latestGame = null;
      try {
        const latestRows = await db.select().from(game_sessions).all();
        latestGame = latestRows.find(row =>
          Number(row.id) === Number(game.id) &&
          Number(row.player_id) === Number(game.player_id)
        ) || null;
        if (latestGame && ['waiting', 'pending'].includes(latestGame.status)) {
          const conditions = [
            eq(game_sessions.id, Number(latestGame.id)),
            eq(game_sessions.player_id, Number(game.player_id)),
            eq(game_sessions.status, latestGame.status),
            eq(game_sessions.updated_at, latestGame.updated_at)
          ];
          if (latestGame.status === 'pending' && Number(latestGame.opponent_id || 0) > 0) {
            conditions.push(eq(game_sessions.opponent_id, Number(latestGame.opponent_id)));
          } else if (latestGame.status === 'waiting') {
            conditions.push(eq(game_sessions.opponent_id, null));
          }
          const closedResult = await db.update(game_sessions)
            .set({ status: 'cancelled', updated_at: new Date().toISOString() })
            .where(and(...conditions))
            .returning({ id: game_sessions.id }).run();
          closed = Boolean(closedResult && Array.isArray(closedResult.rows) && closedResult.rows.length > 0);
          // Verify persisted state because this Serverless adapter can apply a
          // write while returning an empty RETURNING result.
          if (!closed) {
            const verifyRows = await db.select().from(game_sessions).all();
            const verified = verifyRows.find(row =>
              Number(row.id) === Number(latestGame.id) &&
              Number(row.player_id) === Number(game.player_id)
            );
            closed = Boolean(verified && verified.status === 'cancelled');
          }
        }
      } catch (closeError) {
        reportDiagnostic('message-handler', 'Could not close game after all candidate deliveries failed', {
          gameId: Number(game.id), playerId: Number(game.player_id), closeError
        });
      }
      console.warn('No game offer could be delivered to any eligible candidate', {
        gameId: Number(game.id),
        playerId: Number(game.player_id),
        candidateCount: candidates.length,
        latestStatus: latestGame && latestGame.status,
        requestClosed: closed,
        lastDeliveryError
      });
      await notifyRuntimeError('game-matchmaking:offer-delivery', lastDeliveryError
        ? new Error('Telegram sendMessage failed: ' + String(lastDeliveryError.description || 'unknown Telegram error') +
          '; errorCode=' + String(lastDeliveryError.errorCode || 'unknown'))
        : new Error('No eligible candidate accepted Telegram message delivery; no Telegram send error was captured'), {
        gameId: Number(game.id),
        playerId: Number(game.player_id),
        candidateCount: candidates.length,
        latestStatus: latestGame && latestGame.status,
        requestClosed: closed
      });
      try {
        await api.sendMessage({
          chat_id: Number(game.player_id),
          text: closed
            ? '⚠️ مناسب سیال پیدا شو، خو ټیلیګرام ټولو هڅه شویو سیالانو ته پیغام ونه لېږه. د ګېم غوښتنه لغوه شوه؛ اوس بیا ګېم یا ناڅاپي اړیکه پیلولای شې.'
            : '⚠️ سیال ته د ګېم پیغام ونه لېږل شو. که د ګېم غوښتنه لا فعاله وي، لاندې «❌ ګېم لغوه کول» تڼۍ ووهه. که ستونزه دوام وکړي، اډمین ته خبر ورکړه.',
          ...(!closed && latestGame && ['waiting', 'pending'].includes(latestGame.status)
            ? { reply_markup: { inline_keyboard: [[{ text: '❌ ګېم لغوه کول', callback_data: 'game:cancel' }]] } }
            : {})
        });
      } catch (notifyError) {
        reportDiagnostic('message-handler', 'Could not notify game requester about offer delivery failure', {
          gameId: Number(game.id), playerId: Number(game.player_id), notifyError
        });
      }
    }
  }
}
// ── Admin settings and admin workflows ──
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
    ['game_min_stars','⭐ د لوبې لږ تر لږه بیلانس / د ګټلو جایزه',3.5],
    ['game_fee_stars','💰 د لوبې فیس',0.5], ['game_win_points','⭐ د ګټلو نمرې',1],
    ['game_wait_seconds','⏱ د سیال انتظار ثانیې',120]
  ];
  let text = '🎲 د ګېم تنظیمات\n\n';
  const rows = [];
  for (const item of keys) { text += item[1] + ': ' + await getSetting(item[0], item[2]) + '\n\n'; rows.push([{ text: item[1], callback_data: 'admin:setting:' + item[0] }]); }
  rows.push([{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]);
  await sendPrompt(chatId, text, { inline_keyboard: rows }, user);
}

// ── Incoming message routing ──
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
      last_prompt_id: 0, last_active_at: new Date().toISOString(), created_at: new Date().toISOString()
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
  // Run expiry before any state-specific early return: the next message after a timeout
  // must release this user's stale game/connection rows and restore the menu state.
  try { await expireUserTimedActions(id); } catch (expiryError) {
    await notifyRuntimeError('message:expire-user-actions', expiryError, { userId: id, text: input });
  }
  if (Number(user.is_blocked) !== 1) { try { await db.update(users).set({ last_active_at: new Date().toISOString() }).where(eq(users.telegram_id, id)).run(); } catch (e) {} }
  if (Number(user.is_blocked) === 1) {
    await sendPrompt(chatId, tx(user).blocked, { remove_keyboard: true }, user);
    return;
  }
  // Test-bot recovery command: allow an administrator to release games left in settlement_error.
  // This only changes the game status; it does not alter any user's stars or points.
  if (input === '/cleartestgames' || input === '/cleartestgames@' + String((await getSetting('bot_username', '') || '')).replace(/^@/, '')) {
    if (!(await isAdmin(id))) {
      await sendPrompt(chatId, '⛔ دا امر یوازې د اډمین لپاره دی.', menuKeyboard(user, false), user);
      return;
    }
    const failedGames = await db.select().from(game_sessions).all();
    let cleared = 0;
    for (const game of failedGames.filter(row => row.status === 'settlement_error')) {
      const result = await db.update(game_sessions)
        .set({ status: 'cancelled', updated_at: new Date().toISOString() })
        .where(and(eq(game_sessions.id, Number(game.id)), eq(game_sessions.status, 'settlement_error')))
        .returning({ id: game_sessions.id }).run();
      if (result && Array.isArray(result.rows) && result.rows.length > 0) {
        cleared++;
      } else {
        const verified = await db.select().from(game_sessions).where(eq(game_sessions.id, Number(game.id))).get();
        if (verified && verified.status === 'cancelled') cleared++;
      }
    }
    await sendPrompt(chatId, '✅ د ټېسټ بوټ د خراب حالت پاتې لوبې پاکې شوې.\nلغوه شوې لوبې: ' + cleared + '\n\nیادونه: د لوبغاړو ستوري او نمرې نه دي بدل شوي.', menuKeyboard(user, await isAdmin(id)), user);
    return;
  }
  if (Number(user.welcome_reward_claimed || 0) !== 1) {
    const welcomeStars = Number(await getSetting('welcome_reward_stars', 10));
    const welcomePoints = Number(await getSetting('welcome_reward_points', 3));
    const welcomeLikes = Number(await getSetting('welcome_reward_likes', 2));
    const baseStars = Number(user.stars || 0), basePoints = Number(user.points || 0), baseLikes = Number(user.likes || 0);
    const rewardClaim = await db.update(users).set({
      stars: baseStars + welcomeStars, points: basePoints + welcomePoints, likes: baseLikes + welcomeLikes, welcome_reward_claimed: 1
    }).where(and(
      eq(users.telegram_id, id), eq(users.welcome_reward_claimed, 0),
      eq(users.stars, baseStars), eq(users.points, basePoints), eq(users.likes, baseLikes)
    )).returning({ telegram_id: users.telegram_id }).run();
    const rewardClaimed = Boolean(rewardClaim && Array.isArray(rewardClaim.rows) && rewardClaim.rows.length > 0);
    if (rewardClaimed) {
      user.stars = baseStars + welcomeStars; user.points = basePoints + welcomePoints; user.likes = baseLikes + welcomeLikes; user.welcome_reward_claimed = 1;
    } else {
      // Another update or handler won the compare-and-set; refresh and retry on a later message.
      user = await getUser(id);
    }
    if (rewardClaimed) {
    const welcomeText = user.language === 'en'
      ? '🎉 Welcome! Your welcome reward has been added to your account.\n\n⭐ Stars: ' + welcomeStars + '\n🏆 Points: ' + welcomePoints + '\n❤️ Likes: ' + welcomeLikes
      : user.language === 'fa'
        ? '🎉 خوش آمدید! جایزه خوش‌آمدگویی به حساب شما اضافه شد.\n\n⭐ ستاره: ' + welcomeStars + '\n🏆 امتیاز: ' + welcomePoints + '\n❤️ لایک: ' + welcomeLikes
        : user.language === 'ur'
          ? '🎉 خوش آمدید! آپ کا استقبالی انعام آپ کے اکاؤنٹ میں شامل کر دیا گیا ہے۔\n\n⭐ ستارے: ' + welcomeStars + '\n🏆 پوائنٹس: ' + welcomePoints + '\n❤️ لائکس: ' + welcomeLikes
          : user.language === 'ar'
            ? '🎉 أهلاً بك! أُضيفت مكافأة الترحيب إلى حسابك.\n\n⭐ النجوم: ' + welcomeStars + '\n🏆 النقاط: ' + welcomePoints + '\n❤️ الإعجابات: ' + welcomeLikes
            : '🎉 ښه راغلاست! ستا د ښه راغلاست جایزه ستا حساب ته اضافه شوه.\n\n⭐ ستوري: ' + welcomeStars + '\n🏆 نمرې: ' + welcomePoints + '\n❤️ لایکونه: ' + welcomeLikes;
    try { await api.sendMessage({ chat_id: chatId, text: welcomeText }); } catch (e) { reportDiagnostic('message-handler', 'Welcome reward notification failed', e); }
    }
  }
  // Keep user messages visible; only replace the bot's previous prompt.
  const protectedStates = ['admin_menu', 'admin_management_menu', 'admin_channels_menu', 'waiting_admin_id', 'waiting_remove_admin_id', 'waiting_channel_details', 'waiting_broadcast', 'waiting_user_settings_id'];
  const adminEditState = /^(admin_edit_user_photo|admin_send_user_message):\d+$/.test(String(user.state || '')) || /^admin_adjust_balance:(stars|points|likes):(add|sub):\d+$/.test(String(user.state || '')) || /^admin_edit_user_(name|surname):\d+$/.test(String(user.state || ''));
  if ((protectedStates.includes(user.state) || /^waiting_edit_channel_id:-?\d+$/.test(String(user.state || '')) || adminEditState) && !(await isAdmin(id))) {
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
    const allowed = ['welcome_reward_stars','welcome_reward_points','welcome_reward_likes','referral_reward_stars','referral_reward_points','referral_reward_likes','connection_search_seconds','connection_idle_minutes','connection_max_minutes','connection_cost_stars','game_min_stars','game_fee_stars','game_win_points','game_wait_seconds'];
    if (!(await isAdmin(id))) { await db.update(users).set({ state: 'ready' }).where(eq(users.telegram_id, id)).run(); user.state = 'ready'; await sendPrompt(chatId, tx(user).noAccess, menuKeyboard(user, false), user); return; }
    if (!allowed.includes(key) || !Number.isFinite(value) || value < 0 || value > 1000000 || ((key.startsWith('welcome_reward_') || key.startsWith('referral_reward_') || key.includes('seconds') || key.includes('minutes') || key === 'game_win_points') && !Number.isInteger(value))) { await sendPrompt(chatId, '⚠️ معتبر عدد ولیکه. د ستورو فیس اعشاري کېدای شي، لکه 0.5.', { force_reply: true }, user); return; }
    if (key === 'game_fee_stars' || key === 'game_min_stars') {
      const prize = key === 'game_min_stars' ? value : Number(await getSetting('game_min_stars', 3.5));
      const configuredFee = key === 'game_fee_stars' ? value : Number(await getSetting('game_fee_stars', 0.5));
      if (!Number.isFinite(prize) || prize <= 0 || !Number.isFinite(configuredFee) || configuredFee < 0 || configuredFee >= prize) {
        await sendPrompt(chatId, '⚠️ د لوبې فیس باید له جایزې څخه کم وي. لومړی مناسب مقدار وټاکه، بیا بیا هڅه وکړه.', { force_reply: true }, user);
        return;
      }
    }
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
  if (/^waiting_channel_invite_link:-?\d+:(?:new|-?\d+)$/.test(String(user.state || ''))) {
    const match = String(user.state).match(/^waiting_channel_invite_link:(-?\d+):(new|-?\d+)$/);
    const requestedId = match[1];
    const originalId = match[2] === 'new' ? '' : match[2];
    const inviteLink = input.trim();
    const backToChannels = async (message) => {
      user.state = 'admin_channels_menu';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, message, channelKeyboard(user), user);
    };
    if (action === 'cancel' || input === '/cancel') {
      await backToChannels(tx(user).cancel);
      return;
    }
    if (!/^https?:\/\/t\.me\//i.test(inviteLink)) {
      await sendPrompt(chatId, tx(user).badChannelInviteLink, { force_reply: true }, user);
      return;
    }
    let chat;
    try {
      chat = await api.getChat({ chat_id: requestedId });
    } catch (e) {
      await backToChannels(channelError(user, 'invalid'));
      return;
    }
    if (!chat || !['group', 'supergroup', 'channel'].includes(chat.type)) {
      await backToChannels(channelError(user, 'invalid'));
      return;
    }
    const existing = await db.select().from(required_chats).where(eq(required_chats.chat_id, requestedId)).get();
    if (existing && (!originalId || String(existing.chat_id) !== originalId)) {
      await backToChannels(tx(user).channelExists);
      return;
    }
    const chatType = chat.type === 'channel' ? 'channel' : 'group';
    const title = String(chat.title || chat.first_name || chat.username || requestedId).replace(/^(channel|group)::/, '');
    if (originalId) {
      await db.update(required_chats).set({
        chat_id: requestedId, invite_link: inviteLink,
        title: chatType + '::' + title, is_active: 1
      }).where(eq(required_chats.chat_id, originalId)).run();
    } else {
      await db.insert(required_chats).values({
        chat_id: requestedId, invite_link: inviteLink,
        title: chatType + '::' + title, is_active: 1,
        created_at: new Date().toISOString()
      }).run();
    }
    const verified = await db.select().from(required_chats).where(eq(required_chats.chat_id, requestedId)).get();
    if (!verified || String(verified.invite_link || '') !== inviteLink) {
      await backToChannels('⚠️ ' + tx(user).saved);
      return;
    }
    await backToChannels(tx(user).channelAdded);
    return;
  }
  if (user.state === 'waiting_channel_type') {
    if (action === 'cancel' || input === '/cancel') {
      user.state = 'admin_channels_menu';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).cancel, channelKeyboard(user), user);
      return;
    }
    if (action === 'publicChannel' || action === 'privateChannel') {
      user.state = action === 'publicChannel' ? 'waiting_public_channel_details' : 'waiting_private_channel_details';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askChannel, { force_reply: true }, user);
      return;
    }
    await sendPrompt(chatId, tx(user).channelTypePrompt, keyboard([
      [{ text: tx(user).channelTypeButtons[0] }, { text: tx(user).channelTypeButtons[1] }],
      [{ text: tx(user).cancel }]
    ]), user);
    return;
  }
  if (user.state === 'waiting_channel_details' || user.state === 'waiting_public_channel_details' ||
      user.state === 'waiting_private_channel_details' || /^waiting_edit_channel_id:-?\d+$/.test(String(user.state || ''))) {
    const editing = /^waiting_edit_channel_id:-?\d+$/.test(String(user.state || ''));
    const isPublicAdd = user.state === 'waiting_public_channel_details';
    const isPrivateAdd = user.state === 'waiting_private_channel_details';
    const originalId = editing ? String(user.state).slice('waiting_edit_channel_id:'.length) : '';
    const requestedId = input.trim();
    const backToChannels = async (message) => { user.state = 'admin_channels_menu'; await db.update(users).set({ state: 'admin_channels_menu' }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, message, channelKeyboard(user), user); };
    if (!requestedId || !/^-?\d+$/.test(requestedId) || !Number.isSafeInteger(Number(requestedId))) { await backToChannels(tx(user).channelFormat); return; }
    const existing = await db.select().from(required_chats).where(eq(required_chats.chat_id, requestedId)).get();
    if (existing && (!editing || String(existing.chat_id) !== originalId)) { await backToChannels(tx(user).channelExists); return; }
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

    // For private additions, never call Telegram's invite-link creation APIs.
    // Ask for an already-existing link immediately after validating the chat ID.
    if (isPrivateAdd) {
      user.state = 'waiting_channel_invite_link:' + requestedId + ':new';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askChannelInviteLink, { force_reply: true }, user);
      return;
    }

    if (isPublicAdd && !chat.username) {
      await backToChannels(tx(user).channelPublicOnly);
      return;
    }
    let inviteLink = isPublicAdd ? 'https://t.me/' + chat.username :
      (chat.invite_link || (chat.username ? 'https://t.me/' + chat.username : ''));
    if (!inviteLink && !isPublicAdd) {
      try {
        const invite = await api.createChatInviteLink({ chat_id: requestedId });
        inviteLink = invite && invite.invite_link ? invite.invite_link : '';
      } catch (createError) {
        // Some Telegram API adapters expose exportChatInviteLink but not
        // createChatInviteLink. Try the legacy method before rejecting a
        // private group/channel that the bot is allowed to manage.
        try {
          inviteLink = await api.exportChatInviteLink({ chat_id: requestedId }) || '';
        } catch (exportError) {
          reportDiagnostic('message-handler', 'Could not create required-chat invite link', {
            chatId: requestedId, createError, exportError
          });
        }
      }
    }
    if (!(String(inviteLink || '').startsWith('https://t.me/') || String(inviteLink || '').startsWith('http://t.me/'))) {
      // Bot is an admin but Telegram may deny it permission to manage invite links.
      // Let the admin supply an existing invite link manually instead of failing.
      user.state = 'waiting_channel_invite_link:' + requestedId + ':' + (editing ? originalId : 'new');
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).askChannelInviteLink, { force_reply: true }, user);
      return;
    }
    const chatType = chat.type === 'channel' ? 'channel' : 'group';
    const title = String(chat.title || chat.first_name || chat.username || requestedId).replace(/^(channel|group)::/, '');
    if (editing) {
      await db.update(required_chats).set({ chat_id: requestedId, invite_link: inviteLink, title: chatType + '::' + title, is_active: 1 })
        .where(eq(required_chats.chat_id, originalId)).run();
      const verified = await db.select().from(required_chats).where(eq(required_chats.chat_id, requestedId)).get();
      if (!verified) { await backToChannels('⚠️ بدلون تایید نه شو؛ بیا هڅه وکړه.'); return; }
      await backToChannels('✅ ګروپ یا چینل بدل شو.'); return;
    }
    await db.insert(required_chats).values({ chat_id: requestedId, invite_link: inviteLink, title: chatType + '::' + title, is_active: 1, created_at: new Date().toISOString() }).run();
    await backToChannels(tx(user).channelAdded); return;
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

  const controlAction = sessionControlAction(input);
  if (controlAction) {
    const activeSession = await activeSessionFor(id);
    if (controlAction === 'end') {
      if (activeSession) await endConnection(activeSession, 'user_ended');
      else await sendPrompt(chatId, tx(user).sessionText.noActive, menuKeyboard(user, await isAdmin(id)), user);
      return;
    }
    if (controlAction === 'profile') {
      if (activeSession) await showSessionProfileFromMessage(activeSession, id);
      else await sendPrompt(chatId, tx(user).sessionText.noProfile, menuKeyboard(user, await isAdmin(id)), user);
      return;
    }
    if (controlAction === 'delete_recent') {
      const session = activeSession || await latestSessionForUser(id);
      if (!session) {
        await sendPrompt(chatId, tx(user).sessionText.noPrevious, menuKeyboard(user, await isAdmin(id)), user);
        return;
      }
      const deleted = await deleteRecentPartnerMessages(session, id);
      const keyboard = activeSession ? sessionControlKeyboard(user) : sessionEndedKeyboard(user, await isAdmin(id));
      await sendPrompt(chatId, '🗑 د ملګري ' + deleted + ' پیغامونه د وروستیو ۱۰ دقیقو له لېست څخه حذف شول. یوازې هغه پیغامونه حذفېږي چې بوټ یې په دې چټ کې کاپي کړي وي.', keyboard, user);
      return;
    }
  }

  const sessionForRelay = await activeSessionFor(id);
  if (sessionForRelay && action === null && !start) { await relayConnectionMessage(message, sessionForRelay); return; }

  if (user.state === 'settings_menu') {
    if (action === 'profileSettings') { user.state = 'profile_settings_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, tx(user).profileSettingsTitle, profileSettingsKeyboard(user), user); return; }
    if (action === 'photoSettings') { user.state = 'settings_photo_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, (user.profile_photo_id ? '✅ ' : '➖ ') + (user.language === 'en' ? 'Profile photo settings:' : user.language === 'fa' ? 'تنظیمات عکس پروفایل:' : user.language === 'ur' ? 'پروفائل تصویر کی ترتیبات:' : user.language === 'ar' ? 'إعدادات صورة الملف الشخصي:' : 'د پروفایل عکس تنظیمات:'), photoSettingsKeyboard(user), user); return; }
    if (action === 'channelSettings') { user.state = 'settings_channel_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, (user.channel_username ? user.channel_username + '\n' : '➖ ') + (user.language === 'en' ? 'Public channel settings:' : user.language === 'fa' ? 'تنظیمات کانال عمومی:' : user.language === 'ur' ? 'عوامی چینل کی ترتیبات:' : user.language === 'ar' ? 'إعدادات القناة العامة:' : 'د عام چینل تنظیمات:'), channelSettingsKeyboard(user), user); return; }
    if (action === 'favoriteSettings') { user.state = 'settings_favorites_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, user.language === 'en' ? '❤️ Manage favorite friends:' : user.language === 'fa' ? '❤️ مدیریت دوستان محبوب:' : user.language === 'ur' ? '❤️ پسندیدہ دوستوں کا انتظام:' : user.language === 'ar' ? '❤️ إدارة الأصدقاء المفضلين:' : '❤️ د پالو ملګرو تنظیمات:', favoriteSettingsKeyboard(user), user); return; }
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
    const field = i >= 0 ? ['adminManagement','channels','broadcast','userSettings','usersList','back','rewardSettings','connectionAdminSettings','gameAdminSettings'][i] : action;
    if (field === 'rewardSettings') { await renderAdminRewardSettings(chatId, user); return; }
    if (field === 'connectionAdminSettings') { await renderAdminConnectionSettings(chatId, user); return; }
    if (field === 'gameAdminSettings') { await renderAdminGameSettings(chatId, user); return; }
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
    const field = i >= 0 ? ['channelAdd', 'channelList', 'back'][i] : action;
    if (field === 'channelAdd') {
      user.state = 'waiting_channel_type';
      await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run();
      await sendPrompt(chatId, tx(user).channelTypePrompt, keyboard([
        [{ text: tx(user).channelTypeButtons[0] }, { text: tx(user).channelTypeButtons[1] }],
        [{ text: tx(user).cancel }]
      ]), user);
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
    const allowedDuringChat = ['find','random','invite','profile','language','settings','stats','admin','game','leaderboards'];
    if (session && !allowedDuringChat.includes(quickAction) && !start) { await relayConnectionMessage(message, session); return; }
  }
  if (!['ready','searching_connection'].includes(user.state)) { await showLanguage(chatId, user); return; }
  if (user.state === 'searching_connection' && !['/start'].includes(input)) {
    const quickAction = actionFor(input);
    if (!['settings','profile','stats','invite','language','admin','game','leaderboards','find','random'].includes(quickAction)) return;
  }
  const field = action;
  const mainMenuActions = ['find','random','invite','profile','language','settings','stats','admin','game','leaderboards'];
  if (mainMenuActions.includes(field) && !(await checkMembership(id))) {
    await showMembership(chatId, user);
    return;
  }
  if (field === 'find') await sendPrompt(chatId, '🔎 کوم ډول ملګری غواړې؟', { inline_keyboard: [[{ text: '👨 نارینه', callback_data: 'find:gender:male' }, { text: '👩 ښځینه', callback_data: 'find:gender:female' }], [{ text: '🌐 اتومات', callback_data: 'find:gender:auto' }], [{ text: '❌ لغوه', callback_data: 'find:cancel' }]] }, user);
  else if (field === 'random') {
    const cost = Number(await getSetting('connection_cost_stars', 1));
    if (Number(user.stars || 0) < cost) await sendPrompt(chatId, '⭐ د ناڅاپي اړیکې لپاره لږ تر لږه ' + cost + ' ستوري پکار دي. ستا بیلانس: ' + Number(user.stars || 0), menuKeyboard(user, await isAdmin(id)), user);
    else await sendPrompt(chatId, '🎲 ناڅاپي اړیکه پیل کړو؟\n\nد غوښتنې د منلو پر مهال به ' + cost + ' ستوری کم شي.\n\nغواړې غوښتنه واستوې؟', { inline_keyboard: [[{ text: '✅ تایید او غوښتنه واستوه', callback_data: 'conn:confirm:random' }, { text: '❌ لغوه', callback_data: 'conn:cancel' }]] }, user);
  }
  else if (field === 'game') await startDiceGame(chatId, user);
  else if (field === 'leaderboards') await sendPrompt(chatId, '🏆 لوړ رتبه کسان\n\nلاندې درجه‌بندي وټاکه:', { inline_keyboard: [[{ text: '🏆 تر ټولو ډېرې نمرې', callback_data: 'admin:rank:points' }], [{ text: '📨 تر ټولو ډېر ریفرلونه', callback_data: 'admin:rank:referrals' }], [{ text: '👥 تر ټولو ډېر فالو', callback_data: 'admin:rank:follows' }], [{ text: '❤️ تر ټولو ډېر لایکونه', callback_data: 'admin:rank:likes' }], [{ text: '🔙 اصلي مېنو', callback_data: 'admin:main' }]] }, user);
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

// ── Public event handler ──
export default async function (message) {
  try {
    await processMessage(message);
  } catch (error) {
    await notifyRuntimeError('handlers/message.js', error, {
      updateType: 'message',
      chatId: message && message.chat && message.chat.id,
      userId: message && message.from && message.from.id,
      text: message && message.text
    });
    if (message && message.chat && message.chat.id) {
      try {
        await api.sendMessage({
          chat_id: message.chat.id,
          text: '⚠️ یوه تخنیکي ستونزه رامنځته شوه. مهرباني وکړه /start ولیکه او بیا هڅه وکړه.'
        });
      } catch (sendError) {}
    }
  } finally {
    // Match only after the command response/state transition has completed.
    const userId = message && message.from && message.from.id;
    try { await tryOfferSearches(); } catch (error) { await notifyRuntimeError('message:connection-matching', error, { userId }); }
    try { await tryMatchGames(); } catch (error) { await notifyRuntimeError('message:game-matching', error, { userId }); }
  }
}