/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('checkoutSession', t => {
    t.uuid('checkoutSessionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('sessionId', 255).notNullable().unique();
    t.uuid('basketId').notNullable().references('basketId').inTable('basket');
    t.uuid('customerId').references('customerId').inTable('customer');
    t.string('email', 255).notNullable();
    t.string('phoneNumber', 50);
    t.enum('status', ['active', 'completed', 'abandoned', 'expired']).notNullable().defaultTo('active');
    t.enum('step', ['cart', 'contact', 'shipping', 'billing', 'payment', 'review']).notNullable().defaultTo('cart');
    t.uuid('shippingAddressId').references('customerAddressId').inTable('customerAddress');
    t.uuid('billingAddressId').references('customerAddressId').inTable('customerAddress');
    t.boolean('sameBillingAsShipping').notNullable().defaultTo(true);
    t.string('selectedShippingMethodId', 100);
    t.boolean('shippingCalculated').notNullable().defaultTo(false);
    t.boolean('taxesCalculated').notNullable().defaultTo(false);
    t.boolean('agreeToTerms').notNullable().defaultTo(false);
    t.boolean('agreeToMarketing').notNullable().defaultTo(false);
    t.text('notes');
    t.string('ipAddress', 50);
    t.text('userAgent');
    t.text('referrer');
    t.uuid('convertedToOrderId').references('orderId').inTable('order');
    t.timestamp('expiresAt');

    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('lastActivityAt').notNullable().defaultTo(knex.fn.now());
    t.index('sessionId');
    t.index('basketId');
    t.index('customerId');
    t.index('email');
    t.index('status');
    t.index('step');
    t.index('convertedToOrderId');
    t.index('expiresAt');
    t.index('lastActivityAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('checkoutSession');
};
