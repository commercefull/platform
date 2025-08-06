/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('purchase_order_item', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('purchase_order_id').notNullable().references('id').inTable('purchase_order').onDelete('CASCADE');
    t.uuid('supplier_product_id').references('id').inTable('supplier_product');
    t.uuid('product_id').notNullable();
    t.uuid('variant_id');
    t.string('sku', 100).notNullable();
    t.string('supplier_sku', 100);
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('quantity').notNullable();
    t.integer('received_quantity').notNullable().defaultTo(0);
    t.decimal('unit_cost', 10, 2).notNullable();
    t.decimal('tax', 10, 2).notNullable().defaultTo(0);
    t.decimal('discount', 10, 2).notNullable().defaultTo(0);
    t.decimal('total', 15, 2).notNullable();
    t.enu('status', ['pending', 'partial', 'received', 'cancelled', 'backordered'], { useNative: true, enumName: 'po_item_status_type' }).notNullable().defaultTo('pending');
    t.timestamp('expected_delivery_date');
    t.timestamp('received_at');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('purchase_order_id');
    t.index('supplier_product_id');
    t.index('product_id');
    t.index('variant_id');
    t.index('sku');
    t.index('supplier_sku');
    t.index('status');
    t.index('quantity');
    t.index('received_quantity');
    t.index('expected_delivery_date');
    t.index('received_at');
  }).then(() => {
    return knex.raw('ALTER TABLE purchase_order_item ADD CONSTRAINT chk_item_total CHECK (total = (quantity * unit_cost) + tax - discount)');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('purchase_order_item')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS po_item_status_type'));
};
