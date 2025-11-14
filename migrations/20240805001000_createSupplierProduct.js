/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supplierProduct', t => {
    t.uuid('supplierProductId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('supplierId').notNullable().references('supplierId').inTable('supplier').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.string('sku', 100).notNullable();
    t.string('supplierSku', 100);
    t.string('supplierProductName', 255);
    t.enum('status', ['active', 'inactive', 'discontinued', 'pending']).notNullable().defaultTo('active');
    t.boolean('isPreferred').notNullable().defaultTo(false);
    t.decimal('unitCost', 10, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.integer('minimumOrderQuantity').defaultTo(1);
    t.integer('leadTime');
    t.jsonb('packagingInfo');
    t.jsonb('dimensions');
    t.decimal('weight', 10, 2);
    t.timestamp('lastOrderedAt');
    t.text('notes');

    t.index('supplierId');
    t.index('productId');
    t.index('productVariantId');
    t.index('sku');
    t.index('supplierSku');
    t.index('status');
    t.index('isPreferred');
    t.index('unitCost');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('supplierProduct');
};
