-- Random Connect data-integrity migration
-- Review and back up the database before running.
-- This migration removes duplicate relationship rows, keeping the lowest id.
-- It does not delete users, sessions, game sessions, reports, or messages.
-- Run only after the base schema/tables exist.

BEGIN TRANSACTION;

DELETE FROM favorites
WHERE id NOT IN (
  SELECT MIN(id) FROM favorites GROUP BY user_telegram_id, favorite_telegram_id
);

DELETE FROM user_blocks
WHERE id NOT IN (
  SELECT MIN(id) FROM user_blocks GROUP BY blocker_telegram_id, blocked_telegram_id
);

DELETE FROM user_likes
WHERE id NOT IN (
  SELECT MIN(id) FROM user_likes GROUP BY liker_id, liked_id
);

DELETE FROM user_ratings
WHERE id NOT IN (
  SELECT MIN(id) FROM user_ratings GROUP BY session_id, rater_id, rated_id
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_favorites_user_favorite
  ON favorites(user_telegram_id, favorite_telegram_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_blocks_blocker_blocked
  ON user_blocks(blocker_telegram_id, blocked_telegram_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_likes_liker_liked
  ON user_likes(liker_id, liked_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_ratings_session_rater_rated
  ON user_ratings(session_id, rater_id, rated_id);

-- Do not rewrite users.likes here: the application also uses that field for
-- welcome/referral rewards and admin adjustments, so recalculating it from
-- user_likes would silently destroy legitimate balances.

COMMIT;

-- Active connection/game exclusivity is intentionally not enforced by this
-- migration yet: legacy active rows must first be audited and reconciled.
-- Do not add partial unique indexes for active requests/sessions until that
-- reconciliation is completed, or an existing production database may fail
-- to migrate.
