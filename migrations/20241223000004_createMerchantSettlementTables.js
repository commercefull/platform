/**
 * Migration: Create Merchant Settlement Tables
 */

exports.up = async function (knex) {
  // Create merchant_settlement table
  await knex.schema.createTable('merchantSettlement', table => {
    table.string('settlementId').primary();
    table.string('merchantId').notNullable();
    table.timestamp('periodStart').notNullable();
    table.timestamp('periodEnd').notNullable();
    table.decimal('grossSales', 12, 2).notNullable();
    table.decimal('totalCommission', 12, 2).notNullable();
    table.decimal('totalFees', 12, 2).defaultTo(0);
    table.decimal('refunds', 12, 2).defaultTo(0);
    table.decimal('chargebacks', 12, 2).defaultTo(0);
    table.decimal('adjustments', 12, 2).defaultTo(0);
    table.decimal('netPayout', 12, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.string('status').notNullable().defaultTo('pending'); // pending, approved, processing, paid, failed
    table.timestamp('approvedAt');
    table.string('approvedBy');
    table.timestamp('paidAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['merchantId']);
    table.index(['status']);
    table.index(['periodStart', 'periodEnd']);
  });

  // Create merchant_settlement_line table
  await knex.schema.createTable('merchantSettlementLine', table => {
    table.string('settlementLineId').primary();
    table.string('settlementId').notNullable().references('settlementId').inTable('merchantSettlement').onDelete('CASCADE');
    table.string('orderId').notNullable();
    table.timestamp('orderDate').notNullable();
    table.decimal('grossAmount', 12, 2).notNullable();
    table.decimal('commissionRate', 5, 4).notNullable();
    table.decimal('commissionAmount', 12, 2).notNullable();
    table.decimal('fees', 12, 2).defaultTo(0);
    table.decimal('netAmount', 12, 2).notNullable();
    table.string('type').defaultTo('sale'); // sale, refund, chargeback, adjustment
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index(['settlementId']);
    table.index(['orderId']);
  });

  // Create merchant_payout table
  await knex.schema.createTable('merchantPayout', table => {
    table.string('payoutId').primary();
    table.string('settlementId').notNullable().references('settlementId').inTable('merchantSettlement');
    table.string('merchantId').notNullable();
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

  // Create commission_profile table
  await knex.schema.createTable('commissionProfile', table => {
    table.string('commissionProfileId').primary();
    table.string('name').notNullable();
    table.decimal('baseRate', 5, 4).notNullable();
    table.jsonb('categoryRates'); // { categoryId: rate }
    table.jsonb('volumeDiscounts'); // [{ minVolume, rate }]
    table.decimal('fixedFeePerOrder', 12, 2).defaultTo(0);
    table.boolean('isDefault').defaultTo(false);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('commissionProfile');
  await knex.schema.dropTableIfExists('merchantPayout');
  await knex.schema.dropTableIfExists('merchantSettlementLine');
  await knex.schema.dropTableIfExists('merchantSettlement');
};
