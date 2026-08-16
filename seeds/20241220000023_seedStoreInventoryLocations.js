/**
 * Seed Store Inventory Locations
 * Links distribution warehouses to test stores for dispatch/inventory tests
 */

const tableName = 'distributionWarehouse';

const TEST_STORE_IDS = {
  ACTIVE: '20000000-0000-0000-0000-000000000001',
  FEATURED: '20000000-0000-0000-0000-000000000003',
};

const STORE_WAREHOUSE_IDS = {
  ACTIVE_STORE: '20000000-0000-7000-8000-000000000001',
  FEATURED_STORE: '20000000-0000-7000-8000-000000000003',
};

exports.seed = async function (knex) {
  // Clean up existing test data
  await knex(tableName).whereIn('distributionWarehouseId', Object.values(STORE_WAREHOUSE_IDS)).del();

  await knex(tableName).insert([
    {
      distributionWarehouseId: STORE_WAREHOUSE_IDS.ACTIVE_STORE,
      name: 'Active Store Warehouse',
      code: 'STORE-ACTIVE-WH',
      addressLine1: '123 Main St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      isActive: true,
      isDefault: true,
      storeId: TEST_STORE_IDS.ACTIVE,
    },
    {
      distributionWarehouseId: STORE_WAREHOUSE_IDS.FEATURED_STORE,
      name: 'Featured Store Warehouse',
      code: 'STORE-FEATURED-WH',
      addressLine1: '456 Commerce Ave',
      city: 'Featured City',
      state: 'FC',
      postalCode: '67890',
      country: 'US',
      isActive: true,
      isDefault: true,
      storeId: TEST_STORE_IDS.FEATURED,
    },
  ]);

  // Seed inventory for test product at the active store warehouse
  const TEST_PRODUCT_ID = '00000000-0000-0000-0000-000000000001';
  await knex('inventoryLocation')
    .where('inventoryLocationId', '20000000-0000-7001-8000-000000000001')
    .del();

  await knex('inventoryLocation').insert({
    inventoryLocationId: '20000000-0000-7001-8000-000000000001',
    distributionWarehouseId: STORE_WAREHOUSE_IDS.ACTIVE_STORE,
    storeId: TEST_STORE_IDS.ACTIVE,
    productId: TEST_PRODUCT_ID,
    sku: 'TEST-SKU-001',
    quantity: 100,
    reservedQuantity: 0,
    availableQuantity: 100,
    minimumStockLevel: 5,
    maximumStockLevel: 500,
    status: 'available',
  });
};
