exports.up = function(knex) {
  return knex.schema.createTable('paymentGateway', t => {
    t.uuid('paymentGatewayId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.enum('provider', ['stripe', 'square', 'paypal', 'manual', 'other']).notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isTestMode').notNullable().defaultTo(false);
    t.text('apiKey');
    t.text('apiSecret');
    t.text('publicKey');
    t.text('webhookSecret');
    t.text('apiEndpoint');
    t.enum('supportedPaymentMethods', ['creditCard', 'debitCard', 'giftCard', 'storeCredit', 'other']).notNullable();

    t.index('merchantId');
    t.index('provider');
    t.index('isActive');

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentGateway');
};
