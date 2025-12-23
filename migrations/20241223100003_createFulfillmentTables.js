/**
 * Migration: Create Fulfillment & Inventory Tables
 * Phase 3: Inventory & Fulfillment - Location-based inventory with reservations
 */

exports.up = async function(knex) {
  // Create fulfillmentLocation unified table
  const hasFulfillmentLocation = await knex.schema.hasTable('fulfillmentLocation');
  if (!hasFulfillmentLocation) {
    await knex.schema.createTable('fulfillmentLocation', (table) => {
      table.string('locationId', 50).primary();
      table.string('organizationId', 50).notNullable();
      table.string('type', 30).notNullable(); // 'warehouse', 'store', 'dropship_vendor', '3pl', 'dark_store'
      table.string('name', 255).notNullable();
      table.string('code', 50).unique().nullable();
      table.string('addressId', 50).nullable();
      table.string('timezone', 50).defaultTo('UTC');
      table.string('sellerId', 50).nullable(); // For dropship vendors
      table.boolean('isActive').defaultTo(true);
      table.jsonb('capabilities').defaultTo('{}'); // { canShip: true, canPickup: true, canLocalDeliver: true }
      table.jsonb('operatingHours').defaultTo('{}');
      table.decimal('latitude', 10, 7).nullable();
      table.decimal('longitude', 10, 7).nullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      
      table.index('organizationId');
      table.index('type');
      table.index('sellerId');
      table.index('isActive');
    });
  }

  // Create inventoryReservation table
  const hasInventoryReservation = await knex.schema.hasTable('inventoryReservation');
  if (!hasInventoryReservation) {
    await knex.schema.createTable('inventoryReservation', (table) => {
      table.string('reservationId', 50).primary();
      table.string('orderId', 50).notNullable();
      table.string('productVariantId', 50).notNullable();
      table.string('locationId', 50).notNullable();
      table.integer('quantity').notNullable();
      table.string('status', 20).defaultTo('reserved'); // 'reserved', 'released', 'consumed'
      table.timestamp('expiresAt').nullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      
      table.index('orderId');
      table.index('productVariantId');
      table.index('locationId');
      table.index('status');
      table.index('expiresAt');
    });
  }

  // Create orderAllocation table
  const hasOrderAllocation = await knex.schema.hasTable('orderAllocation');
  if (!hasOrderAllocation) {
    await knex.schema.createTable('orderAllocation', (table) => {
      table.string('allocationId', 50).primary();
      table.string('orderLineId', 50).notNullable();
      table.string('locationId', 50).notNullable();
      table.string('sellerId', 50).nullable(); // For marketplace
      table.integer('quantity').notNullable();
      table.string('status', 20).defaultTo('allocated'); // 'allocated', 'picked', 'packed', 'shipped'
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      
      table.index('orderLineId');
      table.index('locationId');
      table.index('sellerId');
      table.index('status');
    });
  }

  // Create fulfillmentNetworkRule table
  const hasFulfillmentNetworkRule = await knex.schema.hasTable('fulfillmentNetworkRule');
  if (!hasFulfillmentNetworkRule) {
    await knex.schema.createTable('fulfillmentNetworkRule', (table) => {
      table.string('ruleId', 50).primary();
      table.string('organizationId', 50).notNullable();
      table.string('storeId', 50).nullable();
      table.string('channelId', 50).nullable();
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
  }

  // Add fields to inventoryLevel if not exists
  const hasInvLevelSafetyStock = await knex.schema.hasColumn('inventoryLevel', 'safetyStockQty');
  if (!hasInvLevelSafetyStock) {
    await knex.schema.alterTable('inventoryLevel', (table) => {
      table.integer('safetyStockQty').defaultTo(0);
      table.integer('inboundQty').defaultTo(0);
      table.string('locationId', 50).nullable();
    });
  }
};

exports.down = async function(knex) {
  // Remove fulfillmentNetworkRule table
  await knex.schema.dropTableIfExists('fulfillmentNetworkRule');
  
  // Remove orderAllocation table
  await knex.schema.dropTableIfExists('orderAllocation');
  
  // Remove inventoryReservation table
  await knex.schema.dropTableIfExists('inventoryReservation');
  
  // Remove fulfillmentLocation table
  await knex.schema.dropTableIfExists('fulfillmentLocation');

  // Remove added columns from inventoryLevel
  const hasInvLevelSafetyStock = await knex.schema.hasColumn('inventoryLevel', 'safetyStockQty');
  if (hasInvLevelSafetyStock) {
    await knex.schema.alterTable('inventoryLevel', (table) => {
      table.dropColumn('safetyStockQty');
      table.dropColumn('inboundQty');
      table.dropColumn('locationId');
    });
  }
};
