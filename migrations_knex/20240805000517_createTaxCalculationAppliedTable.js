exports.up = function(knex) {
  return knex.schema.createTable('tax_calculation_applied', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('calculation_id').notNullable().references('id').inTable('tax_calculation').onDelete('CASCADE');
    t.uuid('calculation_line_id').references('id').inTable('tax_calculation_line').onDelete('CASCADE');
    t.uuid('tax_rate_id').references('id').inTable('tax_rate');
    t.string('tax_rate_name', 100).notNullable();
    t.uuid('tax_zone_id').references('id').inTable('tax_zone');
    t.string('tax_zone_name', 100);
    t.uuid('tax_category_id').references('id').inTable('tax_category');
    t.string('tax_category_name', 100);
    t.enu('jurisdiction_level', ['country', 'state', 'county', 'city', 'district', 'special']).notNullable();
    t.string('jurisdiction_name', 100).notNullable();
    t.decimal('rate', 10, 6).notNullable();
    t.boolean('is_compound').notNullable().defaultTo(false);
    t.decimal('taxable_amount', 15, 2).notNullable();
    t.decimal('tax_amount', 15, 2).notNullable();
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('calculation_id');
    t.index('calculation_line_id');
    t.index('tax_rate_id');
    t.index('tax_zone_id');
    t.index('tax_category_id');
    t.index('jurisdiction_level');
    t.index('jurisdiction_name');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_calculation_applied');
};
