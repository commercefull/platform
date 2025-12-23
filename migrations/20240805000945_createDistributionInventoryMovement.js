/**
 * Distribution Inventory Movement Migration
 * Creates the distributionInventoryMovement table for tracking inventory movements between locations
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionInventoryMovement', t => {
    t.uuid('distributionInventoryMovementId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('distributionWarehouseId')
      .notNullable()
      .references('distributionWarehouseId')
      .inTable('distributionWarehouse')
      .onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.uuid('fromLocationId').references('inventoryLocationId').inTable('inventoryLocation');
    t.uuid('toLocationId').references('inventoryLocationId').inTable('inventoryLocation');
    t.integer('quantity').notNullable();
    t.string('reason', 50);
    t.string('reference', 255);

    t.index('distributionWarehouseId');
    t.index('productId');
    t.index('productVariantId');
    t.index('fromLocationId');
    t.index('toLocationId');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('distributionInventoryMovement');
};
