/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantPayout', t => {
    t.uuid('merchantPayoutId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.uuid('paymentInfoId').references('merchantPaymentInfoId').inTable('merchantPaymentInfo');
    t.decimal('amount', 15, 2).notNullable();
    t.decimal('fee', 15, 2).notNullable().defaultTo(0);
    t.decimal('netAmount', 15, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.enu('payoutMethod', ['bank_transfer', 'paypal', 'stripe', 'check', 'other'], { useNative: true, enumName: 'merchant_payout_method' }).notNullable();
    t.string('transactionId', 255);
    t.string('reference', 255);
    t.enu('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'], { useNative: true, enumName: 'merchant_payout_status' }).notNullable().defaultTo('pending');
    t.text('notes');
    t.timestamp('startDate');
    t.timestamp('endDate');
    t.timestamp('requestedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('processedAt');
    t.timestamp('completedAt');
    t.text('failureReason');
    
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('merchantId');
    t.index('paymentInfoId');
    t.index('amount');
    t.index('currency');
    t.index('payoutMethod');
    t.index('transactionId');
    t.index('reference');
    t.index('status');
    t.index('startDate');
    t.index('endDate');
    t.index('requestedAt');
    t.index('processedAt');
    t.index('completedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantPayout');
};
