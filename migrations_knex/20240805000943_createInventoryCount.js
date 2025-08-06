/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_count', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('warehouseId').notNullable().references('id').inTable('warehouse');
    t.string('referenceNumber', 50).unique();
    t.enu('countType', ['full', 'cycle', 'spot', 'blind', 'audit'], { useNative: true, enumName: 'inventory_count_type' }).notNullable();
    t.enu('status', ['pending', 'inProgress', 'completed', 'cancelled', 'reconciled'], { useNative: true, enumName: 'inventory_count_status_type' }).notNullable().defaultTo('pending');
    t.timestamp('scheduledDate');
    t.timestamp('startDate');
    t.timestamp('endDate');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('updatedBy');
    t.timestamp('completedAt');
    t.uuid('completedBy');
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
  return knex.schema.dropTable('inventory_count')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_count_type'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_count_status_type'));
};
