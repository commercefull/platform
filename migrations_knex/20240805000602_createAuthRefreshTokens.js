/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('authRefreshTokens', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.text('token').notNullable().unique();
    t.string('userType', 20).notNullable();
    t.uuid('userId').notNullable();
    t.boolean('isRevoked').notNullable().defaultTo(false);
    t.timestamp('expiresAt').notNullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('lastUsedAt');
    t.text('userAgent');
    t.string('ipAddress', 50);
    t.index('userId');
    t.index(['userId', 'userType']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('authRefreshTokens');
};
