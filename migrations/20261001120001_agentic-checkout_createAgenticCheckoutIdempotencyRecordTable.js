/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('agenticCheckoutIdempotencyRecord');
  if (hasTable) return;

  await knex.schema.createTable('agenticCheckoutIdempotencyRecord', t => {
    t.uuid('agenticCheckoutIdempotencyRecordId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('integrationId').notNullable().references('integrationId').inTable('integration').onDelete('CASCADE');
    t.string('key', 255).notNullable();
    t.string('requestHash', 64).notNullable();
    t.string('method', 10).notNullable();
    t.string('path', 255).notNullable();
    t.string('state', 20).notNullable().defaultTo('in_flight');
    t.integer('responseStatus').nullable();
    t.jsonb('responseBody').nullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiresAt').notNullable();

    t.unique(['integrationId', 'key']);
    t.index('expiresAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('agenticCheckoutIdempotencyRecord');
};
