exports.up = function(knex) {
  return knex.schema.createTable('payoutItem', t => {
    t.uuid('payoutItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('payoutId').notNullable().references('payoutId').inTable('payout').onDelete('CASCADE');
    t.string('type', 50).notNullable().checkIn(['payment', 'refund', 'dispute', 'fee', 'adjustment', 'other']);
    t.decimal('amount', 15, 2).notNullable();
    t.decimal('fee', 15, 2).notNullable().defaultTo(0);
    t.decimal('netAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.text('description');
    t.uuid('orderId').references('orderId').inTable('order');
    t.uuid('orderPaymentId').references('orderPaymentId').inTable('orderPayment');
    t.uuid('paymentRefundId').references('paymentRefundId').inTable('paymentRefund');
    t.uuid('disputeId').references('paymentDisputeId').inTable('paymentDispute');
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deletedAt');

    t.index('payoutId');
    t.index('type');
    t.index('orderId');
    t.index('orderPaymentId');
    t.index('paymentRefundId');
    t.index('disputeId');
    t.index('deletedAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payoutItem');
};
