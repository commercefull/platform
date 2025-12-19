/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('apiKey', t => {
    t.uuid('apiKeyId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('merchantId');
    t.string('name', 255).notNullable();
    t.string('keyHash', 255).notNullable();
    t.string('keyPrefix', 20).notNullable();
    t.jsonb('permissions').notNullable().defaultTo('[]');
    t.integer('rateLimit').notNullable().defaultTo(1000);
    t.timestamp('expiresAt', { useTz: true });
    t.timestamp('lastUsedAt', { useTz: true });
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('keyPrefix');
    t.index('merchantId');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('apiKey');
};
