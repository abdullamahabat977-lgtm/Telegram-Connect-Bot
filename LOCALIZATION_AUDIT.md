# د بوټ د ژباړې پلټنه (Localization Audit)

**څانګه:** `fix/game-accept-connection-races`  
**موخه:** په دې پړاو کې یوازې نیمګړې ژباړې موندل شوي؛ ژباړې په قصد نه دي بدلې شوې.  
**ژبې:** پښتو (ps)، دري (fa)، انګلیسي (en)، اردو (ur)، عربي (ar).

## لنډه پایله

- په `tgcloud/handlers/message.js` کې **86** د کارن پر مخ ښکاره کېدونکي متن/بټن ځایونه موندل شوي چې د ژبې له عمومي جدول څخه نه راځي او په ډېرو ځایونو کې یوازې پښتو دي.
- په `tgcloud/handlers/callback_query.js` کې **83** ورته ځایونه موندل شوي.
- د ژباړې د جدولونو د کلیدونو پرتله:
  - `tgcloud/lib/message-text.js`: {"ps":41,"fa":40,"en":40,"ur":40,"ar":40} کلیدونه؛ د پښتو د کلیدونو په پرتله نیمګړي کلیدونه: fa: name, skip, noAccess; en: name, skip, noAccess; ur: name, skip, noAccess; ar: name, skip, noAccess.
  - `tgcloud/lib/callback-text.js`: {"ps":7,"fa":7,"en":7,"ur":7,"ar":7} کلیدونه؛ د پښتو د کلیدونو په پرتله نیمګړي کلیدونه: هیڅ نه.

> یادونه: په لېست کې ځینې متنونه د خطا/پای ته رسېدو نادر حالتونه دي؛ هغه هم باید ژباړل شي، ځکه د ژبې له مخې نه ټاکل کېږي. د کرښو شمېرې د پلټنې د همدې نسخې دي او د راتلونکو اصلاحاتو پر مهال بدلېدای شي.

## tgcloud/handlers/message.js

- **L345:** `const text = '📊 د بوټ احصائیې\n━━━━━━━━━━━━━━\n\n👥 ټول کاروونکي: ' + allUsers.length +`
- **L394:** `rows.push([{ text: '🔙 بېرته', callback_data: 'admin:channels:back' }]);`
- **L395:** `const heading = (notice ? notice + '\n\n' : '') + t.channelButtons[1] + '\n\n' + (list.length ? 'د ګروپ یا چینل د تنظیماتو لپاره یې نوم وټاکه:' : t.channelEmpty);`
- **L436:** `{ text: liked ? '💔 لایک بېرته اخستل' : '❤️ لایک', callback_data: 'session:like:' + targetId + ':' + sessionId }`
- **L443:** `return '👤 نوم: ' + name + '\n\n⚧ جنسیت: ' + gender + '\n\n🔒 د بشپړ پروفایل لپاره لومړی دا کارن فالو کړه.';`
- **L448:** `return '👤 نوم: ' + name + '\n\n⚧ جنسیت: ' + gender + '\n\n🌍 هېواد: ' + (country ? country.label : '—') +`
- **L461:** `const text = '🤝 اړیکه فعاله ده.\n\n' + await sessionProfileText(target, viewerId);`
- **L554:** `rows.push([{ text: '🔙 اصلي مېنو', callback_data: 'settings:main' }]);`
- **L556:** `await sendPrompt(pair.id, '🛑 اړیکه پای ته ورسېده.\n\n👤 د تېر ملګري نوم: ' + name + '\n\nکه غواړې، خپل پاتې نمرې ورکړه یا ملګری فالو کړه. د پیغامونو حذفولو لپاره د کیبورډ تڼۍ وکاروه.', { inline_keyboard: rows }, user);`
- **L561:** `text: '⌨️ د اړیکې له پای وروسته هم د وروستیو ۱۰ دقیقو پیغامونه حذفولای شې.',`
- **L604:** `try { await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د تخنیکي ځنډ له امله لغوه شوه.' }); } catch (e) {}`
- **L619:** `if (Number(offer.recipient_id) > 0) try { await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}`
- **L636:** `try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: '⌛ د ملګري لټون وخت پای ته ورسېد؛ غوښتنه لغوه شوه. بیا هڅه وکړه.' }); } catch (e) {}`
- **L641:** `if (Number(otherOffer.recipient_id) > 0 && Number(otherOffer.recipient_id) !== id) try { await api.sendMessage({ chat_id: Number(otherOffer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}`
- **L667:** `if (playerId > 0 && playerId !== id) try { await api.sendMessage({ chat_id: playerId, text: '⌛ پخوانی ګېم د انتظار د وخت له تېرېدو وروسته لغوه شو. مهرباني وکړه نوی ګېم پیل کړه.' }); } catch (e) {}`
- **L672:** `try { await sendPrompt(id, '⌛ ستا پخوانی عمل د وخت د تېرېدو له امله لغوه شو. دا پیغام یوازې د لغوه کولو لپاره و؛ اوس بیا هڅه کولای شې.', menuKeyboard(user, await isAdmin(id)), user); }`
- **L673:** `catch (e) { try { await api.sendMessage({ chat_id: id, text: '⌛ ستا پخوانی عمل د وخت د تېرېدو له امله لغوه شو. بیا هڅه وکړه.' }); } catch (ignored) {} }`
- **L716:** `if (Number(staleOffer.recipient_id) > 0) try { await api.sendMessage({ chat_id: Number(staleOffer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}`
- **L719:** `try { await api.sendMessage({ chat_id: Number(staleSearch.requester_id), text: '⌛ د ملګري لټون وخت پای ته ورسېد؛ غوښتنه لغوه شوه. بیا هڅه وکړه.' }); } catch (e) {}`
- **L839:** `text: '🎲 یو ناڅاپي کس غواړي له تا سره اړیکه پیل کړي.\n\nته د غوښتونکي نوم، عکس، جنسیت او نور معلومات نه وینې. که غوښتنه ومنې، اړیکه به وصل شي؛ که رد یې کړې، بل کس ته به غوښتنه واستول شي.',`
- **L840:** `reply_markup: styleKeyboardMarkup({ inline_keyboard: [[{ text: '✅ غوښتنه منل', callback_data: 'conn:accept:' + offer.id }, { text: '❌ ردول', callback_data: 'conn:reject:' + offer.id }]] })`
- **L889:** `try { await api.sendMessage({ chat_id: senderId, text: '⚠️ دا پیغام یا د هغه Reply بل ملګري ته ونه لېږل شو. بل ډول پیغام واستوه.' }); } catch (e) {}`
- **L898:** `await sendPrompt(chatId, '⚠️ د ګېم تنظیمات ناسم دي: فیس باید له جایزې څخه کم وي. له اډمین سره اړیکه ونیسه.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);`
- **L902:** `await sendPrompt(chatId, '🎲 د ګېم لپاره لږ تر لږه ' + requiredBalance + ' ستوري پکار دي (جایزه ' + minStars + '؛ فیس ' + fee + ' د جایزې له اندازې کمېږي).\n\nستا بیلانس: ' + Number(user.stars || 0), menuKeyboard(user, await isAdmin(user.telegram_id)), user);`
- **L914:** `await sendPrompt(chatId, '⚠️ ته لا د اړیکې یا د ملګري د لټون په بهیر کې یې. لومړی هغه پای ته ورسوه، بیا ګېم پیل کړه.', menuKeyboard(user, await isAdmin(userId)), user);`
- **L936:** `try { await api.sendMessage({ chat_id: otherId, text: '⌛ د ګېم غوښتنې وخت پای ته رسېدلی؛ دا ګېم نور فعال نه دی.' }); } catch (e) {}`
- **L943:** `await sendPrompt(chatId, '⚠️ ستا په یوه پخواني ګېم کې تخنیکي ستونزه ثبت شوې ده. د فیس او پایلې د کتنې لپاره له اډمین سره اړیکه ونیسه؛ تر هغې نوی ګېم مه پیلوه.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);`
- **L948:** `await sendPrompt(chatId, '🎲 ستا د ګېم غوښتنه لا روانه ده.', menuKeyboard(user, await isAdmin(user.telegram_id)), user);`
- **L970:** `await sendPrompt(chatId, '🎲 د ګېم سیال لټول کېږي.\n\n📩 د منلو/ردولو پیغام یوازې هغه کارن ته استول کېږي چې په تېرو ۲ دقیقو کې له بوټ سره فعال و، کافي ستوري ولري، او بل فعال ګېم یا اړیکه ونه لري.\n\n⏳ که په ټاکلي وخت کې مناسب سیال پیدا نه شي، ګېم به د بوټ پر وړاندې حل شي؛ که لغوه کول غواړې، لاندې تڼۍ ووهه.', { inline_k`
- **L993:** `await api.sendMessage({ chat_id: Number(latest.opponent_id), text: '⌛ د ګېم غوښتنه د تخنیکي ستونزې له امله لغوه شوه.' });`
- **L1021:** `text: '⚠️ د ګېم غوښتنه ثبت شوه، خو د سیال لټولو پر مهال تخنیکي ستونزه وشوه. غوښتنه لا د لټون په حالت کې ده؛ لږ وروسته بیا هڅه وکړه.'`
- **L1045:** `try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د ګېم مالي تنظیمات ناسم دي؛ فیس نه دی تصفیه شوی. له اډمین سره اړیکه ونیسه.' }); } catch (e) {}`
- **L1051:** `try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ ستوري نور د ګېم د جایزې لپاره کافي نه دي؛ ګېم لغوه شو او فیس نه دی اخیستل شوی.' }); } catch (e) {}`
- **L1061:** `try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د ګېم تخنیکي ستونزه وه؛ ګېم لغوه شو او فیس نه دی اخیستل شوی. بیا هڅه وکړه.' }); } catch (e) {}`
- **L1070:** `try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د تاس پایله تایید نه شوه؛ مالي تصفیه ونه شوه. له اډمین سره اړیکه ونیسه.' }); } catch (e) {}`
- **L1073:** `let outcome = '🤝 مساوي! یوازې د ګېم فیس ' + fee + ' ستوری کم شو.';`
- **L1078:** `outcome = '🎉 ته وګټلې! ستا خالصه جایزه ' + (winStars - fee) + ' ستوري او +' + points + ' نمرې ده.';`
- **L1081:** `outcome = '🤖 بوټ وګټله! ستا ټول لګښت ' + winStars + ' ستوري شو (فیس پکې شامل دی).';`
- **L1089:** `try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د ګېم پر مهال ستا بیلانس بدل شو؛ د ناسم حساب د مخنیوي لپاره تصفیه ودرول شوه. له اډمین سره اړیکه ونیسه.' }); } catch (e) {}`
- **L1099:** `try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ مالي بدلون وشو، خو د ګېم پایله په ډیټابیس کې بشپړه ثبت نه شوه. له اډمین سره اړیکه ونیسه.' }); } catch (e) {}`
- **L1102:** `try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '🎲 د ګېم پایله\n\nستا 🎲: ' + playerRoll + '\n\nد بوټ 🎲: ' + botRoll + '\n\n' + outcome + '\n\n⭐ اوسنی بیلانس: ' + newBalance }); } catch (e) {}`
- **L1152:** `await api.sendMessage({ chat_id: targetId, text: '⌛ د ګېم غوښتنې وخت پای ته رسېدلی؛ دا ګېم نور فعال نه دی. نوې غوښتنه پیلولای شې.' });`
- **L1248:** `text: '⚠️ د بوټ پر وړاندې د ګېم پر مهال تخنیکي ستونزه رامنځته شوه. د ستورو او پایلې حالت باید اډمین وڅېړي؛ مهرباني وکړه نوی ګېم مه پیلوه.'`
- **L1298:** `text: '🎲 یو فعال کارن غواړي له تا سره د ګېم لوبه وکړي.\n\nد لوبې لپاره لږ تر لږه ' + requiredBalance + ' ستوري پکار دي. د ګټلو جایزه ' + minStars + ' ده او فیس ' + fee + ' له جایزې کمېږي. د منلو یا ردولو انتخاب وکړه.',`
- **L1300:** `{ text: '✅ ګېم منل', callback_data: 'game:accept:' + game.id },`
- **L1331:** `text: '🎲 یو فعال کارن غواړي له تا سره د ګېم لوبه وکړي.\n\nد لوبې لپاره لږ تر لږه ' + requiredBalance + ' ستوري پکار دي. د ګټلو جایزه ' + minStars + ' ده او فیس ' + fee + ' له جایزې کمېږي. د منلو یا ردولو انتخاب وکړه.',`
- **L1333:** `{ text: '✅ ګېم منل', callback_data: 'game:accept:' + game.id },`
- **L1455:** `? { reply_markup: { inline_keyboard: [[{ text: '❌ ګېم لغوه کول', callback_data: 'game:cancel' }]] } }`
- **L1472:** `let text = '🎁 د جایزو تنظیمات\n\nهره جایزه جلا بدله کړه:\n\n';`
- **L1478:** `rows.push([{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]);`
- **L1486:** `let text = '🔗 د اړیکو تنظیمات\n\n';`
- **L1489:** `rows.push([{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]);`
- **L1498:** `let text = '🎲 د ګېم تنظیمات\n\n';`
- **L1501:** `rows.push([{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]);`
- **L1564:** `await sendPrompt(chatId, '⛔ دا امر یوازې د اډمین لپاره دی.', menuKeyboard(user, false), user);`
- **L1581:** `await sendPrompt(chatId, '✅ د ټېسټ بوټ د خراب حالت پاتې لوبې پاکې شوې.\nلغوه شوې لوبې: ' + cleared + '\n\nیادونه: د لوبغاړو ستوري او نمرې نه دي بدل شوي.', menuKeyboard(user, await isAdmin(id)), user);`
- **L1640:** `else if (user.state === 'waiting_profile_photo') await sendPrompt(chatId, user.language === 'en' ? 'Send the profile photo now.' : 'اوس د پروفایل عکس راولېږه.', { force_reply: true }, user);`
- **L1641:** `else if (user.state === 'waiting_profile_channel') await sendPrompt(chatId, user.language === 'en' ? 'Send a public channel @username or t.me/username.' : 'د عام چینل @username یا لینک راولېږه.', { force_reply: true }, user);`
- **L1656:** `await sendPrompt(chatId, user.language === 'en' ? 'Please send a photo.' : user.language === 'fa' ? 'لطفاً یک عکس بفرستید.' : user.language === 'ur' ? 'براہ کرم تصویر بھیجیں۔' : user.language === 'ar' ? 'أرسل صورة من فضلك.' : 'مهرباني وکړه عکس راولېږه.', { force_reply: true }, user); return;`
- **L1665:** `await sendPrompt(chatId, user.language === 'en' ? 'Send a public channel @username or t.me/username link only.' : user.language === 'fa' ? 'فقط نام کاربری یا لینک عمومی کانال را بفرستید.' : user.language === 'ur' ? 'صرف عوامی چینل کا @username یا t.me لنک بھیجیں۔' : user.language === 'ar' ? 'أرسل اسم المستخدم أو رابط ا`
- **L1671:** `await sendPrompt(chatId, user.language === 'en' ? 'That public channel could not be verified. Check the username and try again.' : user.language === 'fa' ? 'کانال عمومی تأیید نشد؛ نام کاربری را بررسی کنید.' : user.language === 'ur' ? 'عوامی چینل کی تصدیق نہیں ہوئی، نام دوبارہ چیک کریں۔' : user.language === 'ar' ? 'تعذر`
- **L1680:** `if (!Array.isArray(message.photo) || !message.photo.length) { await sendPrompt(chatId, user.language === 'en' ? 'Please send a photo to set as the user profile picture.' : 'د کارن د پروفایل لپاره عکس راولېږه.', { force_reply: true }, user); return; }`
- **L1691:** `if (!allowed.includes(key) || !Number.isFinite(value) || value < 0 || value > 1000000 || ((key.startsWith('welcome_reward_') || key.startsWith('referral_reward_') || key.includes('seconds') || key.includes('minutes') || key === 'game_win_points') && !Number.isInteger(value))) { await sendPrompt(chatId, '⚠️ معتبر عدد ول`
- **L1696:** `await sendPrompt(chatId, '⚠️ د لوبې فیس باید له جایزې څخه کم وي. لومړی مناسب مقدار وټاکه، بیا بیا هڅه وکړه.', { force_reply: true }, user);`
- **L1715:** `await sendPrompt(chatId, '✅ د ریفرل جایزې ثبت شوې:\n\n⭐ ستوري: ' + stars + '\n\n🏆 نمرې: ' + points + '\n\n❤️ لایکونه: ' + likes,`
- **L1716:** `{ inline_keyboard: [[{ text: '⭐ ستوري', callback_data: 'admin:reward:stars' }, { text: '🏆 نمرې', callback_data: 'admin:reward:points' }], [{ text: '❤️ لایکونه', callback_data: 'admin:reward:likes' }], [{ text: '🔙 اډمین پینل', callback_data: 'admin:panel' }]] }, user); return;`
- **L1721:** `if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000) { await sendPrompt(chatId, user.language === 'en' ? 'Send a positive whole number.' : 'مثبت صحیح عدد راولېږه.', { force_reply: true }, user); return; }`
- **L1734:** `catch (e) { await sendPrompt(chatId, user.language === 'en' ? 'Could not send this message to the user.' : 'دا پیغام کارن ته ونه لېږل شو.', { force_reply: true }, user); return; }`
- **L1948:** `else await sendPrompt(chatId, '⌛ اوس فعاله اړیکه نشته.', menuKeyboard(user, await isAdmin(id)), user);`
- **L1953:** `else await sendPrompt(chatId, '⌛ د پروفایل لیدلو لپاره فعاله اړیکه نشته.', menuKeyboard(user, await isAdmin(id)), user);`
- **L1959:** `await sendPrompt(chatId, '⌛ د پیغامونو د حذفولو لپاره پخوانۍ اړیکه ونه موندل شوه.', menuKeyboard(user, await isAdmin(id)), user);`
- **L1964:** `await sendPrompt(chatId, '🗑 د ملګري ' + deleted + ' پیغامونه د وروستیو ۱۰ دقیقو له لېست څخه حذف شول. یوازې هغه پیغامونه حذفېږي چې بوټ یې په دې چټ کې کاپي کړي وي.', keyboard, user);`
- **L1974:** `if (action === 'photoSettings') { user.state = 'settings_photo_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, (user.profile_photo_id ? '✅ ' : '➖ ') + (user.language === 'en' ? 'Profile photo settings:' : user.language === 'fa' ? 'تنظیمات عکس پرو`
- **L1976:** `if (action === 'favoriteSettings') { user.state = 'settings_favorites_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, user.language === 'en' ? '❤️ Manage favorite friends:' : user.language === 'fa' ? '❤️ مدیریت دوستان محبوب:' : user.language === `
- **L1982:** `if (field === 'profileVisibility') { await sendPrompt(chatId, '🔒 د خپل پروفایل د ښکاره کېدو حالت وټاکه:', { inline_keyboard: [[{ text: '🌐 ټولو ته ښکاره', callback_data: 'settings:visibility:everyone' }], [{ text: '❤️ یوازې پالو ملګرو ته', callback_data: 'settings:visibility:followers' }], [{ text: '🔙 بېرته', callbac`
- **L1983:** `if (field === 'photoSettings') { user.state = 'settings_photo_menu'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, '🖼 د پروفایل عکس تنظیمات:', photoSettingsKeyboard(user), user); return; }`
- **L1991:** `if (action === 'photoSet') { user.state = 'waiting_profile_photo'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, user.language === 'en' ? 'Send the profile photo now.' : user.language === 'fa' ? 'اکنون عکس پروفایل را بفرستید.' : user.language === 'ur'`
- **L1994:** `await sendPrompt(chatId, user.language === 'en' ? 'Choose an option below.' : 'لاندې یو انتخاب وټاکه.', photoSettingsKeyboard(user), user); return;`
- **L1997:** `if (action === 'channelSet') { user.state = 'waiting_profile_channel'; await db.update(users).set({ state: user.state }).where(eq(users.telegram_id, id)).run(); await sendPrompt(chatId, user.language === 'en' ? 'Send a public channel @username or https://t.me/username. Private invite links are not accepted.' : user.lan`
- **L2000:** `await sendPrompt(chatId, user.language === 'en' ? 'Choose an option below.' : 'لاندې یو انتخاب وټاکه.', channelSettingsKeyboard(user), user); return;`
- **L2005:** `await sendPrompt(chatId, user.language === 'en' ? 'Choose an option below.' : 'لاندې یو انتخاب وټاکه.', favoriteSettingsKeyboard(user), user); return;`
- **L2086:** `if (field === 'find') await sendPrompt(chatId, '🔎 کوم ډول ملګری غواړې؟', { inline_keyboard: [[{ text: '👨 نارینه', callback_data: 'find:gender:male' }, { text: '👩 ښځینه', callback_data: 'find:gender:female' }], [{ text: '🌐 اتومات', callback_data: 'find:gender:auto' }], [{ text: '❌ لغوه', callback_data: 'find:cancel'`
- **L2089:** `if (Number(user.stars || 0) < cost) await sendPrompt(chatId, '⭐ د ناڅاپي اړیکې لپاره لږ تر لږه ' + cost + ' ستوري پکار دي. ستا بیلانس: ' + Number(user.stars || 0), menuKeyboard(user, await isAdmin(id)), user);`
- **L2090:** `else await sendPrompt(chatId, '🎲 ناڅاپي اړیکه پیل کړو؟\n\nد غوښتنې د منلو پر مهال به ' + cost + ' ستوری کم شي.\n\nغواړې غوښتنه واستوې؟', { inline_keyboard: [[{ text: '✅ تایید او غوښتنه واستوه', callback_data: 'conn:confirm:random' }, { text: '❌ لغوه', callback_data: 'conn:cancel' }]] }, user);`
- **L2093:** `else if (field === 'leaderboards') await sendPrompt(chatId, '🏆 لوړ رتبه کسان\n\nلاندې درجه‌بندي وټاکه:', { inline_keyboard: [[{ text: '🏆 تر ټولو ډېرې نمرې', callback_data: 'admin:rank:points' }], [{ text: '📨 تر ټولو ډېر ریفرلونه', callback_data: 'admin:rank:referrals' }], [{ text: '👥 تر ټولو ډېر فالو', callback_dat`
- **L2129:** `text: '⚠️ یوه تخنیکي ستونزه رامنځته شوه. مهرباني وکړه /start ولیکه او بیا هڅه وکړه.'`

## tgcloud/handlers/callback_query.js

- **L264:** `rows.push([{ text: '🔙 بېرته', callback_data: 'admin:channels:back' }]);`
- **L317:** `const intro = actor.language === 'en' ? '📢 Required membership management:' : '📢 د اجباري غړیتوب اداره:';`
- **L324:** `const prompt = actor.language === 'en' ? 'Send the new numeric ID of the group/channel:' : 'د دې ګروپ یا چینل نوی عددي ID راولېږه:';`
- **L331:** `const question = actor.language === 'en' ? 'Are you sure you want to delete this group/channel?' : 'ایا ډاډه یې چې دا ګروپ یا چینل حذف کړې؟';`
- **L332:** `const yes = actor.language === 'en' ? '✅ Yes, delete' : '✅ هو، حذف یې کړه';`
- **L357:** `const prompt = actor.language === 'en' ? 'Send the new numeric value. Decimal star values such as 0.5 are allowed; time values must be whole numbers.' : 'د دې تنظیم نوی عدد راولېږه. د ستورو لپاره اعشاري عدد لکه 0.5 منل کېږي؛ د وخت لپاره صحیح عدد ولیکه.';`
- **L388:** `await sendPrompt(chatId, text, { inline_keyboard: [[{ text: '🔙 لوړ رتبه کسان', callback_data: 'admin:rank_menu' }], [{ text: '🔙 اصلي مېنو', callback_data: 'admin:main' }]] }, actor, 'HTML');`
- **L392:** `await sendPrompt(chatId, '🏆 لوړ رتبه کسان\n\nلاندې درجه‌بندي وټاکه:', { inline_keyboard: [[{ text: '🏆 تر ټولو ډېرې نمرې', callback_data: 'admin:rank:points' }], [{ text: '📨 تر ټولو ډېر ریفرلونه', callback_data: 'admin:rank:referrals' }], [{ text: '👥 تر ټولو ډېر فالو', callback_data: 'admin:rank:follows' }], [{ text`
- **L409:** `const prompt = actor.language === 'en' ? 'Send the new profile photo for this user.' : actor.language === 'fa' ? 'عکس جدید پروفایل کاربر را بفرستید.' : actor.language === 'ur' ? 'صارف کی نئی پروفائل تصویر بھیجیں۔' : actor.language === 'ar' ? 'أرسل صورة الملف الشخصي الجديدة لهذا المستخدم.' : 'د دې کارن نوی پروفایل عکس ر`
- **L419:** `await sendPrompt(chatId, actor.language === 'en' ? 'Send the whole-number amount to ' + verb + ' ' + labels[field] + ':' : labels[field] + ' ' + verb + ' لپاره مثبت صحیح عدد راولېږه:', { force_reply: true }, actor); return;`
- **L423:** `await sendPrompt(chatId, actor.language === 'en' ? '⛔ Administrators cannot be blocked from this panel.' : '⛔ د بوټ مدیران د دې پینل له لارې نه شي مسدودېدای.', adminUserSettingsKeyboard(actor, targetId, target.is_blocked), actor); return;`
- **L452:** `try { await api.sendMessage({ chat_id: targetId, text: target.language === 'en' ? '⛔ Your account has been restricted by an administrator.' : '⛔ ستا حساب د اډمین له خوا محدود شو.' }); } catch (e) {}`
- **L454:** `try { await api.sendMessage({ chat_id: targetId, text: target.language === 'en' ? '✅ Your account restriction has been removed.' : '✅ ستا د حساب محدودیت لرې شو.' }); } catch (e) {}`
- **L461:** `const prompt = actor.language === 'en' ? 'Send any message, photo, video, document, sticker, voice or other Telegram content for this user.' : actor.language === 'fa' ? 'هر نوع پیام، عکس، ویدیو، فایل یا محتوای تلگرام را برای کاربر بفرستید.' : actor.language === 'ur' ? 'صارف کے لیے کوئی بھی پیغام، تصویر، ویڈیو یا فائل ب`
- **L480:** `await sendPrompt(chatId, visibility === 'followers' ? '🔒 ستا بشپړ پروفایل به یوازې ستا پالو ملګرو ته ښکاري؛ نورو ته به یوازې نوم او جنسیت ښکاري.' : '🌐 ستا پروفایل ټولو ته ښکاره دی، خو د ستورو بیلانس هېڅکله نورو ته نه ښکاري.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;`
- **L504:** `return '👤 نوم: ' + name + '\n\n⚧ جنسیت: ' + gender + '\n\n🔒 د بشپړ پروفایل لپاره لومړی دا کارن فالو کړه.';`
- **L508:** `return '👤 نوم: ' + name + '\n\n⚧ جنسیت: ' + gender + '\n\n🌍 هېواد: ' + (country ? country.label : '—') +`
- **L535:** `{ text: liked ? '💔 لایک بېرته اخستل' : '❤️ لایک', callback_data: 'session:like:' + targetId + ':' + sessionId }`
- **L545:** `const text = '🤝 اړیکه فعاله ده.\n\n' + await publicProfileText(target, viewerId);`
- **L605:** `rows.push([{ text: '🔙 اصلي مېنو', callback_data: 'settings:main' }]);`
- **L607:** `await sendPrompt(pair.id, '🛑 اړیکه پای ته ورسېده.\n\n👤 د تېر ملګري نوم: ' + name + '\n\nکه غواړې، خپل پاتې نمرې ورکړه یا ملګری فالو کړه. د پیغامونو حذفولو لپاره د کیبورډ تڼۍ وکاروه.', { inline_keyboard: rows }, user);`
- **L613:** `text: '⌨️ د اړیکې له پای وروسته هم د وروستیو ۱۰ دقیقو پیغامونه حذفولای شې.',`
- **L659:** `try { await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د تخنیکي ځنډ له امله لغوه شوه.' }); } catch (e) {}`
- **L674:** `if (Number(offer.recipient_id) > 0) try { await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}`
- **L691:** `try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: '⌛ د ملګري لټون وخت پای ته ورسېد؛ غوښتنه لغوه شوه. بیا هڅه وکړه.' }); } catch (e) {}`
- **L696:** `if (Number(otherOffer.recipient_id) > 0 && Number(otherOffer.recipient_id) !== id) try { await api.sendMessage({ chat_id: Number(otherOffer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}`
- **L719:** `if (playerId > 0 && playerId !== id) try { await api.sendMessage({ chat_id: playerId, text: '⌛ پخوانی ګېم د انتظار د وخت له تېرېدو وروسته لغوه شو. مهرباني وکړه نوی ګېم پیل کړه.' }); } catch (e) {}`
- **L724:** `try { await sendPrompt(id, '⌛ ستا پخوانی عمل د وخت د تېرېدو له امله لغوه شو. دا پیغام یوازې د لغوه کولو لپاره و؛ اوس بیا هڅه کولای شې.', mainKeyboard(user, await isAdmin(id)), user); }`
- **L725:** `catch (e) { try { await api.sendMessage({ chat_id: id, text: '⌛ ستا پخوانی عمل د وخت د تېرېدو له امله لغوه شو. بیا هڅه وکړه.' }); } catch (ignored) {} }`
- **L764:** `if (Number(staleOffer.recipient_id) > 0) try { await api.sendMessage({ chat_id: Number(staleOffer.recipient_id), text: '⌛ د اړیکې غوښتنه د وخت د تېرېدو له امله لغوه شوه.' }); } catch (e) {}`
- **L767:** `try { await api.sendMessage({ chat_id: Number(staleSearch.requester_id), text: '⌛ د ملګري لټون وخت پای ته ورسېد؛ غوښتنه لغوه شوه. بیا هڅه وکړه.' }); } catch (e) {}`
- **L888:** `text: '🎲 یو ناڅاپي کس د اړیکې غوښتنه کړې ده.\n\nد غوښتونکي هېڅ معلومات نه ښکاري. که ومنې، اړیکه به وصل شي؛ که رد یې کړې، بل کس ته به غوښتنه ولاړه شي.',`
- **L889:** `reply_markup: styleKeyboardMarkup({ inline_keyboard: [[{ text: '✅ غوښتنه منل', callback_data: 'conn:accept:' + offer.id }, { text: '❌ ردول', callback_data: 'conn:reject:' + offer.id }]] }) }); }`
- **L904:** `await sendPrompt(userId, '⚠️ د اړیکې د ستورو تنظیم ناسم دی. له اډمین سره اړیکه ونیسه.', mainKeyboard(user, await isAdmin(userId)), user);`
- **L907:** `if (Number(user.stars || 0) < cost) { await sendPrompt(userId, '⭐ د اړیکې لپاره ' + cost + ' ستوري پکار دي. ستا بیلانس: ' + Number(user.stars || 0), mainKeyboard(user, await isAdmin(userId)), user); return; }`
- **L909:** `if (await activeSessionFor(userId)) { await sendPrompt(userId, '⚠️ ته لا له یوه کس سره په اړیکه کې یې. لومړی اړیکه پای ته ورسوه.', mainKeyboard(user, await isAdmin(userId)), user); return; }`
- **L934:** `try { await api.sendMessage({ chat_id: otherId, text: '⌛ د ګېم غوښتنې وخت پای ته رسېدلی؛ دا ګېم نور فعال نه دی.' }); }`
- **L945:** `await sendPrompt(userId, '⚠️ ته لا د ګېم په بهیر کې یې. که ګېم لا د انتظار په حالت کې وي، د انتظار وخت پای ته رسېدو وروسته بیا هڅه وکړه؛ که د تصفیې ستونزه وي، له اډمین سره اړیکه ونیسه.', mainKeyboard(user, await isAdmin(userId)), user);`
- **L952:** `await sendPrompt(userId, '🔎 ستا د ملګري لټون یا د اړیکې غوښتنه لا فعاله ده. لومړی یې پای ته ورسوه، بیا نوی لټون پیل کړه.', { inline_keyboard: [[{ text: '❌ لټون لغوه کول', callback_data: 'conn:cancel_search' }]] }, user);`
- **L1193:** `await sendPrompt(userId, '🔎 د ملګري لټون پیل شو.\n\n⏳ د مناسب کس لټون تر ۲ دقیقو دوام کوي. که وخت تېر شي، د ستا راتلونکي پیغام یا تڼۍ پر مهال به لټون لغوه شي.\n\n⭐ د منلو پر مهال به ' + cost + ' ستوری کم شي.',`
- **L1194:** `{ inline_keyboard: [[{ text: '❌ لټون لغوه کول', callback_data: 'conn:cancel_search:' + Number(search.id) }]] }, user);`
- **L1249:** `await api.sendMessage({ chat_id: Number(offer.recipient_id), text: '⌛ د اړیکې غوښتنه د تخنیکي ستونزې له امله لغوه شوه.' });`
- **L1268:** `text: '⚠️ د ملګري لټون پیل نه شو. غوښتنه خوندي نه ده فعاله پاتې شوې؛ لږ وروسته بیا هڅه وکړه. که بیا تکرار شو، اډمین ته خبر ورکړه.'`
- **L1282:** `text: '⚠️ لټون پیل شو، خو د سیال لټولو پر مهال ستونزه وشوه. لږ وروسته بیا هڅه وکړه.'`
- **L1301:** `try { await api.sendMessage({ chat_id: Number(first.telegram_id), text: '✅ غوښتنه ومنل شوه! اړیکه وصل شوه.\n\n⭐ له غوښتونکي څخه د اړیکې قیمت کم شوی دی.' }); } catch (e) {}`
- **L1302:** `try { await api.sendMessage({ chat_id: Number(second.telegram_id), text: '✅ غوښتنه ومنل شوه! اړیکه وصل شوه.\n\nاوس کولای شئ یو بل ته پیغامونه واستوئ.' }); } catch (e) {}`
- **L1309:** `text: '⌨️ د اړیکې چټک کنټرولونه:',`
- **L1327:** `if (item) try { await api.sendMessage({ chat_id: Number(item.telegram_id), text: '⚠️ ګېم لغوه شو، ځکه یو لوبغاړی نور موجود نه دی. فیس نه دی اخیستل شوی.' }); } catch (e) {}`
- **L1345:** `try { await api.sendMessage({ chat_id: Number(player.telegram_id), text: '⚠️ د لوبې لپاره د یوه لوبغاړي بیلانس کافي نه دی.' }); } catch (e) {}`
- **L1346:** `try { await api.sendMessage({ chat_id: Number(opponent.telegram_id), text: '⚠️ د لوبې لپاره د یوه لوبغاړي بیلانس کافي نه دی.' }); } catch (e) {}`
- **L1488:** `try { await api.sendMessage({ chat_id: pair.id, text: '🎲 د ګېم پایله\n\nستا 🎲: ' + pair.mine + '\n\nد سیال 🎲: ' + pair.other + '\n\n' + result + '\n\n⭐ اوسنی بیلانس: ' + pair.balance }); } catch (e) {}`
- **L1511:** `text: '⚠️ د اړیکې غوښتنه پیل نه شوه. لږ وروسته بیا هڅه وکړه.'`
- **L1563:** `await api.sendMessage({ chat_id: requesterId, text: '⌛ مقابل لوري د اړیکې غوښتنه لغوه کړه؛ د هغه غوښتنه نور فعاله نه ده.' });`
- **L1609:** `await sendPrompt(chatId, '⌛ دا غوښتنه نوره فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L1630:** `await sendPrompt(chatId, '⌛ دا غوښتنه نور فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L1636:** `if (!search) { await db.update(connection_requests).set({ status: 'expired', updated_at: new Date().toISOString() }).where(eq(connection_requests.id, offerId)).run(); await sendPrompt(chatId, '⌛ د غوښتونکي لټون پای ته رسېدلی.', mainKeyboard(actor, await isAdmin(actorId)), actor); return; }`
- **L1660:** `if (requester) try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: '⚠️ د اړیکې لپاره ستوري نور کافي نه دي. لټون پای ته ورسېد.' }); } catch (e) {}`
- **L1673:** `await sendPrompt(chatId, '⚠️ د غوښتونکي یا ستا ګېم لا فعال دی. دا د اړیکې غوښتنه بنده شوه؛ د ګېم تر پای وروسته بیا هڅه وکړه.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L1674:** `try { await api.sendMessage({ chat_id: Number(requester.telegram_id), text: '⚠️ د ګېم د فعال حالت له امله د اړیکې لټون لغوه شو. د ګېم تر پای وروسته بیا هڅه وکړه.' }); } catch (e) {}`
- **L1705:** `await sendPrompt(chatId, '⌛ دا غوښتنه نور فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L1728:** `await sendPrompt(chatId, '⌛ د غوښتونکي لټون پای ته رسېدلی؛ دا غوښتنه نوره فعاله نه ده.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L1904:** `try { await api.sendMessage({ chat_id: externalParty, text: '⌛ دا د اړیکې غوښتنه لغوه شوه، ځکه یو ګډونوال له بل کس سره وصل شو.' }); } catch (e) {}`
- **L1921:** `await sendPrompt(chatId, '🌐 د کومې ژبې ملګری غواړې؟', { inline_keyboard: [[{ text: 'پښتو', callback_data: 'find:language:ps' }, { text: 'دري', callback_data: 'find:language:fa' }], [{ text: 'English', callback_data: 'find:language:en' }, { text: 'اردو', callback_data: 'find:language:ur' }], [{ text: 'العربية', callbac`
- **L1928:** `if (Number(actor.stars || 0) < cost) { await sendPrompt(chatId, '⭐ د ملګري لټون لپاره ' + cost + ' ستوري پکار دي. ستا بیلانس: ' + Number(actor.stars || 0), mainKeyboard(actor, await isAdmin(actorId)), actor); return; }`
- **L1931:** `await sendPrompt(chatId, '🔎 د ملګري لټون تایید کړه.\n\n👤 جنسیت: ' + gender + '\n\n🌐 ژبه: ' + language + '\n\n⭐ د اړیکې پر منلو به ' + cost + ' ستوری کم شي.', { inline_keyboard: [[{ text: '✅ تایید او لټون پیلول', callback_data: 'conn:confirm:find' }, { text: '❌ لغوه', callback_data: 'conn:cancel' }]] }, actor); retur`
- **L1971:** `await sendPrompt(chatId, '⚠️ دا عمل پر خپل پروفایل نه شي ترسره کېدای.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L2007:** `await sendPrompt(chatId, '⚠️ د نمرو ورکولو لپاره باید همدا ستا له تېر ملګري سره پای ته رسېدلې اړیکه وي.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L2017:** `await sendPrompt(chatId, '⭐ په دې اړیکه کې دې مخکې نمره ورکړې ده.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;`
- **L2032:** `await sendPrompt(chatId, '✅ ' + rating + ' نمرې دې کارن ته ورکړې. دې کارن ته دې ټولټال ' + (alreadyGiven + rating) + ' له ۵ نمرې ورکړې دي.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;`
- **L2053:** `await sendPrompt(chatId, '🗑 د وروستیو ۱۰ دقیقو د ملګري ' + deleted + ' لېږل شوي پیغامونه حذف شول. د Telegram د محدودیت له امله د کارن خپل اصلي پیغامونه نه حذف کېږي.', mainKeyboard(actor, await isAdmin(actorId)), actor); return;`
- **L2095:** `text: '⌛ د ګېم غوښتونکی خپله غوښتنه لغوه کړه. دا ګېم نور فعال نه دی.'`
- **L2119:** `if (!game || !['waiting','pending'].includes(game.status)) { await sendPrompt(chatId, '⌛ دا ګېم نور فعال نه دی.', mainKeyboard(actor, await isAdmin(actorId)), actor); return; }`
- **L2132:** `try { await api.sendMessage({ chat_id: targetId, text: '⌛ د ګېم غوښتنې وخت پای ته رسېدلی؛ دا ګېم نور فعال نه دی. نوې غوښتنه پیلولای شې.' }); } catch (e) {}`
- **L2135:** `await sendPrompt(chatId, '⌛ د دې ګېم وخت پای ته رسېدلی یا ګېم نور فعال نه دی.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L2156:** `await sendPrompt(chatId, '⌛ دا ګېم نور فعال نه دی؛ ښايي مخکې منل شوی یا لغوه شوی وي.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L2177:** `if (player) await sendPrompt(Number(player.telegram_id), '❌ سیال غوښتنه رد کړه؛ د بل سیال لټون روان دی.\\n\\nکه غواړې، لټون لغوه کولای شې.', { inline_keyboard: [[{ text: '❌ ګېم لغوه کول', callback_data: 'game:cancel' }]] }, player);`
- **L2179:** `await sendPrompt(Number(player.telegram_id), '❌ سیال غوښتنه رد کړه؛ خو ستا بله اړیکه یا ګېم لا فعال دی، نو نوی ګېم ونه جوړ شو.', mainKeyboard(player, await isAdmin(playerId)), player);`
- **L2181:** `await sendPrompt(chatId, '❌ د ګېم غوښتنه رد شوه.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L2204:** `await sendPrompt(chatId, '⌛ د ګېم حالت د کتنې پر مهال بدل شو؛ غوښتنه په خپله لغوه نه شوه. مهرباني وکړه حالت تازه وګوره.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L2236:** `await sendPrompt(chatId, '⌛ دا ګېم نور فعال نه دی یا مخکې منل شوی دی.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L2245:** `await sendPrompt(chatId, '⚠️ د ګېم حالت تایید نه شو؛ فیس نه دی قصداً اخیستل شوی. مهرباني وکړه له اډمین سره اړیکه ونیسه.', mainKeyboard(actor, await isAdmin(actorId)), actor);`
- **L2374:** `else await sendPrompt(chatId, (user.language === 'en' ? '✍️ Enter your name:' : user.language === 'fa' ? '✍️ نام خود را بنویسید:' : user.language === 'ur' ? '✍️ اپنا نام لکھیں:' : user.language === 'ar' ? '✍️ اكتب اسمك:' : '✍️ خپل نوم ولیکه:'), { force_reply: true }, user);`
- **L2396:** `try { await api.sendMessage({ chat_id: query.message.chat.id, text: '⚠️ تخنیکي ستونزه رامنځته شوه. بیا هڅه وکړه.' }); } catch (e) {}`

## د ژباړې منطق کې د اصلاح وړ عمومي نمونې

1. د `message.js` او `callback_query.js` په ډېرو ځایونو کې د پیغامونو، خطاګانو، لوبې/اړیکې خبرتیاوو، درجه‌بندۍ، د پروفایل معلوماتو، اډمین عملیاتو او بټنونو متنونه مستقیم لیکل شوي؛ د `T`/`TEXT` له ژباړنیزو جدولونو نه استفاده نه کوي.
2. ځینې متنونه یوازې `language === 'en' ? English : Pashto` لري؛ دري، اردو او عربي کاروونکي هم پښتو متن ترلاسه کوي.
3. د پروفایل او د اړیکې پر مهال د بل کارن د پروفایل ځینې فیلډونه لا هم ثابت پښتو لیبلونه لري.
4. د اډمین د ګروپ/چینل، درجه‌بندۍ، جایزو، اړیکو او لوبې ځینې پاڼې او د تایید/حذف پیغامونه د ژبې له مخې نه بدلېږي.
5. د خطا د عمومي fallback پیغامونه هم ثابت پښتو دي؛ باید د کارن د ټاکلې ژبې مطابق شي.
6. د دې راپور موخه د موندنو ثبتول دي؛ په دې پړاو کې د ټولو متنونو ژباړه نه ده عملي شوې، لکه څنګه چې غوښتل شوي.

## د 2026-10-18 د اصلاحاتو پرمختګ

دا برخه د پخوانۍ پلټنې د اوسني حالت تازه یادښت دی؛ پورته د 86/83 شمېرې د پخوانۍ نسخې لومړني شمېرل دي، د پاتې متنونو د اوسني شمېر ادعا نه ده.

### په دې پړاو کې اصلاح شوي
- `tgcloud/lib/message-text.js`: د اړیکې د پیل/پای، د فالو/لایک تڼیو، د پروفایل د ساحو، د لټون د خطا او لغوه کېدو پیغامونو لپاره د پنځو ژبو متنونه.
- د ګېم د پیل، د سیال د غوښتنې، د رد/لغوه کېدو، د پایلې او د مهمو خطاګانو لپاره د پنځو ژبو `gameText` متنونه.
- د اډمین د درجه‌بندۍ مینو او پایلو، د اجباري ګروپ/چینل د لېست او حذف، او د تنظیماتو/ریفرل جایزو د عدد غوښتلو متنونه.
- `tgcloud/handlers/message.js`: د ګېم د پیل، د سیال د غوښتنې او د پایلې ځینې متنونه اوس د ژبې له جدول څخه راځي.
- `tgcloud/handlers/callback_query.js`: د اړیکې د پیل/پای، لټون او لغوه کېدو، د ګېم د رد/پای ته رسېدو، د درجه‌بندۍ او د اډمین د ګروپ/چینل او تنظیماتو ځینې متنونه اوس د ژبې له جدول څخه راځي.

### د تایید حالت
- د `message.js`، `callback_query.js`، `message-text.js` او `callback-text.js` لپاره د JavaScript د نحو محلي کتنه تېره شوه.
- د GitHub Actions د `Validate Serverless JavaScript` ازموینه د وروستي کتنې پر مهال لا `in_progress` وه؛ تر پایلې مخکې یې بریا نه ده تایید شوې.
- دا لا د ټولو متنونو بشپړ وروستی audit نه دی. په ځانګړي ډول د اډمین د کارن-مدیریت، ډله‌ییز اعلان، د ګېم ځینې پاتې خطا/تصفیه حالتونه او د `callback_query.js` نورې پښتو-ثابتې جملې باید په راتلونکو پړاوونو کې وکتل شي.
