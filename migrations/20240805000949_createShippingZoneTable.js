/**
 * Shipping Zone Migration
 * Creates the shippingZone table for geographic shipping zone management
 */
exports.up = async function (knex) {
  return knex.schema.createTable('shippingZone', t => {
    t.uuid('shippingZoneId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.enum('locationType', ['country', 'state', 'zipcode', 'region', 'continent']).notNullable().defaultTo('country');
    t.jsonb('locations').notNullable();
    t.jsonb('excludedLocations');
    
    t.uuid('createdBy');
    t.index('name');
    t.index('isActive');
    t.index('priority');
    t.index('locationType');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable('shippingZone');
};
