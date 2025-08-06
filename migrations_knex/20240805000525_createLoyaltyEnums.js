exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "loyalty_tier_type" AS ENUM (
      'bronze',
      'silver',
      'gold',
      'platinum',
      'custom'
    );
    CREATE TYPE "loyalty_transaction_action" AS ENUM (
      'purchase',
      'review',
      'referral',
      'signup',
      'birthday',
      'anniversary',
      'manual_adjustment',
      'redemption',
      'expiration'
    );
    CREATE TYPE "loyalty_redemption_status" AS ENUM (
      'pending',
      'used',
      'expired',
      'cancelled'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "loyalty_tier_type";
    DROP TYPE IF EXISTS "loyalty_transaction_action";
    DROP TYPE IF EXISTS "loyalty_redemption_status";
  `);
};
