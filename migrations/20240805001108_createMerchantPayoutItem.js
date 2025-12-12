/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantPayoutItem', t => {
    t.uuid('merchantPayoutItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantPayoutId').notNullable().references('merchantPayoutId').inTable('merchantPayout').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order');
    t.uuid('merchantOrderId').references('merchantOrderId').inTable('merchantOrder');
    t.decimal('amount', 15, 2).notNullable();
    t.text('description');
    t.enum('type', ['order', 'adjustment', 'fee', 'refund']).notNullable().defaultTo('order');
    
    t.index('merchantPayoutId');
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
  return knex.schema.dropTable('merchantPayoutItem');
};
