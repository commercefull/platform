/**
 * Migration: Create Inventory Pool Tables for Multi-Store
 */

exports.up = async function(knex) {
  // Create inventory_pool table
  await knex.schema.createTable('inventoryPool', (table) => {
    table.string('poolId').primary();
    table.string('name').notNullable();
    table.string('ownerType').notNullable(); // business, merchant
    table.string('ownerId').notNullable();
    table.string('poolType').notNullable().defaultTo('shared'); // shared, virtual, aggregated
    table.string('allocationStrategy').defaultTo('fifo'); // fifo, nearest, even_split
    table.string('reservationPolicy').defaultTo('immediate'); // immediate, deferred
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['ownerType', 'ownerId']);
    table.index(['isActive']);
  });

  // Create inventory_pool_location table
  await knex.schema.createTable('inventoryPoolLocation', (table) => {
    table.string('poolLocationId').primary();
    table.string('poolId').notNullable().references('poolId').inTable('inventoryPool').onDelete('CASCADE');
    table.string('locationType').notNullable(); // warehouse, store
    table.string('locationId').notNullable();
    table.integer('priority').defaultTo(0);
    table.decimal('allocationPercentage', 5, 2); // For even_split strategy
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    
    table.unique(['poolId', 'locationId']);
    table.index(['locationId']);
  });

  // Create inventory_allocation table
  await knex.schema.createTable('inventoryAllocation', (table) => {
    table.string('allocationId').primary();
    table.string('poolId').references('poolId').inTable('inventoryPool');
    table.string('productId').notNullable();
    table.string('variantId');
    table.string('orderId');
    table.string('basketId');
    table.string('sourceLocationId').notNullable();
    table.integer('quantity').notNullable();
    table.string('status').defaultTo('reserved'); // reserved, allocated, released, fulfilled
    table.timestamp('expiresAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['poolId']);
    table.index(['productId', 'variantId']);
    table.index(['orderId']);
    table.index(['status']);
    table.index(['expiresAt']);
  });

  // Create inventory_reservation table (for stock holds)
  await knex.schema.createTable('inventoryReservation', (table) => {
    table.string('reservationId').primary();
    table.string('inventoryItemId').notNullable();
    table.string('productId').notNullable();
    table.string('variantId');
    table.string('sku');
    table.string('orderId');
    table.string('basketId');
    table.string('locationId');
    table.integer('quantity').notNullable();
    table.string('status').defaultTo('active'); // active, released, fulfilled, expired
    table.timestamp('expiresAt');
    table.string('releasedReason');
    table.timestamp('releasedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['orderId']);
    table.index(['basketId']);
    table.index(['status']);
    table.index(['expiresAt']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('inventoryReservation');
  await knex.schema.dropTableIfExists('inventoryAllocation');
  await knex.schema.dropTableIfExists('inventoryPoolLocation');
  await knex.schema.dropTableIfExists('inventoryPool');
};
