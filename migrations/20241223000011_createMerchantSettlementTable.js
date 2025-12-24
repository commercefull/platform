/**
 * Migration: Create Merchant Settlement Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('merchantSettlement');
  if (hasTable) return;

  await knex.schema.createTable('merchantSettlement', table => {
    table.uuid('merchantSettlementId').primary().defaultTo(knex.raw('uuidv7()'));
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
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('merchantSettlement');
};
