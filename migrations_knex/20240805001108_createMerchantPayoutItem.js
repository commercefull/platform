/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantPayoutItem', t => {
    t.uuid('merchantPayoutItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantPayoutId').notNullable().references('merchantPayoutId').inTable('merchantPayout').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order');
    t.uuid('merchantOrderId').references('merchantOrderId').inTable('merchantOrder');
    t.decimal('amount', 15, 2).notNullable();
    t.text('description');
    t.enu('type', ['order', 'adjustment', 'fee', 'refund'], { useNative: true, enumName: 'merchant_payout_item_type' }).notNullable().defaultTo('order');
    t.jsonb('metadata');
    t.index('payoutId');
    t.index('orderId');
    t.index('merchantOrderId');
    t.index('amount');
    t.index('type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantPayoutItem')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS merchant_payout_item_type'));
};
