/**
 * Distribution Warehouse Bin Migration
 * Creates the distributionWarehouseBin table for storage bin management
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionWarehouseBin', t => {
    t.uuid('distributionWarehouseBinId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('distributionWarehouseId')
      .notNullable()
      .references('distributionWarehouseId')
      .inTable('distributionWarehouse')
      .onDelete('CASCADE');
    t.uuid('distributionWarehouseZoneId')
      .references('distributionWarehouseZoneId')
      .inTable('distributionWarehouseZone')
      .onDelete('SET NULL');
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

    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('distributionWarehouseId');
    t.index('distributionWarehouseZoneId');
    t.index('locationCode');
    t.index('isActive');
    t.index('binType');
    t.index('isPickable');
    t.index('isReceivable');
    t.index('priority');
    t.unique(['distributionWarehouseId', 'locationCode']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('distributionWarehouseBin');
};
