/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('session', t => {
    t.string('sid').notNullable().primary();
    t.jsonb('sess').notNullable();
    t.timestamp('expire').notNullable().defaultTo(knex.fn.now());
    t.index('expire');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('session');
};
