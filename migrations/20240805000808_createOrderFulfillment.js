/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderFulfillment', t => {
    t.uuid('orderFulfillmentId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.string('fulfillmentNumber', 100).notNullable();
    t.enum('type', ['shipping', 'pickup', 'digital', 'service']).notNullable().defaultTo('shipping');
    t.enum('status', ['pending', 'processing', 'shipped', 'delivered', 'failed', 'cancelled']).notNullable().defaultTo('pending');
    t.string('trackingNumber', 255);
    t.text('trackingUrl');
    t.string('carrierCode', 100);
    t.string('carrierName', 255);
    t.string('shippingMethod', 255);
    t.uuid('shippingAddressId').references('orderAddressId').inTable('orderAddress');
    t.decimal('weight', 10, 3);
    t.string('weightUnit', 10).defaultTo('kg');
    t.jsonb('dimensions');
    t.integer('packageCount').defaultTo(1);
    t.timestamp('shippedAt');
    t.timestamp('deliveredAt');
    t.timestamp('estimatedDeliveryDate');
    t.text('notes');

    t.uuid('fulfilledBy');
    t.index('orderId');
    t.index('fulfillmentNumber');
    t.index('status');
    t.index('trackingNumber');
    t.index('carrierCode');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderFulfillment');
};
