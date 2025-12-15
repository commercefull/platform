/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('distributionShippingZone', (table) => {
    table.uuid('distributionShippingZoneId').primary().defaultTo(knex.raw('uuidv7()'));
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();
    
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.boolean('isActive').defaultTo(true).notNullable();
    table.integer('priority').nullable();
    table.enum('locationType', ['country', 'region', 'postalCode', 'custom']).notNullable().defaultTo('country');
    table.jsonb('locations').notNullable().defaultTo('[]');
    table.jsonb('excludedLocations').nullable();
    table.uuid('createdBy').nullable();

    table.index('name');
    table.index('isActive');
    table.index('locationType');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('distributionShippingZone');
};
