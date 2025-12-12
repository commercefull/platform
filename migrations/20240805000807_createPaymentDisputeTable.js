exports.up = function(knex) {
  return knex.schema.createTable('paymentDispute', t => {
    t.uuid('paymentDisputeId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.uuid('orderPaymentId').references('orderPaymentId').inTable('orderPayment').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('CASCADE');
    t.decimal('amount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.string('reason', 100).notNullable();
    t.string('status', 20).notNullable().checkIn(['pending', 'underReview', 'won', 'lost', 'withdrawn']).defaultTo('pending');
    t.jsonb('evidenceDetails');
    t.timestamp('evidenceSubmittedAt');
    t.timestamp('evidenceDueBy');
    t.string('gatewayDisputeId', 255);
    t.timestamp('resolvedAt');
    

    t.index('merchantId');
    t.index('orderPaymentId');
    t.index('orderId');
    t.index('customerId');
    t.index('status');
    t.index('gatewayDisputeId');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentDispute');
};
