/**
 * Migration: Create Price List Scope Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('priceListScope');
  if (hasTable) return;

  await knex.schema.createTable('priceListScope', table => {
    table.uuid('priceListScopeId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('priceListId').notNullable();
    table.string('storeId', 50).nullable();
    table.string('channelId', 50).nullable();
    table.string('accountId', 50).nullable();
    table.string('sellerId', 50).nullable();
    table.string('customerSegmentId', 50).nullable();
    table.integer('priority').defaultTo(0); // Higher = more specific
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index('priceListId');
    table.index('storeId');
    table.index('channelId');
    table.index('accountId');
    table.index('sellerId');
    table.index('priority');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('priceListScope');
};
