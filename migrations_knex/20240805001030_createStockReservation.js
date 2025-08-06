/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('stock_reservation', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('product_variant').onDelete('CASCADE');
    t.uuid('warehouseId').notNullable().references('id').inTable('warehouse').onDelete('CASCADE');
    t.integer('quantity').notNullable();
    t.enu('reservationType', ['cart', 'order', 'pending', 'custom'], { useNative: true, enumName: 'stock_reservation_type' }).notNullable();
    t.uuid('referenceId');
    t.string('referenceType', 50);
    t.timestamp('expiresAt');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('productId');
    t.index('variantId');
    t.index('warehouseId');
    t.index('quantity');
    t.index('reservationType');
    t.index('referenceId');
    t.index('referenceType');
    t.index('expiresAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('stock_reservation')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS stock_reservation_type'));
};
