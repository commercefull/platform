exports.up = function(knex) {
  return knex.schema.createTable('tax_calculation_line', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('calculation_id').notNullable().references('id').inTable('tax_calculation').onDelete('CASCADE');
    t.uuid('line_item_id');
    t.string('line_item_type', 50).notNullable();
    t.uuid('product_id').references('id').inTable('product');
    t.uuid('variant_id').references('id').inTable('product_variant');
    t.string('sku', 255);
    t.string('name', 255).notNullable();
    t.integer('quantity').notNullable().defaultTo(1);
    t.decimal('unit_price', 15, 2).notNullable();
    t.decimal('line_total', 15, 2).notNullable();
    t.decimal('discount_amount', 15, 2).notNullable().defaultTo(0);
    t.decimal('taxable_amount', 15, 2).notNullable();
    t.decimal('tax_exempt_amount', 15, 2).notNullable().defaultTo(0);
    t.uuid('tax_category_id').references('id').inTable('tax_category');
    t.string('tax_category_code', 50);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('calculation_id');
    t.index('line_item_id');
    t.index('line_item_type');
    t.index('product_id');
    t.index('variant_id');
    t.index('tax_category_id');
    t.index('sku');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_calculation_line');
};
