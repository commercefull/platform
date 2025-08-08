/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('shippingZone', t => {
    t.uuid('shippingZoneId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.enum('locationType', ['country', 'state', 'zipcode', 'region', 'continent'], { useNative: true, enumName: 'shipping_zone_location_type' }).notNullable().defaultTo('country');
    t.jsonb('locations').notNullable();
    t.jsonb('excludedLocations');
    
    t.uuid('createdBy');
    t.index('name');
    t.index('isActive');
    t.index('priority');
    t.index('locationType');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('shippingZone');
};
