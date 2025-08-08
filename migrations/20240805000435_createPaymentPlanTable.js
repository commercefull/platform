exports.up = function(knex) {
  return knex.schema.createTable('paymentPlan', t => {
    t.uuid('paymentPlanId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant');
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isPublic').notNullable().defaultTo(true);
    t.decimal('amount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.string('billingInterval', 20).notNullable().checkIn(['daily', 'weekly', 'monthly', 'quarterly', 'biannually', 'annually']).defaultTo('monthly');
    t.integer('billingFrequency').notNullable().defaultTo(1);
    t.integer('trialPeriodDays').defaultTo(0);
    t.decimal('setupFee', 15, 2).defaultTo(0);
    t.integer('maxBillingCycles');
    t.boolean('autoRenew').notNullable().defaultTo(true);
    t.integer('gracePeriodDays').notNullable().defaultTo(3);
    t.jsonb('cancelationPolicy');
    t.specificType('allowedPaymentMethods', '"paymentMethodType"[]');
    
    
    t.index('merchantId');
    t.index('isActive');
    t.index('isPublic');
    t.index('billingInterval');
    t.index('amount');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentPlan');
};
