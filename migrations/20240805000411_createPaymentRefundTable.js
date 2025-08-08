exports.up = function(knex) {
  return knex.schema.createTable('paymentRefund', t => {
    t.uuid('paymentRefundId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
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
    

    t.index('orderPaymentId');
    t.index('orderId');
    t.index('transactionId');
    t.index('status');
    t.index('refundId');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentRefund');
};
