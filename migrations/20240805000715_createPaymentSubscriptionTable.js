exports.up = function(knex) {
  return knex.schema.createTable('paymentSubscription', t => {
    t.uuid('paymentSubscriptionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('paymentPlanId').notNullable().references('paymentPlanId').inTable('paymentPlan').onDelete('CASCADE');
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('status', 20).notNullable().checkIn(['active', 'canceled', 'expired', 'pastDue', 'pending', 'paused', 'trial']).defaultTo('pending');
    t.uuid('storedPaymentMethodId').references('storedPaymentMethodId').inTable('storedPaymentMethod').onDelete('CASCADE');
    t.timestamp('startDate').notNullable();
    t.timestamp('trialEndDate');
    t.timestamp('nextBillingDate');
    t.timestamp('lastBillingDate');
    t.timestamp('endDate');
    t.timestamp('canceledAt');
    t.timestamp('currentPeriodStart');
    t.timestamp('currentPeriodEnd');
    t.integer('failedPaymentCount').notNullable().defaultTo(0);
    t.text('lastPaymentError');
    t.string('gatewaySubscriptionId', 255);
    t.jsonb('planSnapshot');
    

    t.index('customerId');
    t.index('paymentPlanId');
    t.index('merchantId');
    t.index('status');
    t.index('storedPaymentMethodId');
    t.index('nextBillingDate');
    t.index('gatewaySubscriptionId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentSubscription');
};
