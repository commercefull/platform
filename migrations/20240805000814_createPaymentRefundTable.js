exports.up = function (knex) {
  return knex.schema.createTable('paymentRefund', t => {
    t.uuid('paymentRefundId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderPaymentId').notNullable().references('orderPaymentId').inTable('orderPayment').onDelete('CASCADE');
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('transactionId').references('paymentTransactionId').inTable('paymentTransaction').onDelete('SET NULL');
    t.decimal('amount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.string('reason', 255);
    t.string('status', 50).notNullable().defaultTo('pending');
    t.string('refundId', 255);
    t.uuid('paymentTransactionId').references('paymentTransactionId').inTable('paymentTransaction').onDelete('CASCADE');
    t.string('externalRefundId', 255);
    t.string('currency', 3).defaultTo('USD');
    t.jsonb('gatewayResponse');
    t.string('errorCode', 100);
    t.text('errorMessage');
    t.timestamp('processedAt');
    t.jsonb('metadata');

    // Add indexes
    t.index('orderPaymentId');
    t.index('orderId');
    t.index('transactionId');
    t.index('status');
    t.index('refundId');
    t.index('createdAt');
    t.index('paymentTransactionId');
    t.index('externalRefundId');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('paymentRefund');
};
