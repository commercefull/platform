/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('admin', t => {
    t.uuid('adminId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('email', 255).notNullable().unique();
    t.string('firstName', 255).notNullable();
    t.string('lastName', 255).notNullable();
    t.string('password', 255).notNullable();
    t.string('role', 50).notNullable().defaultTo('admin');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('lastLoginAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('admin');
};
