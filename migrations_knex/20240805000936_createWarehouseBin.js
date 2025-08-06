/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('warehouseBin', t => {
    t.uuid('warehouseBinId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('warehouseId').notNullable().references('warehouseId').inTable('warehouse').onDelete('CASCADE');
    t.uuid('zoneId').references('warehouseZoneId').inTable('warehouseZone').onDelete('SET NULL');
    t.string('locationCode', 50).notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enu('binType', ['storage', 'picking', 'receiving', 'packing', 'shipping', 'returns', 'damaged', 'inspection']).notNullable();
    t.decimal('height', 10, 2);
    t.decimal('width', 10, 2);
    t.decimal('depth', 10, 2);
    t.decimal('maxVolume', 10, 2);
    t.decimal('maxWeight', 10, 2);
    t.boolean('isPickable').notNullable().defaultTo(true);
    t.boolean('isReceivable').notNullable().defaultTo(true);
    t.boolean('isMixed').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('warehouseId');
    t.index('zoneId');
    t.index('locationCode');
    t.index('isActive');
    t.index('binType');
    t.index('isPickable');
    t.index('isReceivable');
    t.index('priority');
    t.unique(['warehouseId', 'locationCode']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('warehouseBin');
}
