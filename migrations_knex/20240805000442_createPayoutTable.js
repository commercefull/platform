exports.up = function(knex) {
  return knex.schema.createTable('payout', t => {
    t.uuid('payoutId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant');
    t.decimal('amount', 15, 2).notNullable();
    t.decimal('fee', 15, 2).notNullable().defaultTo(0);
    t.decimal('netAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.enu('status', null, { useNative: true, existingType: true, enumName: 'payoutStatus' }).notNullable().defaultTo('pending');
    t.string('payoutMethod', 50).notNullable().checkIn(['bank_transfer', 'paypal', 'check', 'other']).defaultTo('bank_transfer');
    t.uuid('bankAccountId');
    t.jsonb('bankAccountDetails');
    t.text('description');
    t.string('statementDescriptor', 255);
    t.timestamp('periodStart');
    t.timestamp('periodEnd');
    t.timestamp('expectedArrivalDate');
    t.timestamp('completedAt');
    t.text('failureReason');
    t.string('transactionReference', 255);
    t.string('gatewayPayoutId', 255);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deletedAt');

    t.index('merchantId');
    t.index('status');
    t.index('payoutMethod');
    t.index('periodStart');
    t.index('periodEnd');
    t.index('gatewayPayoutId');
    t.index('transactionReference');
    t.index('completedAt');
    t.index('createdAt');
    t.index('deletedAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payout');
};
