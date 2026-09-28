/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('integrationSubscription');
  if (hasTable) return;

  await knex.schema.createTable('integrationSubscription', t => {
    t.uuid('subscriptionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('integrationId').notNullable().references('integration.integrationId').onDelete('CASCADE');
    t.string('eventType').notNullable();
    t.string('targetAction').notNullable();
    t.text('description').nullable();
    t.jsonb('payloadMapping').notNullable().defaultTo('{}');
    t.jsonb('headers').nullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index(['integrationId']);
    t.index(['eventType']);
    t.index(['isActive']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('integrationSubscription');
};
