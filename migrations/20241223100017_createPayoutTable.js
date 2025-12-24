/**
 * Migration: Create Payout Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('payout');
  if (hasTable) return;

  await knex.schema.createTable('payout', table => {
    table.uuid('payoutId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('sellerId').notNullable();
    table.uuid('orderId').nullable();
    table.uuid('settlementId').nullable();
    table.decimal('grossAmount', 15, 2).notNullable();
    table.decimal('commissionAmount', 15, 2).notNullable();
    table.decimal('feeAmount', 15, 2).defaultTo(0);
    table.decimal('netAmount', 15, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.string('status', 20).defaultTo('pending'); // 'pending', 'scheduled', 'processing', 'completed', 'failed'
    table.date('scheduledDate').nullable();
    table.timestamp('processedAt').nullable();
    table.string('paymentReference', 100).nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('sellerId');
    table.index('orderId');
    table.index('settlementId');
    table.index('status');
    table.index('scheduledDate');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payout');
};
