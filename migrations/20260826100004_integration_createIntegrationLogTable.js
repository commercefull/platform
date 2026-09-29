/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('integrationLog');
  if (hasTable) return;

  await knex.schema.createTable('integrationLog', t => {
    t.uuid('logId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('integrationId').notNullable().references('integration.integrationId').onDelete('CASCADE');
    t.uuid('subscriptionId').nullable();
    t.string('eventType').notNullable();
    t.string('targetAction').notNullable();
    t.string('status').notNullable().defaultTo('pending');
    t.jsonb('requestPayload').nullable();
    t.integer('responseStatus').nullable();
    t.text('responseBody').nullable();
    t.text('errorMessage').nullable();
    t.integer('durationMs').nullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index(['integrationId']);
    t.index(['subscriptionId']);
    t.index(['status']);
    t.index(['createdAt']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('integrationLog');
};
