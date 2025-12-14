exports.up = function(knex) {
  return knex.schema.createTable('paymentTransaction', t => {
    t.uuid('paymentTransactionId').primary().defaultTo(knex.raw('uuidv7()'));
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
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.uuid('paymentMethodId').references('paymentMethodId').inTable('paymentMethod').onDelete('SET NULL');
    t.uuid('paymentGatewayId').references('paymentGatewayId').inTable('paymentGateway').onDelete('SET NULL');
    t.string('externalTransactionId', 255);
    t.string('currency', 3).defaultTo('USD');
    t.jsonb('paymentMethodDetails');
    t.decimal('refundedAmount', 15, 2).defaultTo(0);
    t.jsonb('metadata');
    t.string('customerIp', 45);
    t.timestamp('authorizedAt');
    t.timestamp('capturedAt');
    t.timestamp('deletedAt');
    

    t.index('orderPaymentId');
    t.index('orderId');
    t.index('type');
    t.index('status');
    t.index('transactionId');
    t.index('createdAt');
    t.index('customerId');
    t.index('paymentMethodId');
    t.index('paymentGatewayId');
    t.index('externalTransactionId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentTransaction');
};
