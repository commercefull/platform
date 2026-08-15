/**
 * Migration: Create Warehouse Zone Table
 * Zones are logical groupings within a warehouse (e.g., A, B, Cold Storage)
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('distributionWarehouseZone');
  if (hasTable) return;

  await knex.schema.createTable('distributionWarehouseZone', t => {
    t.uuid('distributionWarehouseZoneId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('distributionWarehouseId')
      .notNullable()
      .references('distributionWarehouseId')
      .inTable('distributionWarehouse')
      .onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable();
    t.text('description');
    t.enu('zoneType', ['storage', 'picking', 'receiving', 'packing', 'shipping', 'returns', 'cold_storage', 'hazardous', 'secure']).notNullable().defaultTo('storage');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('sortOrder').defaultTo(0);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('distributionWarehouseId');
    t.index('code');
    t.index('zoneType');
    t.index('isActive');
    t.unique(['distributionWarehouseId', 'code']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('distributionWarehouseZone');
};
