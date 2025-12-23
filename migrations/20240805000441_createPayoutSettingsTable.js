exports.up = function (knex) {
  return knex.schema.createTable('payoutSettings', t => {
    t.uuid('payoutSettingsId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').unique();
    t.enum('frequency', ['daily', 'weekly', 'monthly']).notNullable().defaultTo('weekly');
    t.decimal('minimumAmount', 15, 2).notNullable().defaultTo(1.0);
    t.uuid('bankAccountId');
    t.integer('payoutDay');
    t.integer('holdPeriod').notNullable().defaultTo(0);
    t.boolean('automaticPayouts').notNullable().defaultTo(true);
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.enum('payoutProvider', ['stripe', 'square', 'other']).notNullable().defaultTo('stripe');
    t.string('payoutMethod', 50).notNullable().checkIn(['bank_transfer', 'paypal', 'check', 'other']).defaultTo('bank_transfer');
    t.jsonb('providerSettings');

    t.index('merchantId');
    t.index('frequency');
    t.index('payoutProvider');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('payoutSettings');
};
