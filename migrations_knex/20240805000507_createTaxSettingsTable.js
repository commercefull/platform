exports.up = function(knex) {
  return knex.schema.createTable('tax_settings', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('merchant_id').notNullable().references('id').inTable('merchant').unique();
    t.enu('calculation_method', null, { useNative: true, existingType: true, enumName: 'tax_calculation_method' }).notNullable().defaultTo('unit_based');
    t.boolean('prices_include_tax').notNullable().defaultTo(false);
    t.boolean('display_prices_with_tax').notNullable().defaultTo(false);
    t.enu('tax_based_on', null, { useNative: true, existingType: true, enumName: 'tax_based_on_type' }).notNullable().defaultTo('shipping_address');
    t.uuid('shipping_tax_class').references('id').inTable('tax_category');
    t.enu('display_tax_totals', null, { useNative: true, existingType: true, enumName: 'tax_display_totals_type' }).notNullable().defaultTo('itemized');
    t.boolean('apply_tax_to_shipping').notNullable().defaultTo(true);
    t.boolean('apply_discount_before_tax').notNullable().defaultTo(true);
    t.boolean('round_tax_at_subtotal').notNullable().defaultTo(false);
    t.integer('tax_decimal_places').notNullable().defaultTo(2);
    t.uuid('default_tax_category').references('id').inTable('tax_category');
    t.uuid('default_tax_zone').references('id').inTable('tax_zone');
    t.enu('tax_provider', null, { useNative: true, existingType: true, enumName: 'tax_provider_type' }).defaultTo('internal');
    t.jsonb('tax_provider_settings');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('merchant_id');
    t.index('calculation_method');
    t.index('tax_based_on');
    t.index('shipping_tax_class');
    t.index('default_tax_category');
    t.index('default_tax_zone');
    t.index('tax_provider');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_settings');
};
