exports.up = function (knex) {
  return knex.schema.createTable('paymentFee', t => {
    t.uuid('paymentFeeId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('type', 50)
      .notNullable()
      .checkIn(['transaction', 'subscription', 'dispute', 'refund', 'chargeback', 'payout', 'platform', 'other']);
    t.decimal('amount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.text('description');
    t.uuid('orderPaymentId').references('orderPaymentId').inTable('orderPayment').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('paymentSubscriptionId').references('paymentSubscriptionId').inTable('paymentSubscription').onDelete('CASCADE');
    t.uuid('payoutId').references('payoutId').inTable('payout').onDelete('CASCADE');
    t.timestamp('appliedAt').notNullable().defaultTo(knex.fn.now());

    t.index('merchantId');
    t.index('type');
    t.index('orderPaymentId');
    t.index('orderId');
    t.index('paymentSubscriptionId');
    t.index('payoutId');
    t.index('appliedAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('paymentFee');
};
