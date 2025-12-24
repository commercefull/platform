/**
 * Migration: Create Fulfillment Network Rule Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('fulfillmentNetworkRule');
  if (hasTable) return;

  await knex.schema.createTable('fulfillmentNetworkRule', table => {
    table.uuid('fulfillmentNetworkRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('organizationId').notNullable();
    table.uuid('storeId').nullable();
    table.uuid('channelId').nullable();
    table.string('name', 255).notNullable();
    table.integer('priority').defaultTo(0);
    table.string('ruleType', 30).notNullable(); // 'location_preference', 'ship_from_store', 'bopis', 'seller_only'
    table.jsonb('conditions').defaultTo('{}');
    table.jsonb('actions').defaultTo('{}');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('organizationId');
    table.index('storeId');
    table.index('channelId');
    table.index('ruleType');
    table.index('priority');
    table.index('isActive');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('fulfillmentNetworkRule');
};
