/**
 * Migration: Create Store Hierarchy and Multi-Store Tables
 */

exports.up = async function(knex) {
  // Create store_hierarchy table
  await knex.schema.createTable('storeHierarchy', (table) => {
    table.string('hierarchyId').primary();
    table.string('businessId').notNullable();
    table.string('defaultStoreId');
    table.string('sharedInventoryPoolId');
    table.string('sharedCatalogId');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['businessId']);
  });

  // Create store_settings table
  await knex.schema.createTable('storeSettings', (table) => {
    table.string('storeSettingsId').primary();
    table.string('storeId').notNullable().unique();
    table.string('inventoryMode').defaultTo('shared'); // shared, dedicated, hybrid
    table.string('inventoryLocationId');
    table.string('priceListId');
    table.string('taxProfileId');
    table.boolean('canFulfillOnline').defaultTo(true);
    table.boolean('canPickupInStore').defaultTo(false);
    table.boolean('localDeliveryEnabled').defaultTo(false);
    table.decimal('localDeliveryRadius', 10, 2);
    table.string('localDeliveryRadiusUnit').defaultTo('km');
    table.jsonb('operatingHours');
    table.jsonb('pickupHours');
    table.integer('pickupLeadTimeMinutes').defaultTo(60);
    table.integer('maxDailyPickups');
    table.jsonb('customSettings');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['storeId']);
  });

  // Create store_pickup_location table
  await knex.schema.createTable('storePickupLocation', (table) => {
    table.string('pickupLocationId').primary();
    table.string('storeId').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('address').notNullable();
    table.decimal('latitude', 10, 7);
    table.decimal('longitude', 10, 7);
    table.jsonb('operatingHours');
    table.string('contactPhone');
    table.string('contactEmail');
    table.text('instructions');
    table.boolean('isActive').defaultTo(true);
    table.integer('sortOrder').defaultTo(0);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['storeId']);
    table.index(['isActive']);
  });

  // Create store_delivery_zone table
  await knex.schema.createTable('storeDeliveryZone', (table) => {
    table.string('deliveryZoneId').primary();
    table.string('storeId').notNullable();
    table.string('name').notNullable();
    table.string('type').notNullable(); // radius, polygon, postal_codes
    table.decimal('radiusKm', 10, 2);
    table.jsonb('polygon'); // GeoJSON polygon
    table.jsonb('postalCodes'); // Array of postal codes
    table.decimal('deliveryFee', 12, 2).defaultTo(0);
    table.decimal('minOrderValue', 12, 2);
    table.integer('estimatedMinutes');
    table.jsonb('deliveryHours');
    table.boolean('isActive').defaultTo(true);
    table.integer('priority').defaultTo(0);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['storeId']);
    table.index(['isActive']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('storeDeliveryZone');
  await knex.schema.dropTableIfExists('storePickupLocation');
  await knex.schema.dropTableIfExists('storeSettings');
  await knex.schema.dropTableIfExists('storeHierarchy');
};
