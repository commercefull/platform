/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('stockReservation', t => {
    t.uuid('stockReservationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('distributionWarehouseId')
      .notNullable()
      .references('distributionWarehouseId')
      .inTable('distributionWarehouse')
      .onDelete('CASCADE');
    t.integer('quantity').notNullable();
    t.enum('reservationType', ['cart', 'order', 'pending', 'custom']).notNullable();
    t.uuid('referenceId');
    t.string('referenceType', 50);
    t.timestamp('expiresAt');

    t.uuid('createdBy');
    t.index('productId');
    t.index('productVariantId');
    t.index('distributionWarehouseId');
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
  return knex.schema.dropTable('stockReservation');
};
