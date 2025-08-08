/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantOrder', t => {
    t.uuid('merchantOrderId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.specificType('orderItemIds', 'uuid[]').notNullable();
    t.enu('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed'], { useNative: true, enumName: 'merchant_order_status' }).notNullable().defaultTo('pending');
    t.decimal('subtotal', 15, 2).notNullable();
    t.decimal('shipping', 15, 2).notNullable().defaultTo(0);
    t.decimal('tax', 15, 2).notNullable().defaultTo(0);
    t.decimal('discount', 15, 2).notNullable().defaultTo(0);
    t.decimal('total', 15, 2).notNullable();
    t.decimal('commissionAmount', 15, 2).notNullable();
    t.decimal('payoutAmount', 15, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.jsonb('shippingAddress');
    t.jsonb('billingAddress');
    t.string('shippingMethod', 100);
    t.string('trackingNumber', 100);
    t.string('trackingUrl', 255);
    t.string('carrierName', 100);
    t.text('customerNotes');
    t.text('merchantNotes');
    t.text('adminNotes');
    t.boolean('isPayoutProcessed').notNullable().defaultTo(false);
    t.timestamp('payoutDate');
    t.string('payoutTransactionId', 100);
    
    t.index('merchantId');
    t.index('orderId');
    t.index('orderItemIds', { indexType: 'GIN' });
    t.index('status');
    t.index('total');
    t.index('commissionAmount');
    t.index('payoutAmount');
    t.index('currency');
    t.index('trackingNumber');
    t.index('isPayoutProcessed');
    t.index('payoutDate');
    t.index('payoutTransactionId');
    t.index('createdAt');
    t.unique(['merchantId', 'orderId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantOrder');
};
