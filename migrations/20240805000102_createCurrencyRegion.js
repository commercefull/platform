/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('currencyRegion', t => {
    t.uuid('currencyRegionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('code', 10).notNullable().unique();
    t.string('name', 100).notNullable();
    t.string('currencyCode', 3).notNullable().references('code').inTable('currency').onDelete('CASCADE');
    t.specificType('countries', 'text[]');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.index('code');
    t.index('currencyCode');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('currencyRegion');
};
