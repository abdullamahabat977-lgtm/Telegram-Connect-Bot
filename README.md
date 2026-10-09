# Telegram Connect Bot

Telegram Connect is a multilingual Telegram Serverless bot for:
- Discovering approved public channels, groups, and bots.
- Submitting listings for administrator review.
- Creating ad requests and optionally publishing approved ads to a public channel/group.
- Letting advertisers request promotions from channel/group owners and negotiate a proposed price.
- Admin review, user blocking, broadcast messages, and basic statistics.

## Source files

- `schema.js`: all database tables.
- `handlers/message.js`: the message handler.

These repository paths are kept easy to find and copy. For the current Telegram Serverless CLI project layout, the corresponding local files belong at:

```
tgcloud/
  schema.js
  handlers/
    message.js
```

The handler imports the schema using the current documented relative-module syntax: `import { ... } from '../schema.js'`.

## Important behavior

- Listings and ads begin with `pending` status and require administrator approval.
- An ad may optionally include a public target such as `@MyChannel`. After an administrator approves it, the bot attempts to publish the ad there. The bot must be an administrator with permission to post messages in that channel/group. If publication fails, the ad remains approved in the bot marketplace and the admin receives a warning.
- A listing owner sets an optional advertising price in USD. Advertisers can send a request and proposed price using `/request_ad ID`; the owner can accept or reject with `/accept_offer ID` or `/reject_offer ID`.
- The bot records requests only; it does not collect or escrow money. Both parties must independently confirm final terms and payment.
- Telegram does not let a bot discover every channel or group automatically. The directory is based on user-submitted and administrator-approved listings.
- Telegram inline-button colors cannot be individually selected by the bot; Telegram controls their appearance.

## Before using the updated code

1. Open the bot's Serverless database/schema section.
2. Review and apply the migration for the new columns in `users` and `listings`, and the new `ad_requests` table. Do not run the handler against the old schema before the migration is complete.
3. Copy the updated schema and handler into the matching Serverless modules.
4. Test in a private chat first: `/start`, language selection, listing submission, admin approval, ad submission, admin approval, marketplace request, and owner accept/reject.
5. For channel publication, add the bot as an administrator with permission to post. Start with a test channel.

This code has passed a JavaScript syntax check, but it has **not** been runtime-tested against your live Telegram Serverless bot or database. Do not treat it as production-tested until the migration and the tests above succeed.

Official documentation: https://core.telegram.org/bots/serverless
