/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('low_stock_notification', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('product_variant').onDelete('CASCADE');
    t.uuid('warehouseId').notNullable().references('id').inTable('warehouse').onDelete('CASCADE');
    t.integer('threshold').notNullable();
    t.integer('currentQuantity').notNullable();
    t.enu('status', ['new', 'acknowledged', 'resolved', 'ignored'], { useNative: true, enumName: 'low_stock_notification_status' }).notNullable().defaultTo('new');
    t.specificType('notifiedUsers', 'text[]');
    t.timestamp('resolvedAt');
    t.uuid('resolvedBy');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('productId');
    t.index('variantId');
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
  return knex.schema.dropTable('low_stock_notification')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS low_stock_notification_status'));
};
