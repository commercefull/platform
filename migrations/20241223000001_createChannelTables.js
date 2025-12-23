/**
 * Migration: Create Channel Module Tables
 * 
 * Creates tables for distribution channels.
 */

exports.up = async function(knex) {
  // Create channel table
  await knex.schema.createTable('channel', (table) => {
    table.string('channelId').primary();
    table.string('name').notNullable();
    table.string('code').notNullable().unique();
    table.string('type').notNullable(); // web, mobile_app, marketplace, social, pos, wholesale, api, b2b_portal
    table.string('ownerType').notNullable().defaultTo('platform'); // platform, merchant, business
    table.string('ownerId');
    table.jsonb('storeIds').defaultTo('[]');
    table.string('defaultStoreId');
    table.string('catalogId');
    table.string('priceListId');
    table.string('currencyCode').notNullable().defaultTo('USD');
    table.string('localeCode').notNullable().defaultTo('en-US');
    table.jsonb('warehouseIds').defaultTo('[]');
    table.string('fulfillmentStrategy').defaultTo('nearest'); // nearest, priority, round_robin, merchant_assigned
    table.boolean('requiresApproval').defaultTo(false);
    table.boolean('allowCreditPayment').defaultTo(false);
    table.boolean('b2bPricingEnabled').defaultTo(false);
    table.decimal('commissionRate', 5, 4);
    table.boolean('merchantVisible').defaultTo(true);
    table.boolean('isActive').defaultTo(true);
    table.boolean('isDefault').defaultTo(false);
    table.jsonb('settings');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['ownerType', 'ownerId']);
    table.index(['isActive']);
    table.index(['type']);
  });

  // Create channel_product table
  await knex.schema.createTable('channelProduct', (table) => {
    table.string('channelProductId').primary();
    table.string('channelId').notNullable().references('channelId').inTable('channel').onDelete('CASCADE');
    table.string('productId').notNullable();
    table.boolean('isVisible').defaultTo(true);
    table.boolean('isFeatured').defaultTo(false);
    table.decimal('priceOverride', 12, 2);
    table.decimal('salePriceOverride', 12, 2);
    table.integer('inventoryOverride');
    table.integer('sortOrder').defaultTo(0);
    table.timestamp('publishedAt');
    table.timestamp('unpublishedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.unique(['channelId', 'productId']);
    table.index(['channelId', 'isVisible']);
  });

  // Create channel_warehouse table
  await knex.schema.createTable('channelWarehouse', (table) => {
    table.string('channelWarehouseId').primary();
    table.string('channelId').notNullable().references('channelId').inTable('channel').onDelete('CASCADE');
    table.string('warehouseId').notNullable();
    table.integer('priority').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    
    table.unique(['channelId', 'warehouseId']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('channelWarehouse');
  await knex.schema.dropTableIfExists('channelProduct');
  await knex.schema.dropTableIfExists('channel');
};
