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
  profile_photo_id: text('profile_photo_id'),
  channel_username: text('channel_username'),
  stars: integer('stars').notNull().default(0),
  points: integer('points').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  last_active_at: text('last_active_at'),
  connection_request_mode: text('connection_request_mode').notNull().default('all'),
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

export const chat_sessions = table('chat_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  first_user_telegram_id: integer('first_user_telegram_id').notNull(),
  second_user_telegram_id: integer('second_user_telegram_id'),
  status: text('status').notNull().default('waiting'),
  created_at: text('created_at').notNull(),
  connected_at: text('connected_at'),
  ended_at: text('ended_at'),
});

export const user_blocks = table('user_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  blocker_telegram_id: integer('blocker_telegram_id').notNull(),
  blocked_telegram_id: integer('blocked_telegram_id').notNull(),
  created_at: text('created_at').notNull(),
});

export const reports = table('reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reporter_telegram_id: integer('reporter_telegram_id').notNull(),
  reported_telegram_id: integer('reported_telegram_id').notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'),
  reviewed_by: integer('reviewed_by'),
  reviewed_at: text('reviewed_at'),
  created_at: text('created_at').notNull(),
});
