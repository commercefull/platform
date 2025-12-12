/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('purchaseOrder', t => {
    t.uuid('purchaseOrderId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('poNumber', 50).notNullable().unique();
    t.uuid('supplierId').notNullable().references('supplierId').inTable('supplier');
    t.uuid('distributionWarehouseId').notNullable().references('distributionWarehouseId').inTable('distributionWarehouse');
    t.enum('status', ['draft', 'pending', 'approved', 'sent', 'confirmed', 'partial', 'completed', 'cancelled']).notNullable().defaultTo('draft');
    t.enum('orderType', ['standard', 'restock', 'backOrder', 'special', 'emergency']).notNullable().defaultTo('standard');
    t.enum('priority', ['low', 'normal', 'high', 'urgent']).notNullable().defaultTo('normal');
    t.timestamp('orderDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expectedDeliveryDate');
    t.timestamp('deliveryDate');
    t.string('shippingMethod', 50);
    t.string('trackingNumber', 100);
    t.string('carrierName', 100);
    t.string('paymentTerms', 100);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.decimal('subtotal', 15, 2).notNullable().defaultTo(0);
    t.decimal('tax', 15, 2).notNullable().defaultTo(0);
    t.decimal('shipping', 15, 2).notNullable().defaultTo(0);
    t.decimal('discount', 15, 2).notNullable().defaultTo(0);
    t.decimal('total', 15, 2).notNullable().defaultTo(0);
    t.text('notes');
    t.text('supplierNotes');
    t.jsonb('attachments');
    
    t.timestamp('approvedAt');
    t.timestamp('sentAt');
    t.timestamp('confirmedAt');
    t.timestamp('completedAt');
    t.timestamp('cancelledAt');
    t.index('poNumber');
    t.index('supplierId');
    t.index('distributionWarehouseId');
    t.index('status');
    t.index('orderType');
    t.index('priority');
    t.index('orderDate');
    t.index('expectedDeliveryDate');
    t.index('deliveryDate');
    t.index('total');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('purchaseOrder');
};
