/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('purchaseOrderItem', t => {
    t.uuid('purchaseOrderItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('purchaseOrderId').notNullable().references('purchaseOrderId').inTable('purchaseOrder').onDelete('CASCADE');
    t.uuid('supplierProductId').references('supplierProductId').inTable('supplierProduct');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.string('sku', 100).notNullable();
    t.string('supplierSku', 100);
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('quantity').notNullable();
    t.integer('receivedQuantity').notNullable().defaultTo(0);
    t.decimal('unitCost', 10, 2).notNullable();
    t.decimal('tax', 10, 2).notNullable().defaultTo(0);
    t.decimal('discount', 10, 2).notNullable().defaultTo(0);
    t.decimal('total', 15, 2).notNullable();
    t.enum('status', ['pending', 'partial', 'received', 'cancelled', 'backOrdered']).notNullable().defaultTo('pending');
    t.timestamp('expectedDeliveryDate');
    t.timestamp('receivedAt');
    t.text('notes');
    
    t.index('purchaseOrderId');
    t.index('supplierProductId');
    t.index('productId');
    t.index('productVariantId');
    t.index('sku');
    t.index('supplierSku');
    t.index('status');
    t.index('quantity');
    t.index('receivedQuantity');
    t.index('expectedDeliveryDate');
    t.index('receivedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('purchaseOrderItem');
};
