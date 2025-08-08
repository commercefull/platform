/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionInventoryMovement', t => {
    t.uuid('distributionInventoryMovementId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('warehouseId').notNullable().references('warehouseId').inTable('warehouse').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');  
    t.uuid('fromLocationId').references('inventoryLocationId').inTable('inventoryLocation');
    t.uuid('toLocationId').references('inventoryLocationId').inTable('inventoryLocation');
    t.integer('quantity').notNullable();
    t.string('reason', 50);
    t.string('reference', 255);
    
    t.index('warehouseId');
    t.index('productId');
    t.index('productVariantId');
    t.index('fromLocationId');
    t.index('toLocationId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('distributionInventoryMovement');
};
