# Telegram Connect Bot

Telegram Connect is a multilingual Telegram Serverless bot project for discovering and promoting public Telegram channels, groups, and bots.

## Source files

- `schema.js`: database tables.
- `handlers/message.js`: current message handler.

For the Telegram Serverless project layout, use:

```
tgcloud/
  schema.js
  handlers/
    message.js
```

Project modules are imported by module name, for example `import { users } from 'schema'`, in accordance with Telegram Serverless module rules.

## Planned Stars wallet and promotion settlement

The schema now includes the **database foundation** for:
- `wallets`: a user's internal app balance in whole Telegram Stars units, split into available and pending balances.
- `wallet_transactions`: an auditable ledger with unique idempotency keys to prevent duplicate accounting.
- `star_payments`: records successful Telegram Stars payments and unique Telegram payment charge IDs.
- `promotions`: an ad placement order, approval mode, publish time, and 48-hour monitoring/settlement status.

Important distinction: the internal wallet is **not** the user's native Telegram Stars balance. The bot must first receive a successful Telegram Stars payment update and record it once, then credit the internal wallet.

## Proposed promotion rules

- Advertiser pays the listing price plus a 10% advertiser fee from their internal available wallet.
- The listing owner is charged a 10% fee against the listing price; owner net proceeds are therefore 90% of the listed price.
- The full reservation stays in pending accounting until approval, publication, and the 48-hour monitoring period complete.
- If approval is denied or publication/monitoring fails, the advertiser's reserved amount is refunded and the owner receives no earnings.
- If the ad survives the 48-hour monitoring period, the owner's net proceeds become available.
- The administrator commission is planned as 20% of the bot's collected transaction fees (the advertiser fee plus owner fee), not 20% of the ad's entire price. The precise rounding rule for fractional Stars must be defined in code; only whole Stars can be credited.
- The bot must have the required channel administrator/posting rights. If Telegram cannot reliably confirm the ad still exists or the bot's rights, settlement must be paused for admin review rather than automatically releasing funds.

## Current implementation status — read carefully

The wallet/payment/promotion tables have been added to `schema.js`. **The payment and escrow workflow is not yet implemented in `handlers/message.js`**, and the bot has not been runtime-tested with Telegram Serverless. Do not describe the Stars wallet or 48-hour settlement as live until handlers are implemented and tested.

Before deploying:
1. Review and apply the Serverless database migration for all new tables.
2. Implement the Telegram Stars invoice flow using currency `XTR`, validate pre-checkout queries, and credit only after `successful_payment`.
3. Add atomic/idempotent wallet ledger operations and promotion approval/publish/refund/settlement handlers.
4. Test with Telegram's dedicated Stars test environment and a test channel before enabling real payments.
5. Never store bot tokens, API secrets, or private credentials in this repository.

Existing marketplace/message-handler functionality may still use the earlier USD listing/ad fields; it must be reconciled with the new Stars pricing flow before production use.

Official docs:
- Telegram Serverless: https://core.telegram.org/bots/serverless
- Telegram Stars payments: https://core.telegram.org/bots/payments-stars
