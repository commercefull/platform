/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('webhookEndpoint', t => {
    t.uuid('webhookEndpointId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('merchantId');
    t.string('name', 255).notNullable();
    t.text('url').notNullable();
    t.string('secret', 255).notNullable();
    t.jsonb('events').notNullable().defaultTo('[]');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.jsonb('headers');
    t.jsonb('retryPolicy').notNullable().defaultTo('{"maxRetries": 3, "retryDelayMs": 5000, "backoffMultiplier": 2}');
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('merchantId');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('webhookEndpoint');
};
