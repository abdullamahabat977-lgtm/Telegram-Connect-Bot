# Telegram Connect Bot

A multilingual Telegram directory and promotion bot designed for **Telegram Serverless**.

## Languages
- Pashto (پښتو)
- Dari (دری)
- English
- Urdu (اردو)
- Arabic (العربية)

## Project layout

```
tgcloud/
  schema.js
  handlers/
    message.js
README.md
AGENTS.md
CHANGELOG.md
```

Only JavaScript modules inside `tgcloud/` are deployed by Telegram Serverless. This GitHub repository is a source-code library; it does not deploy the bot by itself.

## Important setup notes

1. Review `tgcloud/schema.js` against the schema already configured for your Telegram Serverless bot.
2. The schema in this repository includes language and conversation-state fields to support the planned flow. If your live database does not already have these fields, review the proposed migration in the Telegram Serverless dashboard/CLI before applying it.
3. Copy the contents of `tgcloud/handlers/message.js` into the matching message handler/module in Telegram Serverless, or use the official Telegram Serverless CLI workflow.
4. Test with your own bot before sharing it publicly.

## Official documentation

- [Telegram Serverless](https://core.telegram.org/bots/serverless)
- [Telegram Serverless CLI](https://core.telegram.org/bots/serverless#command-line-interface)

## Security

Never commit your bot token, access tokens, passwords, or private user information to this repository.
