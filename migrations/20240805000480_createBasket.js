/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('basket', t => {
    t.uuid('basketId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId');
    t.string('sessionId', 255);
    t.enum('status', ['active', 'merged', 'converted', 'abandoned', 'completed']).notNullable().defaultTo('active');
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.integer('itemsCount').notNullable().defaultTo(0);
    t.decimal('subTotal', 15, 2).notNullable().defaultTo(0);
    t.decimal('taxAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('discountAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('shippingAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('grandTotal', 15, 2).notNullable().defaultTo(0);
    t.jsonb('metadata');

    t.timestamp('expiresAt');
    t.uuid('convertedToOrderId');
    t.timestamp('lastActivityAt').notNullable().defaultTo(knex.fn.now());
    t.index('customerId');
    t.index('sessionId');
    t.index('status');
    t.index('lastActivityAt');
    t.index('expiresAt');
    t.index('convertedToOrderId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basket');
};
