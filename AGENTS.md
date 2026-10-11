Random Connect project rules

- Follow the current Telegram Serverless documentation first.
- Current runtime layout: tgcloud/schema.js, event-specific modules in tgcloud/handlers/ (currently message.js and callback_query.js), and reusable helpers in tgcloud/lib/.
- Keep handlers flat and map each handler file to an actual Telegram update type. Do not create unrelated/empty handlers just to cover all Bot API update types.
- Put shared helpers and feature modules in tgcloud/lib/; relative imports must end with .js. Keep lib subdirectories only when useful.
- Preserve existing behavior while refactoring; verify all imports/exports and syntax before proposing deployment.
- Import platform APIs from sdk and database helpers from sdk/db.
- Import project modules using relative paths with the .js extension.
- Await all database operations.
- Review database changes before applying migrations. Do not confirm table drops until the user has reviewed them.
- Never commit bot tokens or other secrets.
- Keep user-facing messages available in Pashto, Dari, English, Urdu, and Arabic.
- The user works on Android and needs complete, copy-ready file contents and step-by-step Pashto instructions.
