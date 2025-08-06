/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderPaymentRefund', t => {
    t.uuid('orderPaymentRefundId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('orderPaymentId').notNullable().references('orderPaymentId').inTable('orderPayment').onDelete('CASCADE');
    t.decimal('amount', 15, 2).notNullable();
    t.string('reason', 255);
    t.text('notes');
    t.string('transactionId', 255);
    t.enum('status', ['pending', 'completed', 'failed']).notNullable().defaultTo('pending');
    t.jsonb('gatewayResponse');
    t.uuid('refundedBy');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('orderPaymentId');
    t.index('status');
    t.index('transactionId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderPaymentRefund');
};
