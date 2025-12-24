/**
 * Migration: Add Marketplace/B2B Fields to Order Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasStoreId = await knex.schema.hasColumn('order', 'storeId');
  if (!hasStoreId) {
    await knex.schema.alterTable('order', table => {
      table.uuid('storeId').nullable();
    });
  }

  const hasChannelId = await knex.schema.hasColumn('order', 'channelId');
  if (!hasChannelId) {
    await knex.schema.alterTable('order', table => {
      table.uuid('channelId').nullable();
    });
  }

  const hasAccountId = await knex.schema.hasColumn('order', 'accountId');
  if (!hasAccountId) {
    await knex.schema.alterTable('order', table => {
      table.uuid('accountId').nullable(); // B2B company
    });
  }

  const hasMerchantId = await knex.schema.hasColumn('order', 'merchantId');
  if (!hasMerchantId) {
    await knex.schema.alterTable('order', table => {
      table.uuid('merchantId').nullable(); // Primary merchant (marketplace)
    });
  }

  const hasPurchaseOrderNumber = await knex.schema.hasColumn('order', 'purchaseOrderNumber');
  if (!hasPurchaseOrderNumber) {
    await knex.schema.alterTable('order', table => {
      table.string('purchaseOrderNumber', 100).nullable(); // B2B PO reference
    });
  }

  const hasParentOrderId = await knex.schema.hasColumn('order', 'parentOrderId');
  if (!hasParentOrderId) {
    await knex.schema.alterTable('order', table => {
      table.string('parentOrderId', 50).nullable(); // For split orders
    });
  }
};

exports.down = async function (knex) {
  const hasStoreId = await knex.schema.hasColumn('order', 'storeId');
  if (!hasStoreId) return;

  await knex.schema.alterTable('order', table => {
    table.dropColumn('storeId');
    table.dropColumn('channelId');
    table.dropColumn('accountId');
    table.dropColumn('merchantId');
    table.dropColumn('purchaseOrderNumber');
    table.dropColumn('parentOrderId');
  });
};
