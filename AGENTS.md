Random Connect project rules

- Follow the current Telegram Serverless documentation first.
- Current documented runtime layout: tgcloud/schema.js and tgcloud/handlers/message.js.
- Reuse the existing message handler for the current stages. Do not add a new Telegram event handler without explicit user approval.
- Import platform APIs from sdk and database helpers from sdk/db.
- Import project modules using relative paths with the .js extension.
- Await all database operations.
- Review database changes before applying migrations. Do not confirm table drops until the user has reviewed them.
- Never commit bot tokens or other secrets.
- Keep user-facing messages available in Pashto, Dari, English, Urdu, and Arabic.
- The user works on Android and needs complete, copy-ready file contents and step-by-step Pashto instructions.
