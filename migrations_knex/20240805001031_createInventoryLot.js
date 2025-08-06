/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_lot', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('product_variant').onDelete('CASCADE');
    t.uuid('warehouseId').notNullable().references('id').inTable('warehouse').onDelete('CASCADE');
    t.uuid('binId').references('id').inTable('warehouse_bin');
    t.string('lotNumber', 100).notNullable();
    t.specificType('serialNumbers', 'text[]');
    t.integer('quantity').notNullable().defaultTo(0);
    t.timestamp('expiryDate');
    t.timestamp('manufacturingDate');
    t.timestamp('receiptDate').notNullable().defaultTo(knex.fn.now());
    t.string('supplierLotNumber', 100);
    t.uuid('supplierId').references('id').inTable('supplier');
    t.uuid('purchaseOrderId').references('id').inTable('purchase_order');
    t.enu('status', ['available', 'reserved', 'allocated', 'quarantine', 'expired', 'consumed'], { useNative: true, enumName: 'inventory_lot_status' }).notNullable().defaultTo('available');
    t.decimal('cost', 15, 2);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('productId');
    t.index('variantId');
    t.index('warehouseId');
    t.index('binId');
    t.index('lotNumber');
    t.index('expiryDate');
    t.index('quantity');
    t.index('status');
    t.index('supplierId');
    t.index('purchaseOrderId');
    t.index('serialNumbers', null, 'gin');
    t.unique(['productId', 'variantId', 'warehouseId', 'lotNumber'], { nullsNotDistinct: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventory_lot')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_lot_status'));
};
