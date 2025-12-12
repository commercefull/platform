/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryLot', t => {
    t.uuid('inventoryLotId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('distributionWarehouseId').notNullable().references('distributionWarehouseId').inTable('distributionWarehouse').onDelete('CASCADE');
    t.uuid('distributionWarehouseBinId').references('distributionWarehouseBinId').inTable('distributionWarehouseBin');
    t.string('lotNumber', 100).notNullable();
    t.specificType('serialNumbers', 'text[]');
    t.integer('quantity').notNullable().defaultTo(0);
    t.timestamp('expiryDate');
    t.timestamp('manufacturingDate');
    t.timestamp('receiptDate').notNullable().defaultTo(knex.fn.now());
    t.string('supplierLotNumber', 100);
    t.uuid('supplierId').references('supplierId').inTable('supplier');
    t.uuid('purchaseOrderId').references('purchaseOrderId').inTable('purchaseOrder');
    t.enum('status', ['available', 'reserved', 'allocated', 'quarantine', 'expired', 'consumed']).notNullable().defaultTo('available');
    t.decimal('cost', 15, 2);
    
    t.uuid('createdBy');
    t.index('productId');
    t.index('productVariantId');
    t.index('distributionWarehouseId');
    t.index('distributionWarehouseBinId');
    t.index('lotNumber');
    t.index('expiryDate');
    t.index('quantity');
    t.index('status');
    t.index('supplierId');
    t.index('purchaseOrderId');
    t.index('serialNumbers', null, 'gin');
    t.unique(['productId', 'productVariantId', 'distributionWarehouseId', 'lotNumber'], { nullsNotDistinct: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryLot');
};
