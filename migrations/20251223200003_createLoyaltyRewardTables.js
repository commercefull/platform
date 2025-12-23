/**
 * Migration: Create Loyalty Reward Tables
 * Adds tables for loyalty rewards, redemptions, and points batches
 */

exports.up = async function(knex) {
  // Create loyaltyReward table
  const hasLoyaltyReward = await knex.schema.hasTable('loyaltyReward');
  if (!hasLoyaltyReward) {
    await knex.schema.createTable('loyaltyReward', (table) => {
      table.string('rewardId', 50).primary();
      table.string('programId', 50).nullable();
      table.string('name', 255).notNullable();
      table.text('description').nullable();
      table.string('type', 30).notNullable(); // 'discount', 'free_product', 'free_shipping', 'experience', 'gift_card'
      table.integer('pointsCost').notNullable();
      table.decimal('value', 10, 2).nullable();
      table.string('valueType', 20).nullable(); // 'percentage', 'fixed'
      table.string('productId', 50).nullable();
      table.string('categoryId', 50).nullable();
      table.decimal('minOrderValue', 10, 2).nullable();
      table.integer('maxUsagePerCustomer').nullable();
      table.integer('totalQuantity').nullable();
      table.integer('remainingQuantity').nullable();
      table.integer('redemptionExpiryDays').nullable();
      table.timestamp('validFrom').nullable();
      table.timestamp('validTo').nullable();
      table.boolean('isActive').defaultTo(true);
      table.jsonb('metadata').defaultTo('{}');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.index('programId');
      table.index('type');
      table.index('isActive');
      table.index('pointsCost');
    });
  }

  // Create loyaltyRedemption table
  const hasLoyaltyRedemption = await knex.schema.hasTable('loyaltyRedemption');
  if (!hasLoyaltyRedemption) {
    await knex.schema.createTable('loyaltyRedemption', (table) => {
      table.string('redemptionId', 50).primary();
      table.string('customerId', 50).notNullable();
      table.string('rewardId', 50).notNullable();
      table.string('orderId', 50).nullable();
      table.integer('pointsSpent').notNullable();
      table.string('status', 20).defaultTo('completed'); // 'pending', 'completed', 'cancelled', 'expired'
      table.string('couponCode', 50).nullable();
      table.timestamp('redeemedAt').notNullable();
      table.timestamp('expiresAt').nullable();
      table.timestamp('usedAt').nullable();
      table.jsonb('metadata').defaultTo('{}');

      table.index('customerId');
      table.index('rewardId');
      table.index('orderId');
      table.index('status');
      table.index('couponCode');
    });
  }

  // Create loyaltyPointsBatch table for tracking point expiration
  const hasLoyaltyPointsBatch = await knex.schema.hasTable('loyaltyPointsBatch');
  if (!hasLoyaltyPointsBatch) {
    await knex.schema.createTable('loyaltyPointsBatch', (table) => {
      table.string('batchId', 50).primary();
      table.string('customerId', 50).notNullable();
      table.string('programId', 50).nullable();
      table.integer('points').notNullable();
      table.integer('remainingPoints').notNullable();
      table.string('source', 50).notNullable(); // 'purchase', 'promotion', 'referral', 'adjustment', 'welcome'
      table.string('referenceType', 50).nullable();
      table.string('referenceId', 50).nullable();
      table.timestamp('earnedAt').notNullable();
      table.timestamp('expiresAt').nullable();
      table.boolean('isExpired').defaultTo(false);
      table.timestamp('expiredAt').nullable();

      table.index('customerId');
      table.index('programId');
      table.index('expiresAt');
      table.index('isExpired');
    });
  }

  // Create loyaltyTier table if not exists
  const hasLoyaltyTier = await knex.schema.hasTable('loyaltyTier');
  if (!hasLoyaltyTier) {
    await knex.schema.createTable('loyaltyTier', (table) => {
      table.string('tierId', 50).primary();
      table.string('programId', 50).nullable();
      table.string('name', 100).notNullable();
      table.text('description').nullable();
      table.integer('level').notNullable();
      table.integer('pointsThreshold').notNullable();
      table.integer('purchasesThreshold').defaultTo(0);
      table.decimal('pointsMultiplier', 5, 2).defaultTo(1);
      table.jsonb('benefits').defaultTo('[]');
      table.string('iconUrl', 500).nullable();
      table.string('color', 20).nullable();
      table.boolean('isActive').defaultTo(true);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.index('programId');
      table.index('level');
      table.index('isActive');
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('loyaltyTier');
  await knex.schema.dropTableIfExists('loyaltyPointsBatch');
  await knex.schema.dropTableIfExists('loyaltyRedemption');
  await knex.schema.dropTableIfExists('loyaltyReward');
};
