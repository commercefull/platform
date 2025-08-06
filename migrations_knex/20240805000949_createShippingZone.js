/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('shipping_zone', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.enu('location_type', ['country', 'state', 'zipcode', 'region', 'continent'], { useNative: true, enumName: 'shipping_zone_location_type' }).notNullable().defaultTo('country');
    t.jsonb('locations').notNullable();
    t.jsonb('excluded_locations');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.index('name');
    t.index('is_active');
    t.index('priority');
    t.index('location_type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('shipping_zone')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS shipping_zone_location_type'));
};
