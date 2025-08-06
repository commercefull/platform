exports.up = function(knex) {
  return knex.schema.createTable('paymentMethodConfig', t => {
    t.uuid('paymentMethodConfigId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.enum('paymentMethod', ['creditCard', 'debitCard', 'giftCard', 'storeCredit', 'other']).notNullable();
    t.boolean('isEnabled').notNullable().defaultTo(true);
    t.string('displayName', 100);
    t.text('description');
    t.decimal('processingFee', 10, 2);
    t.decimal('minimumAmount', 15, 2);
    t.decimal('maximumAmount', 15, 2);
    t.integer('displayOrder').notNullable().defaultTo(0);
    t.text('icon');
    t.specificType('supportedCurrencies', 'varchar(3)[]').notNullable().defaultTo(knex.raw(`'{"USD"}'::varchar[]`));
    t.specificType('countries', 'varchar(2)[]');
    t.uuid('gatewayId').references('paymentGatewayId').inTable('paymentGateway').onDelete('CASCADE');
    t.jsonb('configuration');
    t.jsonb('metadata');

    t.index('merchantId');
    t.index('paymentMethod');
    t.index('isEnabled');
    t.index('displayOrder');
    t.index('gatewayId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentMethodConfig');
};
