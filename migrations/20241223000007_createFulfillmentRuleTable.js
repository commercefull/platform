/**
 * Migration: Create Fulfillment Rule Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('fulfillmentRule');
  if (hasTable) return;

  await knex.schema.createTable('fulfillmentRule', table => {
    table.uuid('fulfillmentRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.string('type').notNullable(); // routing, splitting, assignment
    table.jsonb('conditions').notNullable();
    table.jsonb('actions').notNullable();
    table.integer('priority').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['type', 'isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('fulfillmentRule');
};
