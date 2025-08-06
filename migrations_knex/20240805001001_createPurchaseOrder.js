/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('purchase_order', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('poNumber', 50).notNullable().unique();
    t.uuid('supplierId').notNullable().references('id').inTable('supplier');
    t.uuid('warehouseId').notNullable().references('id').inTable('warehouse');
    t.enu('status', ['draft', 'pending', 'approved', 'sent', 'confirmed', 'partial', 'completed', 'cancelled'], { useNative: true, enumName: 'po_status_type' }).notNullable().defaultTo('draft');
    t.enu('orderType', ['standard', 'restock', 'backorder', 'special', 'emergency'], { useNative: true, enumName: 'po_order_type' }).notNullable().defaultTo('standard');
    t.enu('priority', ['low', 'normal', 'high', 'urgent'], { useNative: true, enumName: 'po_priority_type' }).notNullable().defaultTo('normal');
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
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('updatedBy');
    t.timestamp('approvedAt');
    t.uuid('approvedBy');
    t.timestamp('sentAt');
    t.timestamp('confirmedAt');
    t.timestamp('completedAt');
    t.index('poNumber');
    t.index('supplierId');
    t.index('warehouseId');
    t.index('status');
    t.index('orderType');
    t.index('priority');
    t.index('orderDate');
    t.index('expectedDeliveryDate');
    t.index('deliveryDate');
    t.index('total');
    t.index('createdAt');
  }).then(() => {
    return knex.raw('ALTER TABLE purchase_order ADD CONSTRAINT chk_total CHECK (total = subtotal + tax + shipping - discount)');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('purchase_order')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS po_status_type'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS po_order_type'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS po_priority_type'));
};
