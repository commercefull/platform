exports.up = function(knex) {
  return knex.schema.createTable('product_tax_exemption', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('product_id').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variant_id').references('id').inTable('product_variant').onDelete('CASCADE');
    t.uuid('tax_zone_id').notNullable().references('id').inTable('tax_zone').onDelete('CASCADE');
    t.uuid('tax_category_id').references('id').inTable('tax_category').onDelete('SET NULL');
    t.boolean('is_exempt').notNullable().defaultTo(true);
    t.text('exemption_reason');
    t.timestamp('start_date').notNullable().defaultTo(knex.fn.now());
    t.timestamp('end_date');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('product_id');
    t.index('variant_id');
    t.index('tax_zone_id');
    t.index('tax_category_id');
    t.index('is_exempt');
    t.index('start_date');
    t.index('end_date');
    t.index('is_active');
    t.unique(['product_id', 'variant_id', 'tax_zone_id'], 'product_tax_exemption_variant_unique').whereNotNull('variant_id');
    t.unique(['product_id', 'tax_zone_id'], 'product_tax_exemption_unique').whereNull('variant_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_tax_exemption');
};
