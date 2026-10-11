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
  welcome_reward_claimed: integer('welcome_reward_claimed').notNull().default(0),
  profile_visibility: text('profile_visibility').notNull().default('everyone'),
  search_gender: text('search_gender').notNull().default('auto'),
  search_language: text('search_language').notNull().default('auto'),
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
  last_activity_at: text('last_activity_at'),
  end_reason: text('end_reason'),
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

export const connection_requests = table('connection_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requester_id: integer('requester_id').notNull(),
  recipient_id: integer('recipient_id'),
  status: text('status').notNull().default('searching'),
  request_type: text('request_type').notNull().default('random'),
  gender_filter: text('gender_filter').notNull().default('auto'),
  language_filter: text('language_filter').notNull().default('auto'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const chat_messages = table('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  session_id: integer('session_id').notNull(),
  sender_id: integer('sender_id').notNull(),
  recipient_id: integer('recipient_id').notNull(),
  recipient_message_id: integer('recipient_message_id').notNull(),
  created_at: text('created_at').notNull(),
});

export const user_ratings = table('user_ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  session_id: integer('session_id').notNull(),
  rater_id: integer('rater_id').notNull(),
  rated_id: integer('rated_id').notNull(),
  rating: integer('rating').notNull(),
  created_at: text('created_at').notNull(),
});

export const user_likes = table('user_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  liker_id: integer('liker_id').notNull(),
  liked_id: integer('liked_id').notNull(),
  created_at: text('created_at').notNull(),
});

export const game_sessions = table('game_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_id: integer('player_id').notNull(),
  opponent_id: integer('opponent_id'),
  status: text('status').notNull().default('waiting'),
  player_roll: integer('player_roll'),
  opponent_roll: integer('opponent_roll'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  fee_stars: text('fee_stars').notNull().default('0.5'),
  win_stars: text('win_stars').notNull().default('3'),
  bot_loss_total_stars: text('bot_loss_total_stars').notNull().default('3.5'),
  points_award: integer('points_award').notNull().default(1),
});
