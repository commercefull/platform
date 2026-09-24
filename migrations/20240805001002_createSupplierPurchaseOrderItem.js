/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supplierPurchaseOrderItem', t => {
    t.uuid('supplierPurchaseOrderItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('supplierPurchaseOrderId')
      .notNullable()
      .references('supplierPurchaseOrderId')
      .inTable('supplierPurchaseOrder')
      .onDelete('CASCADE');
    t.uuid('supplierProductId').references('supplierProductId').inTable('supplierProduct');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.string('sku', 100).notNullable();
    t.string('supplierSku', 100);
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('quantity').notNullable();
    t.integer('receivedQuantity').notNullable().defaultTo(0);
    t.bigInteger('unitCostCents').notNullable();
    t.bigInteger('taxCents').notNullable().defaultTo(0);
    t.bigInteger('discountCents').notNullable().defaultTo(0);
    t.bigInteger('totalCents').notNullable();
    t.enum('status', ['pending', 'partial', 'received', 'cancelled', 'backOrdered']).notNullable().defaultTo('pending');
    t.timestamp('expectedDeliveryDate');
    t.timestamp('receivedAt');
    t.text('notes');

    t.index('supplierPurchaseOrderId');
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
  return knex.schema.dropTable('supplierPurchaseOrderItem');
};
