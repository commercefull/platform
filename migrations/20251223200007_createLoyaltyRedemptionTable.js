/**
 * Migration: Create Loyalty Redemption Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('loyaltyRedemption');
  if (hasTable) return;

  await knex.schema.createTable('loyaltyRedemption', table => {
    table.uuid('redemptionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('customerId').notNullable();
    table.uuid('rewardId').notNullable();
    table.uuid('orderId').nullable();
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
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('loyaltyRedemption');
};
