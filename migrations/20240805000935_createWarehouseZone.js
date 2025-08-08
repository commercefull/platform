/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('warehouseZone', t => {
    t.uuid('warehouseZoneId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('warehouseId').notNullable().references('warehouseId').inTable('warehouse').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enu('zoneType', ['storage', 'picking', 'packing', 'shipping', 'receiving', 'returns', 'quarantine', 'special'], { useNative: true, enumName: 'warehouse_zone_type' }).notNullable();
    t.jsonb('capabilities');
    t.integer('priority').defaultTo(0);
    t.decimal('capacity', 10, 2);
    t.string('capacityUnit', 10);
    t.decimal('temperature', 5, 2);
    t.decimal('humidity', 5, 2);
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('warehouseId');
    t.index('code');
    t.index('isActive');
    t.index('zoneType');
    t.index('priority');
    t.unique(['warehouseId', 'code']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('warehouseZone');
};
