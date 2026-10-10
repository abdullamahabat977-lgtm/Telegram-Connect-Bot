import { table, integer, text } from 'sdk/db';

export const users = table('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegram_id: integer('telegram_id').notNull().unique(),
  username: text('username'),
  first_name: text('first_name'),
  language: text('language').notNull().default('ps'),
  country: text('country'),
  gender: text('gender'),
  age: integer('age'),
  name: text('name'),
  surname: text('surname'),
  state: text('state').notNull().default('choose_language'),
  is_blocked: integer('is_blocked').notNull().default(0),
  referrer_id: integer('referrer_id'),
  referral_count: integer('referral_count').notNull().default(0),
  last_prompt_id: integer('last_prompt_id').notNull().default(0),
  created_at: text('created_at').notNull(),
});

export const admins = table('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegram_id: integer('telegram_id').notNull().unique(),
  created_at: text('created_at').notNull(),
});

export const required_chats = table('required_chats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chat_id: text('chat_id').notNull().unique(),
  invite_link: text('invite_link').notNull(),
  title: text('title').notNull(),
  is_active: integer('is_active').notNull().default(1),
  created_at: text('created_at').notNull(),
});

export const app_settings = table('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  setting_key: text('setting_key').notNull().unique(),
  setting_value: text('setting_value').notNull(),
});

export const favorites = table('favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_telegram_id: integer('user_telegram_id').notNull(),
  favorite_telegram_id: integer('favorite_telegram_id').notNull(),
  created_at: text('created_at').notNull(),
});
