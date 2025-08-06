exports.up = function(knex) {
  return knex.schema.createTable('tax_calculation', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('merchant_id').notNullable().references('id').inTable('merchant').onDelete('CASCADE');
    t.uuid('order_id').references('id').inTable('order');
    t.uuid('invoice_id');
    t.uuid('basket_id').references('id').inTable('basket');
    t.uuid('customer_id').references('id').inTable('customer');
    t.enu('calculation_method', null, { useNative: true, existingType: true, enumName: 'tax_calculation_method' }).notNullable();
    t.enu('status', null, { useNative: true, existingType: true, enumName: 'tax_calculation_status' }).notNullable().defaultTo('pending');
    t.enu('source_type', null, { useNative: true, existingType: true, enumName: 'tax_transaction_source' }).notNullable();
    t.uuid('source_id');
    t.jsonb('tax_address');
    t.decimal('taxable_amount', 15, 2).notNullable().defaultTo(0);
    t.decimal('tax_exempt_amount', 15, 2).notNullable().defaultTo(0);
    t.decimal('tax_amount', 15, 2).notNullable().defaultTo(0);
    t.decimal('total_amount', 15, 2).notNullable().defaultTo(0);
    t.string('currency_code', 3).notNullable().defaultTo('USD');
    t.decimal('exchange_rate', 15, 6).notNullable().defaultTo(1.0);
    t.jsonb('tax_provider_response');
    t.string('tax_provider_reference', 255);
    t.text('error_message');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('merchant_id');
    t.index('order_id');
    t.index('invoice_id');
    t.index('basket_id');
    t.index('customer_id');
    t.index('status');
    t.index('source_type');
    t.index('source_id');
    t.index('tax_provider_reference');
    t.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_calculation');
};
