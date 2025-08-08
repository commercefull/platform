/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('lowStockNotification', t => {
    t.uuid('lowStockNotificationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('warehouseId').notNullable().references('warehouseId').inTable('warehouse').onDelete('CASCADE');
    t.integer('threshold').notNullable();
    t.integer('currentQuantity').notNullable();
    t.enum('status', ['new', 'acknowledged', 'resolved', 'ignored']).notNullable().defaultTo('new');
    t.specificType('notifiedUsers', 'text[]');
    t.timestamp('resolvedAt');
    t.uuid('resolvedBy');
    t.text('notes');

    t.uuid('createdBy');
    t.index('productId');
    t.index('productVariantId');
    t.index('warehouseId');
    t.index('threshold');
    t.index('currentQuantity');
    t.index('status');
    t.index('createdAt');
    t.index('resolvedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('lowStockNotification');
};
