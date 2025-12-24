/**
 * Migration: Create Merchant Settlement Line Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('merchantSettlementLine');
  if (hasTable) return;

  await knex.schema.createTable('merchantSettlementLine', table => {
    table.uuid('merchantSettlementLineId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('merchantSettlementId').notNullable().references('merchantSettlementId').inTable('merchantSettlement').onDelete('CASCADE');
    table.uuid('orderId').notNullable();
    table.timestamp('orderDate').notNullable();
    table.decimal('grossAmount', 12, 2).notNullable();
    table.decimal('commissionRate', 5, 4).notNullable();
    table.decimal('commissionAmount', 12, 2).notNullable();
    table.decimal('fees', 12, 2).defaultTo(0);
    table.decimal('netAmount', 12, 2).notNullable();
    table.string('type').defaultTo('sale'); // sale, refund, chargeback, adjustment
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index(['merchantSettlementId']);
    table.index(['orderId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('merchantSettlementLine');
};
