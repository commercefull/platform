/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('currency', t => {
    t.uuid('currencyId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('code', 3).notNullable().unique();
    t.string('name', 100).notNullable();
    t.string('symbol', 10).notNullable();
    t.integer('decimalPlaces').notNullable().defaultTo(2);
    t.string('decimalSeparator', 1).notNullable().defaultTo('.');
    t.string('thousandsSeparator', 1).notNullable().defaultTo(',');
    t.enum('symbolPosition', ['before', 'after']).notNullable().defaultTo('before');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.index('code');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('currency');
};
