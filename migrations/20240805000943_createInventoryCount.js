/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryCount', t => {
    t.uuid('inventoryCountId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('warehouseId').notNullable().references('warehouseId').inTable('warehouse');
    t.string('referenceNumber', 50).unique();
    t.enum('countType', ['full', 'cycle', 'spot', 'blind', 'audit']).notNullable();
    t.enum('status', ['pending', 'inProgress', 'completed', 'cancelled', 'reconciled']).notNullable().defaultTo('pending');
    t.timestamp('scheduledDate');
    t.timestamp('startDate');
    t.timestamp('endDate');
    t.text('notes');
    
    t.index('warehouseId');
    t.index('referenceNumber');
    t.index('countType');
    t.index('status');
    t.index('scheduledDate');
    t.index('startDate');
    t.index('endDate');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryCount');
};
