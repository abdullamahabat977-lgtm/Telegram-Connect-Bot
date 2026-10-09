import { table, integer, text } from 'sdk/db';

// User profiles and conversation state
export const users = table('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegram_id: integer('telegram_id').notNull().unique(),
  username: text('username'),
  first_name: text('first_name'),
  language: text('language').notNull().default('ps'),
  state: text('state'),
  draft_type: text('draft_type'),
  draft_name: text('draft_name'),
  draft_username: text('draft_username'),
  draft_description: text('draft_description'),
  draft_title: text('draft_title'),
  draft_budget: integer('draft_budget'),
  created_at: text('created_at').notNull(),
});

// Public directory: Telegram channels, groups, and bots
export const listings = table('listings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  owner_id: integer('owner_id').notNull(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  username: text('username'),
  description: text('description'),
  category: text('category'),
  status: text('status').notNull().default('pending'),
  created_at: text('created_at').notNull(),
});

// Advertisement requests submitted by users
export const ads = table('ads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  owner_id: integer('owner_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  budget: integer('budget'),
  status: text('status').notNull().default('pending'),
  created_at: text('created_at').notNull(),
});
