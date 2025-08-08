exports.up = function(knex) {
  return knex.schema.createTable('paymentSettings', t => {
    t.uuid('paymentSettingsId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE').unique();
    t.boolean('capturePaymentsAutomatically').notNullable().defaultTo(true);
    t.integer('authorizationValidityPeriod').notNullable().defaultTo(7);
    t.boolean('cardVaultingEnabled').notNullable().defaultTo(true);
    t.boolean('allowGuestCheckout').notNullable().defaultTo(true);
    t.boolean('requireBillingAddress').notNullable().defaultTo(true);
    t.boolean('requireCvv').notNullable().defaultTo(true);
    t.boolean('requirePostalCodeVerification').notNullable().defaultTo(true);
    t.jsonb('threeDSecureSettings');
    t.jsonb('fraudDetectionSettings');
    t.jsonb('receiptSettings');
    t.jsonb('paymentFormCustomization');
    t.boolean('autoRefundOnCancel').notNullable().defaultTo(false);
    t.integer('paymentAttemptLimit').notNullable().defaultTo(3);
    

    t.index('merchantId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentSettings');
};
