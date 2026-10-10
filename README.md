# Telegram Connect Bot

Multilingual Telegram Serverless bot for discovering Telegram channels, groups and bots, submitting listings, and browsing the ad marketplace.

## Files

- `schema.js` — database tables.
- `handlers/message.js` — menus, listing flow, marketplace, and Stars wallet/top-up receipt handling.
- `handlers/pre_checkout_query.js` — validates wallet invoices before Telegram completes checkout.

## Telegram Stars wallet

The bot uses Telegram Stars only (`XTR`); TON, USDT and TRX are not used.

- The main menu includes **My Stars wallet** and **Top up wallet**.
- Top-up choices: 100, 250, 500 or 1,000 Stars.
- Telegram's official invoice/payment flow is used. The wallet is credited only when a `successful_payment` message arrives and its payload, user, currency and amount validate.
- The Telegram payment charge ID is stored with a unique constraint to prevent a duplicate successful payment from crediting twice.
- The internal wallet is separate from the user's native Telegram Stars balance.
- New channel/group listing prices are entered in whole Stars (`XTR`). Existing rows that were saved in USD are not automatically converted; review them before using them as Stars prices.

## Database deployment

The wallet requires these tables in `schema.js`: `wallets`, `wallet_transactions`, `star_payments`, and `promotions`.

After updating the Serverless project's schema, **apply the database migration before deploying/using handlers that import the new tables**. In BotFather → your bot → Serverless → Database, review and apply the pending schema changes. Then deploy/save the handlers. Test payment behavior in Telegram's Stars test environment before accepting real payments.

## Important: promotion escrow is not finished

The Stars wallet top-up and payment confirmation handlers are added, but the full promotion escrow plan is **not yet complete**. In particular, the current handler does not yet:
- reserve the advertiser's wallet for a paid promotion and apply both 10% fees;
- verify channel type, 500-member minimum, bot admin status and posting permission during listing registration;
- implement owner/administrator approval modes for paid promotions;
- publish a paid promotion through a complete order workflow, refund rejected/failed promotions, or release owner earnings after 48 hours;
- run a guaranteed scheduled 48-hour check. Telegram Serverless handlers run on updates; a dependable timer/scheduled-job mechanism must be established before promising automatic settlement.

Do not treat paid promotion/escrow as live until these steps are implemented and tested. Never store bot tokens or private credentials in this repository.

## Fee model agreed for the planned promotion workflow

For a 10⭐ listing price:
- advertiser pays 11⭐ (10⭐ listing price + 1⭐ advertiser fee);
- owner net is 9⭐ (10⭐ listing price less 1⭐ owner fee);
- bot fees total 2⭐;
- manager share is 20% of collected bot fees cumulatively. Fractional results such as 0.4⭐ cannot be paid as a fraction of a Star, so the implementation must accumulate and settle whole Stars.

## Official references

- Telegram Serverless: https://core.telegram.org/bots/serverless
- Telegram Stars payments: https://core.telegram.org/bots/payments-stars
