/**
 * Migration: Create Loyalty Points Batch Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('loyaltyPointsBatch');
  if (hasTable) return;

  await knex.schema.createTable('loyaltyPointsBatch', table => {
    table.uuid('batchId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('customerId').notNullable();
    table.uuid('programId').nullable();
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
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('loyaltyPointsBatch');
};
