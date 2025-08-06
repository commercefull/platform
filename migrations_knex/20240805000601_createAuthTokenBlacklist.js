/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('authTokenBlacklist', t => {
    t.uuid('authTokenBlacklistId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.text('token').notNullable();
    t.string('userType', 20).notNullable();
    t.uuid('userId').notNullable();
    t.timestamp('expiresAt').notNullable();
    t.timestamp('invalidatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('reason', 50);
    t.index('token');
    t.index('userId');
    t.index('expiresAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('authTokenBlacklist');
};
