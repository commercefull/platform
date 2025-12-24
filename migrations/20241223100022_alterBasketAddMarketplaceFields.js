/**
 * Migration: Add Marketplace/B2B Fields to Basket Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasStoreId = await knex.schema.hasColumn('basket', 'storeId');
  if (!hasStoreId) {
    await knex.schema.alterTable('basket', table => {
      table.uuid('storeId').nullable();
    });
  }

  const hasChannelId = await knex.schema.hasColumn('basket', 'channelId');
  if (!hasChannelId) {
    await knex.schema.alterTable('basket', table => {
      table.uuid('channelId').nullable();
    });
  }

  const hasAccountId = await knex.schema.hasColumn('basket', 'accountId');
  if (!hasAccountId) {
    await knex.schema.alterTable('basket', table => {
      table.uuid('accountId').nullable(); // B2B company
    });
  }
};

exports.down = async function (knex) {
  const hasStoreId = await knex.schema.hasColumn('basket', 'storeId');
  if (!hasStoreId) return;

  await knex.schema.alterTable('basket', table => {
    table.dropColumn('storeId');
    table.dropColumn('channelId');
    table.dropColumn('accountId');
  });
};
