# Instructions for contributors and AI coding assistants

This project targets Telegram Serverless. Follow its official runtime rules.

- Runtime modules must live under `tgcloud/`.
- Use only platform SDK imports such as `sdk` and `sdk/db`; do not import third-party runtime packages.
- Use relative imports with the `.js` extension, e.g. `../schema.js`.
- Message handlers receive a Telegram Message object as their first argument.
- Use `api.sendMessage({ chat_id, text, reply_markup })` for replies.
- Database calls are asynchronous. Define tables in `tgcloud/schema.js`.
- Code changes in this repository do not deploy automatically. Review and deploy through the official Telegram Serverless workflow.
- Never store bot tokens or secrets in source control.
- Before changing schema fields, compare with the user's current live schema and review the migration; do not assume a GitHub schema file has migrated the live database.
- Keep user-facing text available in Pashto, Dari, English, Urdu, and Arabic.
