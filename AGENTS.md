# Telegram Serverless project rules

- Keep `schema.js` at repository root.
- Keep handlers directly under `handlers/`; handler directories are flat.
- Import project modules by bare name, e.g. `import { users } from 'schema';`; no relative paths or `.js` extension for project-module imports.
- Import platform APIs from `sdk` and database helpers from `sdk/db`.
- Await database operations.
- Review schema changes and migrations before applying them to the live database.
- Never commit bot tokens or other secrets.
- Keep user-facing messages available in Pashto, Dari, English, Urdu, and Arabic.
