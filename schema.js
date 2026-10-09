import { table, integer, text } from 'sdk/db';

// Telegram Connect database schema.
// Keep all tables in this file. Apply schema changes through the Serverless
// database migration screen before deploying handlers that use new columns.

export const users = table('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegram_id: integer('telegram_id').notNull().unique(),
  username: text('username'),
  first_name: text('first_name'),
  language: text('language').notNull().default('ps'),
  is_blocked: integer('is_blocked').notNull().default(0),
  state: text('state'),
  draft_type: text('draft_type'),
  draft_name: text('draft_name'),
  draft_username: text('draft_username'),
  draft_description: text('draft_description'),
  draft_category: text('draft_category'),
  draft_language: text('draft_language'),
  draft_price: integer('draft_price'),
  draft_title: text('draft_title'),
  draft_budget: integer('draft_budget'),
  draft_ad_target: text('draft_ad_target'),
  draft_url: text('draft_url'),
  draft_offer_listing_id: integer('draft_offer_listing_id'),
  draft_offer_price: integer('draft_offer_price'),
  created_at: text('created_at').notNull(),
});

export const listings = table('listings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  owner_id: integer('owner_id').notNull(),
  type: text('type').notNull(), // channel | group | bot
  name: text('name').notNull(),
  username: text('username'),
  description: text('description'),
  category: text('category'),
  language: text('language').notNull().default('ps'),
  ad_price: integer('ad_price'),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'), // pending | approved | rejected
  created_at: text('created_at').notNull(),
});

export const ads = table('ads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  owner_id: integer('owner_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  budget: integer('budget'),
  target: text('target'), // optional public @channel or @group to publish into
  url: text('url'), // optional URL shown as an inline button
  status: text('status').notNull().default('pending'), // pending | approved | rejected | published
  published_chat: text('published_chat'),
  created_at: text('created_at').notNull(),
});

export const ad_requests = table('ad_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listing_id: integer('listing_id').notNull(),
  advertiser_id: integer('advertiser_id').notNull(),
  owner_id: integer('owner_id').notNull(),
  message: text('message'),
  offered_price: integer('offered_price'),
  status: text('status').notNull().default('pending'), // pending | accepted | rejected
  created_at: text('created_at').notNull(),
});
