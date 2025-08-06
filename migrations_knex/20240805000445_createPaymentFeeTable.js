exports.up = function(knex) {
  return knex.schema.createTable('paymentFee', t => {
    t.uuid('paymentFeeId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('type', 50).notNullable().checkIn(['transaction', 'subscription', 'dispute', 'refund', 'chargeback', 'payout', 'platform', 'other']);
    t.decimal('amount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.text('description');
    t.uuid('paymentId').references('paymentId').inTable('orderPayment').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('subscriptionId').references('subscriptionId').inTable('paymentSubscription').onDelete('CASCADE');
    t.uuid('payoutId').references('payoutId').inTable('payout').onDelete('CASCADE');
    t.timestamp('appliedAt').notNullable().defaultTo(knex.fn.now());
    t.jsonb('metadata');

    t.index('merchantId');
    t.index('type');
    t.index('paymentId');
    t.index('orderId');
    t.index('subscriptionId');
    t.index('payoutId');
    t.index('appliedAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentFee');
};
