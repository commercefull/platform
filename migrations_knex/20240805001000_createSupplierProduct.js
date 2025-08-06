/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supplier_product', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('supplier_id').notNullable().references('id').inTable('supplier').onDelete('CASCADE');
    t.uuid('product_id').notNullable();
    t.uuid('variant_id');
    t.string('sku', 100).notNullable();
    t.string('supplier_sku', 100);
    t.string('supplier_product_name', 255);
    t.enu('status', ['active', 'inactive', 'discontinued', 'pending'], { useNative: true, enumName: 'supplier_product_status_type' }).notNullable().defaultTo('active');
    t.boolean('is_preferred').notNullable().defaultTo(false);
    t.decimal('unit_cost', 10, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.integer('minimum_order_quantity').defaultTo(1);
    t.integer('lead_time');
    t.jsonb('packaging_info');
    t.jsonb('dimensions');
    t.decimal('weight', 10, 2);
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('last_ordered_at');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('supplier_id');
    t.index('product_id');
    t.index('variant_id');
    t.index('sku');
    t.index('supplier_sku');
    t.index('status');
    t.index('is_preferred');
    t.index('unit_cost');
    t.index('lead_time');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_supplier_product_unique ON supplier_product (product_id, variant_id, supplier_id) NULLS NOT DISTINCT');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_supplier_product_preferred ON supplier_product (product_id, variant_id, is_preferred) WHERE is_preferred = true NULLS NOT DISTINCT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('supplier_product')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS supplier_product_status_type'));
};
