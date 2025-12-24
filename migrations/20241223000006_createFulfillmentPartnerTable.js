/**
 * Migration: Create Fulfillment Partner Table (3PL partners)
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('fulfillmentPartner');
  if (hasTable) return;

  await knex.schema.createTable('fulfillmentPartner', table => {
    table.uuid('fulfillmentPartnerId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.string('code').notNullable().unique();
    table.string('type'); // 3pl, dropship, carrier
    table.jsonb('apiConfig');
    table.jsonb('address');
    table.string('contactEmail');
    table.string('contactPhone');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('fulfillmentPartner');
};
