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


// Internal Stars wallet. This is an app ledger, not the user's Telegram Stars balance.
export const wallets = table('wallets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().unique(), // references users.id
  available_stars: integer('available_stars').notNull().default(0),
  pending_stars: integer('pending_stars').notNull().default(0),
  updated_at: text('updated_at').notNull(),
});

// Append-only wallet ledger. Use one unique idempotency_key per financial action.
export const wallet_transactions = table('wallet_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull(),
  promotion_id: integer('promotion_id'),
  transaction_type: text('transaction_type').notNull(), // topup | reserve | refund | owner_pending | release | reversal | commission
  bucket: text('bucket').notNull(), // available | pending
  amount_stars: integer('amount_stars').notNull(), // signed delta: positive or negative
  idempotency_key: text('idempotency_key').notNull().unique(),
  note: text('note'),
  created_at: text('created_at').notNull(),
});

// Successful Telegram Stars payments. Credit wallet only after successful_payment,
// and only once per telegram_payment_charge_id.
export const star_payments = table('star_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull(),
  telegram_payment_charge_id: text('telegram_payment_charge_id').notNull().unique(),
  provider_payment_charge_id: text('provider_payment_charge_id'),
  invoice_payload: text('invoice_payload').notNull().unique(),
  currency: text('currency').notNull(), // must be XTR for Telegram Stars
  total_amount: integer('total_amount').notNull(),
  status: text('status').notNull().default('successful'),
  created_at: text('created_at').notNull(),
});

// Promotion order and 48-hour safety/settlement lifecycle.
export const promotions = table('promotions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  advertiser_id: integer('advertiser_id').notNull(), // references users.id
  listing_id: integer('listing_id').notNull(),
  owner_id: integer('owner_id').notNull(), // references users.id
  channel_id: text('channel_id'),
  ad_text: text('ad_text').notNull(),
  ad_url: text('ad_url'),
  price_stars: integer('price_stars').notNull(),
  advertiser_fee_stars: integer('advertiser_fee_stars').notNull(),
  owner_fee_stars: integer('owner_fee_stars').notNull(),
  admin_commission_stars: integer('admin_commission_stars').notNull().default(0),
  status: text('status').notNull().default('draft'), // draft | awaiting_approval | published | monitoring | settled | refunded | failed
  approval_mode: text('approval_mode').notNull().default('owner_or_admin'), // auto | owner | owner_or_admin
  telegram_message_id: integer('telegram_message_id'),
  published_at: text('published_at'),
  settlement_due_at: text('settlement_due_at'),
  failure_reason: text('failure_reason'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});
