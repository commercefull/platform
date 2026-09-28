/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('integration');
  if (hasTable) return;

  await knex.schema.createTable('integration', t => {
    t.uuid('integrationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable();
    t.string('name').notNullable();
    t.string('provider').notNullable();
    t.string('status').notNullable().defaultTo('pending');
    t.text('description').nullable();
    t.string('webhookUrl').nullable();
    t.jsonb('config').notNullable().defaultTo('{}');
    t.timestamp('lastSyncAt').nullable();
    t.text('lastError').nullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index(['organizationId']);
    t.index(['provider']);
    t.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('integration');
};
