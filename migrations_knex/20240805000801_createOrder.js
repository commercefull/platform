/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('order', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('orderNumber', 100).notNullable().unique();
    t.uuid('customerId').references('id').inTable('customer');
    t.uuid('basketId').references('id').inTable('basket');
    t.enum('status', [
      'pending', 'processing', 'on_hold', 'completed', 'shipped', 
      'cancelled', 'refunded', 'failed', 'draft'
    ]).notNullable().defaultTo('pending');
    t.string('currency', 3).notNullable();
    t.string('locale', 10).notNullable().defaultTo('en-US');
    t.string('email', 255).notNullable();
    t.string('phoneNumber', 100);
    t.string('ipAddress', 50);
    t.text('userAgent');
    t.decimal('subtotal', 15, 2).notNullable();
    t.decimal('taxAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('shippingAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('discountAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('grandTotal', 15, 2).notNullable();
    t.boolean('taxIncluded').notNullable().defaultTo(false);
    t.text('notes');
    t.text('customerNote');
    t.text('adminNote');
    t.text('giftMessage');
    t.specificType('couponCodes', 'text[]');
    t.string('referralCode', 100);
    t.string('source', 100).notNullable().defaultTo('website');
    t.boolean('requiresShipping').notNullable().defaultTo(true);
    t.string('shippingMethod', 100);
    t.timestamp('estimatedDeliveryDate');
    t.timestamp('completedAt');
    t.timestamp('cancelledAt');
    t.timestamp('refundedAt');
    t.jsonb('metaData');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('orderNumber');
    t.index('customerId');
    t.index('basketId');
    t.index('status');
    t.index('email');
    t.index('createdAt');
    t.index('updatedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('order');
};
