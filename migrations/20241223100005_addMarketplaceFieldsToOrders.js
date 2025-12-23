/**
 * Migration: Add Marketplace/B2B Fields to Basket and Order Tables
 * Phase 4: Marketplace & B2B - Multi-seller order support
 */

exports.up = async function (knex) {
  // Add marketplace/B2B fields to basket table
  const hasBasketStoreId = await knex.schema.hasColumn('basket', 'storeId');
  if (!hasBasketStoreId) {
    await knex.schema.alterTable('basket', table => {
      table.string('storeId', 50).nullable();
      table.string('channelId', 50).nullable();
      table.string('accountId', 50).nullable(); // B2B company
    });
  }

  // Add sellerId to basketItem table
  const hasBasketItemSellerId = await knex.schema.hasColumn('basketItem', 'sellerId');
  if (!hasBasketItemSellerId) {
    await knex.schema.alterTable('basketItem', table => {
      table.string('sellerId', 50).nullable();
    });
  }

  // Add marketplace/B2B fields to order table
  const hasOrderStoreId = await knex.schema.hasColumn('order', 'storeId');
  if (!hasOrderStoreId) {
    await knex.schema.alterTable('order', table => {
      table.string('storeId', 50).nullable();
      table.string('channelId', 50).nullable();
      table.string('accountId', 50).nullable(); // B2B company
      table.string('merchantId', 50).nullable(); // Primary merchant (marketplace)
      table.string('purchaseOrderNumber', 100).nullable(); // B2B PO reference
      table.string('parentOrderId', 50).nullable(); // For split orders
    });
  }

  // Add sellerId to orderLine table
  const hasOrderLineSellerId = await knex.schema.hasColumn('orderLine', 'sellerId');
  if (!hasOrderLineSellerId) {
    await knex.schema.alterTable('orderLine', table => {
      table.string('sellerId', 50).nullable();
    });
  }
};

exports.down = async function (knex) {
  // Remove sellerId from orderLine
  const hasOrderLineSellerId = await knex.schema.hasColumn('orderLine', 'sellerId');
  if (hasOrderLineSellerId) {
    await knex.schema.alterTable('orderLine', table => {
      table.dropColumn('sellerId');
    });
  }

  // Remove marketplace/B2B fields from order
  const hasOrderStoreId = await knex.schema.hasColumn('order', 'storeId');
  if (hasOrderStoreId) {
    await knex.schema.alterTable('order', table => {
      table.dropColumn('storeId');
      table.dropColumn('channelId');
      table.dropColumn('accountId');
      table.dropColumn('merchantId');
      table.dropColumn('purchaseOrderNumber');
      table.dropColumn('parentOrderId');
    });
  }

  // Remove sellerId from basketItem
  const hasBasketItemSellerId = await knex.schema.hasColumn('basketItem', 'sellerId');
  if (hasBasketItemSellerId) {
    await knex.schema.alterTable('basketItem', table => {
      table.dropColumn('sellerId');
    });
  }

  // Remove marketplace/B2B fields from basket
  const hasBasketStoreId = await knex.schema.hasColumn('basket', 'storeId');
  if (hasBasketStoreId) {
    await knex.schema.alterTable('basket', table => {
      table.dropColumn('storeId');
      table.dropColumn('channelId');
      table.dropColumn('accountId');
    });
  }
};
