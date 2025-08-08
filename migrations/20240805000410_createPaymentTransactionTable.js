exports.up = function(knex) {
  return knex.schema.createTable('paymentTransaction', t => {
    t.uuid('paymentTransactionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderPaymentId').notNullable().references('orderPaymentId').inTable('orderPayment').onDelete('CASCADE');
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.string('type', 50).notNullable().checkIn(['authorization', 'capture', 'sale', 'refund', 'void', 'verification']);
    t.decimal('amount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.string('status', 50).notNullable();
    t.string('transactionId', 255);
    t.string('authorizationCode', 255);
    t.string('responseCode', 50);
    t.text('responseMessage');
    t.string('errorCode', 100);
    t.text('errorMessage');
    t.jsonb('gatewayResponse');
    

    t.index('orderPaymentId');
    t.index('orderId');
    t.index('type');
    t.index('status');
    t.index('transactionId');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentTransaction');
};
