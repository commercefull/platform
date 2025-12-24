/**
 * Migration: Create Merchant Settlement Payout Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('merchantSettlementPayout');
  if (hasTable) return;

  await knex.schema.createTable('merchantSettlementPayout', table => {
    table.uuid('merchantSettlementPayoutId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('merchantSettlementId').notNullable().references('merchantSettlementId').inTable('merchantSettlement');
    table.uuid('merchantId').notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.string('status').notNullable().defaultTo('pending'); // pending, processing, completed, failed
    table.string('payoutMethod'); // bank_transfer, paypal, stripe_connect
    table.string('externalReference');
    table.text('failureReason');
    table.timestamp('processedAt');
    table.text('notes');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['merchantId']);
    table.index(['status']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('merchantSettlementPayout');
};
