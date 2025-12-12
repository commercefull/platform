/**
 * Distribution Warehouse Zone Migration
 * Creates the distributionWarehouseZone table for warehouse zone management
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionWarehouseZone', t => {
    t.uuid('distributionWarehouseZoneId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('distributionWarehouseId').notNullable().references('distributionWarehouseId').inTable('distributionWarehouse').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enum('zoneType', ['storage', 'picking', 'packing', 'shipping', 'receiving', 'returns', 'quarantine', 'special']).notNullable();
    t.jsonb('capabilities');
    t.integer('priority').defaultTo(0);
    t.decimal('capacity', 10, 2);
    t.string('capacityUnit', 10);
    t.decimal('temperature', 5, 2);
    t.decimal('humidity', 5, 2);
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('distributionWarehouseId');
    t.index('code');
    t.index('isActive');
    t.index('zoneType');
    t.index('priority');
    t.unique(['distributionWarehouseId', 'code']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('distributionWarehouseZone');
};
