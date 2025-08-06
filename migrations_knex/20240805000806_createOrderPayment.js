/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderPayment', t => {
    t.uuid('orderPaymentId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('paymentMethodId').references('paymentMethodId').inTable('paymentMethod');
    t.enum('type', [
      'creditCard', 'debitCard', 'paypal', 'applePay', 'googlePay', 'bankTransfer', 'crypto', 'giftCard', 'storeCredit'
    ]).notNullable();
    t.string('provider', 100).notNullable();
    t.decimal('amount', 15, 2).notNullable();
    t.string('currency', 3).notNullable();
    t.enum('status', [
      'pending', 'authorized', 'captured', 'refunded', 'partiallyRefunded', 'voided', 'failed'
    ]).notNullable().defaultTo('pending');
    t.string('transactionId', 255);
    t.string('authorizationCode', 255);
    t.string('errorCode', 100);
    t.text('errorMessage');
    t.jsonb('metadata');
    t.string('maskedNumber', 30);
    t.string('cardType', 50);
    t.jsonb('gatewayResponse');
    t.decimal('refundedAmount', 15, 2).notNullable().defaultTo(0);
    t.timestamp('capturedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('orderId');
    t.index('paymentMethodId');
    t.index('type');
    t.index('provider');
    t.index('status');
    t.index('transactionId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderPayment');
};
