/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('webhookDelivery', t => {
    t.uuid('webhookDeliveryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('webhookEndpointId').notNullable().references('webhookEndpointId').inTable('webhookEndpoint').onDelete('CASCADE');
    t.string('eventType', 100).notNullable();
    t.string('eventId', 255).notNullable();
    t.jsonb('payload').notNullable();
    t.enu('status', ['pending', 'success', 'failed', 'retrying']).notNullable().defaultTo('pending');
    t.integer('attempts').notNullable().defaultTo(0);
    t.timestamp('lastAttemptAt', { useTz: true });
    t.timestamp('nextRetryAt', { useTz: true });
    t.integer('responseStatus');
    t.text('responseBody');
    t.text('errorMessage');
    t.integer('duration');
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('webhookEndpointId');
    t.index('status');
    t.index('nextRetryAt');
    t.index(['createdAt']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('webhookDelivery');
};
