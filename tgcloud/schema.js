import { table, integer, text, real, index } from 'sdk/db';

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
  stars: real('stars').notNull().default(0),
  points: integer('points').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  last_active_at: text('last_active_at'),
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
  }, (t) => ({
    lastActiveIdx: index('idx_users_last_active').on(t.last_active_at),
    stateIdx: index('idx_users_state').on(t.state),
    referrerIdx: index('idx_users_referrer').on(t.referrer_id),
  }));

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
  }, (t) => ({
    activeIdx: index('idx_required_chats_active').on(t.is_active),
  }));

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
  }, (t) => ({
    userFavoriteIdx: index('idx_favorites_user_favorite').on(t.user_telegram_id, t.favorite_telegram_id),
    favoriteUserIdx: index('idx_favorites_favorite_user').on(t.favorite_telegram_id, t.user_telegram_id),
  }));

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
  }, (t) => ({
    statusActivityIdx: index('idx_chat_sessions_status_activity').on(t.status, t.last_activity_at),
    firstUserIdx: index('idx_chat_sessions_first_user').on(t.first_user_telegram_id, t.status),
    secondUserIdx: index('idx_chat_sessions_second_user').on(t.second_user_telegram_id, t.status),
  }));

export const user_blocks = table('user_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  blocker_telegram_id: integer('blocker_telegram_id').notNull(),
  blocked_telegram_id: integer('blocked_telegram_id').notNull(),
  created_at: text('created_at').notNull(),
  }, (t) => ({
    blockerBlockedIdx: index('idx_user_blocks_blocker_blocked').on(t.blocker_telegram_id, t.blocked_telegram_id),
    blockedBlockerIdx: index('idx_user_blocks_blocked_blocker').on(t.blocked_telegram_id, t.blocker_telegram_id),
  }));


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
  }, (t) => ({
    requesterStatusIdx: index('idx_connection_requests_requester_status').on(t.requester_id, t.status),
    recipientStatusIdx: index('idx_connection_requests_recipient_status').on(t.recipient_id, t.status),
    statusCreatedIdx: index('idx_connection_requests_status_created').on(t.status, t.created_at),
  }));

export const chat_messages = table('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  session_id: integer('session_id').notNull(),
  sender_id: integer('sender_id').notNull(),
  recipient_id: integer('recipient_id').notNull(),
  recipient_message_id: integer('recipient_message_id').notNull(),
  source_message_id: integer('source_message_id'),
  created_at: text('created_at').notNull(),
  }, (t) => ({
    sessionCreatedIdx: index('idx_chat_messages_session_created').on(t.session_id, t.created_at),
    senderIdx: index('idx_chat_messages_sender').on(t.sender_id),
    recipientIdx: index('idx_chat_messages_recipient').on(t.recipient_id),
  }));

export const user_ratings = table('user_ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  session_id: integer('session_id').notNull(),
  rater_id: integer('rater_id').notNull(),
  rated_id: integer('rated_id').notNull(),
  rating: integer('rating').notNull(),
  created_at: text('created_at').notNull(),
  }, (t) => ({
    sessionRaterRatedIdx: index('idx_user_ratings_session_rater_rated').on(t.session_id, t.rater_id, t.rated_id),
    ratedIdx: index('idx_user_ratings_rated').on(t.rated_id),
  }));

export const user_likes = table('user_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  liker_id: integer('liker_id').notNull(),
  liked_id: integer('liked_id').notNull(),
  created_at: text('created_at').notNull(),
  }, (t) => ({
    likerLikedIdx: index('idx_user_likes_liker_liked').on(t.liker_id, t.liked_id),
    likedIdx: index('idx_user_likes_liked').on(t.liked_id),
  }));

export const game_sessions = table('game_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_id: integer('player_id').notNull(),
  opponent_id: integer('opponent_id'),
  status: text('status').notNull().default('waiting'),
  player_roll: integer('player_roll'),
  opponent_roll: integer('opponent_roll'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  fee_stars: real('fee_stars').notNull().default(0.5),
  win_stars: real('win_stars').notNull().default(3.5),
  // Legacy compatibility column retained for existing databases; current game logic does not read or write it.
  bot_loss_total_stars: real('bot_loss_total_stars').notNull().default(3.5),
  points_award: integer('points_award').notNull().default(1),
  }, (t) => ({
    statusUpdatedIdx: index('idx_game_sessions_status_updated').on(t.status, t.updated_at),
    playerStatusIdx: index('idx_game_sessions_player_status').on(t.player_id, t.status),
    opponentStatusIdx: index('idx_game_sessions_opponent_status').on(t.opponent_id, t.status),
  }));
