import { AGES } from '../lib/shared.js';
import { T } from '../lib/message-text.js';

// ── Keyboard builders and localized UI ──
export function tx(user) { return T[user && T[user.language] ? user.language : 'ps']; }

export function keyboard(rows, extra) {
  const result = { keyboard: rows, resize_keyboard: true };
  if (extra) Object.assign(result, extra);
  return result;
}
export function menuKeyboard(user, admin) {
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
export function ageKeyboard() {
  const rows = [];
  for (let i = 0; i < AGES.length; i += 3) {
    rows.push(AGES.slice(i, i + 3).map(function (age) {
      return { text: String(age), callback_data: 'reg:age:' + String(age) };
    }));
  }
  return { inline_keyboard: rows };
}
export function genderKeyboard(user) {
  return { inline_keyboard: [[
    { text: tx(user).male, callback_data: 'reg:gender:male' },
    { text: tx(user).female, callback_data: 'reg:gender:female' }
  ]] };
}
export function settingsKeyboard(user) {
  const b = tx(user).settingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }]]);
}
export function profileSettingsKeyboard(user) {
  const b = tx(user).profileSettingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }], [{ text: b[4] }, { text: b[5] }], [{ text: b[6] }], [{ text: b[7] }], [{ text: b[8] }]]);
}
export function photoSettingsKeyboard(user) {
  const b = tx(user).photoSettingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }]]);
}
export function channelSettingsKeyboard(user) {
  const b = tx(user).channelSettingsButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }]]);
}
export function favoriteSettingsKeyboard(user) {
  const b = tx(user).favoriteSettingsButtons;
  return keyboard([[{ text: b[0] }], [{ text: b[1] }]]);
}
export function adminKeyboard(user) {
  const b = tx(user).adminButtons;
  return keyboard([[{ text: b[0] }], [{ text: b[1] }, { text: b[2] }], [{ text: b[3] }, { text: b[4] }], [{ text: b[5] }], [{ text: b[6] }], [{ text: b[7] }, { text: b[8] }], [{ text: b[9] }]]);
}
export function adminManagementKeyboard(user) {
  const b = tx(user).adminManagementButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }], [{ text: b[3] }]]);
}
export function adminUserSettingsKeyboard(user, targetId, blocked) {
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

export function channelKeyboard(user) {
  const b = tx(user).channelButtons;
  return keyboard([[{ text: b[0] }, { text: b[1] }], [{ text: b[2] }, { text: b[3] }]]);
}
export function actionFor(input) {
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
