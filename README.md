# Telegram Connect Bot

Multilingual directory and promotion bot source for Telegram Serverless.

## Layout

```
handlers/
  message.js
schema.js
AGENTS.md
README.md
CHANGELOG.md
```

Telegram Serverless expects `schema.js` at the project root and handlers directly under `handlers/`. Project modules are imported by bare name, such as `import { users } from 'schema';`.

## Before deploying

- This repository does not deploy the bot automatically.
- The handler currently expects `language`, `state`, `draft_type`, and `draft_name` fields in `users`. Review the live schema and pending migration before applying changes.
- This code has not been runtime-tested against your live bot/database.
- Never commit bot tokens or other secrets.

Official docs: [Telegram Serverless](https://core.telegram.org/bots/serverless) · [CLI reference](https://core.telegram.org/bots/serverless#command-line-interface)
