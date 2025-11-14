exports.up = function(knex) {
  return knex.schema.createTable('taxCalculation', t => {
    t.uuid('taxCalculationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order');
    t.uuid('invoiceId');
    t.uuid('basketId').references('basketId').inTable('basket');
    t.uuid('customerId').references('customerId').inTable('customer');
    t.enum('calculationMethod', ['unitBased', 'itemBased']).notNullable().defaultTo('unitBased');
    t.enum('status', ['pending', 'completed', 'failed']).notNullable().defaultTo('pending');
    t.enum('sourceType', ['order', 'invoice', 'basket']).notNullable();
    t.uuid('sourceId');
    t.jsonb('taxAddress');
    t.decimal('taxableAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('taxExemptAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('taxAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('totalAmount', 15, 2).notNullable().defaultTo(0);
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.decimal('exchangeRate', 15, 6).notNullable().defaultTo(1.0);
    t.jsonb('taxProviderResponse');
    t.string('taxProviderReference', 255);
    t.text('errorMessage');

    t.index('merchantId');
    t.index('orderId');
    t.index('invoiceId');
    t.index('basketId');
    t.index('customerId');
    t.index('status');
    t.index('sourceType');
    t.index('sourceId');
    t.index('taxProviderReference');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxCalculation');
};
