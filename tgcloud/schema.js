import { table, integer, text } from 'sdk/db';

export const users = table('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegram_id: integer('telegram_id').notNull().unique(),
  username: text('username'),
  first_name: text('first_name'),
  language: text('language').notNull().default('ps'),
  country: text('country'),
  state: text('state').notNull().default('choose_language'),
  is_blocked: integer('is_blocked').notNull().default(0),
  created_at: text('created_at').notNull(),
});
