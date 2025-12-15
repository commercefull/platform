/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supplierReceivingItem', t => {
    t.uuid('supplierReceivingItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('supplierReceivingRecordId').notNullable().references('supplierReceivingRecordId').inTable('supplierReceivingRecord').onDelete('CASCADE');
    t.uuid('supplierPurchaseOrderItemId').references('supplierPurchaseOrderItemId').inTable('supplierPurchaseOrderItem');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.string('sku', 100).notNullable();
    t.string('name', 255).notNullable();
    t.integer('expectedQuantity');
    t.integer('receivedQuantity').notNullable();
    t.integer('rejectedQuantity').notNullable().defaultTo(0);
    t.uuid('distributionWarehouseBinId').references('distributionWarehouseBinId').inTable('distributionWarehouseBin');
    t.string('lotNumber', 100);
    t.specificType('serialNumbers', 'text[]');
    t.timestamp('expiryDate');
    t.enum('status', ['received', 'inspecting', 'accepted', 'rejected', 'partial']).notNullable().defaultTo('received');
    t.enum('acceptanceStatus', ['pending', 'accepted', 'rejected', 'partial']).defaultTo('pending');
    t.text('inspectionNotes');
    t.string('discrepancyReason', 255);
    
    t.timestamp('processedAt');
    t.uuid('processedBy');
    t.index('supplierReceivingRecordId');
    t.index('supplierPurchaseOrderItemId');
    t.index('productId');
    t.index('productVariantId');
    t.index('sku');
    t.index('distributionWarehouseBinId');
    t.index('lotNumber');
    t.index('expiryDate');
    t.index('status');
    t.index('acceptanceStatus');
    t.index('createdAt');
    t.index('serialNumbers', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('supplierReceivingItem');
};
