/**
 * Warehouse Test Data Seed
 * Seeds test data for warehouse integration tests
 */

// Fixed UUIDs for test data consistency
const WAREHOUSE_IDS = {
  MAIN: '0193b000-0000-7000-8000-000000000001',
  WEST_COAST: '0193b000-0000-7000-8000-000000000002',
  EAST_COAST: '0193b000-0000-7000-8000-000000000003',
  RETURNS: '0193b000-0000-7000-8000-000000000004',
};

const ZONE_IDS = {
  MAIN_STORAGE: '0193b001-0000-7000-8000-000000000001',
  MAIN_PICKING: '0193b001-0000-7000-8000-000000000002',
  MAIN_SHIPPING: '0193b001-0000-7000-8000-000000000003',
  WEST_STORAGE: '0193b001-0000-7000-8000-000000000004',
};

const BIN_IDS = {
  A1_01: '0193b002-0000-7000-8000-000000000001',
  A1_02: '0193b002-0000-7000-8000-000000000002',
  B1_01: '0193b002-0000-7000-8000-000000000003',
  SHIP_01: '0193b002-0000-7000-8000-000000000004',
};

exports.seed = async function (knex) {
  // Check if required tables exist
  const hasWarehouseTable = await knex.schema.hasTable('distributionWarehouse');
  if (!hasWarehouseTable) {
    return;
  }

  // Clean up existing test data in reverse order of dependencies
  await knex('distributionWarehouseBin')
    .whereIn('distributionWarehouseBinId', Object.values(BIN_IDS))
    .del()
    .catch(() => {});
  await knex('distributionWarehouseZone')
    .whereIn('distributionWarehouseZoneId', Object.values(ZONE_IDS))
    .del()
    .catch(() => {});
  await knex('distributionWarehouse')
    .whereIn('distributionWarehouseId', Object.values(WAREHOUSE_IDS))
    .del()
    .catch(() => {});

  // Seed Warehouses
  await knex('distributionWarehouse').insert([
    {
      distributionWarehouseId: WAREHOUSE_IDS.MAIN,
      name: 'Test Main Warehouse',
      code: 'TEST-MAIN',
      description: 'Primary test distribution center',
      isActive: true,
      isDefault: false,
      isFulfillmentCenter: true,
      isReturnCenter: true,
      isVirtual: false,
      addressLine1: '100 Test Warehouse Blvd',
      city: 'Test City',
      state: 'TX',
      postalCode: '75001',
      country: 'US',
      latitude: 32.7767,
      longitude: -96.797,
      email: 'main@testwarehouse.com',
      phone: '555-0100',
      contactName: 'John Manager',
      timezone: 'America/Chicago',
      cutoffTime: '14:00:00',
      processingTime: 1,
      operatingHours: JSON.stringify({
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
      }),
      capabilities: JSON.stringify(['standard', 'express', 'hazmat']),
      shippingMethods: ['ground', 'express', 'overnight'],
    },
    {
      distributionWarehouseId: WAREHOUSE_IDS.WEST_COAST,
      name: 'Test West Coast Warehouse',
      code: 'TEST-WEST',
      description: 'West coast distribution center',
      isActive: true,
      isDefault: false,
      isFulfillmentCenter: true,
      isReturnCenter: false,
      isVirtual: false,
      addressLine1: '200 Pacific Way',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
      latitude: 34.0522,
      longitude: -118.2437,
      email: 'west@testwarehouse.com',
      phone: '555-0200',
      contactName: 'Jane Manager',
      timezone: 'America/Los_Angeles',
      cutoffTime: '15:00:00',
      processingTime: 1,
    },
    {
      distributionWarehouseId: WAREHOUSE_IDS.EAST_COAST,
      name: 'Test East Coast Warehouse',
      code: 'TEST-EAST',
      description: 'East coast distribution center',
      isActive: true,
      isDefault: false,
      isFulfillmentCenter: true,
      isReturnCenter: false,
      isVirtual: false,
      addressLine1: '300 Atlantic Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      email: 'east@testwarehouse.com',
      phone: '555-0300',
      contactName: 'Bob Manager',
      timezone: 'America/New_York',
      cutoffTime: '13:00:00',
      processingTime: 1,
    },
    {
      distributionWarehouseId: WAREHOUSE_IDS.RETURNS,
      name: 'Test Returns Center',
      code: 'TEST-RETURNS',
      description: 'Dedicated returns processing center',
      isActive: true,
      isDefault: false,
      isFulfillmentCenter: false,
      isReturnCenter: true,
      isVirtual: false,
      addressLine1: '400 Return Lane',
      city: 'Test City',
      state: 'TX',
      postalCode: '75002',
      country: 'US',
      email: 'returns@testwarehouse.com',
      phone: '555-0400',
      contactName: 'Returns Team',
      timezone: 'America/Chicago',
      processingTime: 2,
    },
  ]);

  // Seed Warehouse Zones
  await knex('distributionWarehouseZone').insert([
    {
      distributionWarehouseZoneId: ZONE_IDS.MAIN_STORAGE,
      distributionWarehouseId: WAREHOUSE_IDS.MAIN,
      name: 'Main Storage Zone',
      code: 'STORAGE-A',
      description: 'Primary storage area',
      isActive: true,
      zoneType: 'storage',
      priority: 1,
      capacity: 10000,
      capacityUnit: 'sqft',
    },
    {
      distributionWarehouseZoneId: ZONE_IDS.MAIN_PICKING,
      distributionWarehouseId: WAREHOUSE_IDS.MAIN,
      name: 'Main Picking Zone',
      code: 'PICKING-A',
      description: 'Order picking area',
      isActive: true,
      zoneType: 'picking',
      priority: 2,
      capacity: 5000,
      capacityUnit: 'sqft',
    },
    {
      distributionWarehouseZoneId: ZONE_IDS.MAIN_SHIPPING,
      distributionWarehouseId: WAREHOUSE_IDS.MAIN,
      name: 'Main Shipping Zone',
      code: 'SHIPPING-A',
      description: 'Outbound shipping area',
      isActive: true,
      zoneType: 'shipping',
      priority: 3,
      capacity: 3000,
      capacityUnit: 'sqft',
    },
    {
      distributionWarehouseZoneId: ZONE_IDS.WEST_STORAGE,
      distributionWarehouseId: WAREHOUSE_IDS.WEST_COAST,
      name: 'West Storage Zone',
      code: 'STORAGE-W',
      description: 'West coast storage area',
      isActive: true,
      zoneType: 'storage',
      priority: 1,
      capacity: 8000,
      capacityUnit: 'sqft',
    },
  ]);

  // Seed Warehouse Bins
  await knex('distributionWarehouseBin').insert([
    {
      distributionWarehouseBinId: BIN_IDS.A1_01,
      distributionWarehouseId: WAREHOUSE_IDS.MAIN,
      distributionWarehouseZoneId: ZONE_IDS.MAIN_STORAGE,
      locationCode: 'A1-01',
      isActive: true,
      binType: 'storage',
      height: 200,
      width: 100,
      depth: 100,
      maxVolume: 2000000,
      maxWeight: 500,
      isPickable: true,
      isReceivable: true,
      isMixed: true,
      priority: 1,
    },
    {
      distributionWarehouseBinId: BIN_IDS.A1_02,
      distributionWarehouseId: WAREHOUSE_IDS.MAIN,
      distributionWarehouseZoneId: ZONE_IDS.MAIN_STORAGE,
      locationCode: 'A1-02',
      isActive: true,
      binType: 'storage',
      height: 200,
      width: 100,
      depth: 100,
      maxVolume: 2000000,
      maxWeight: 500,
      isPickable: true,
      isReceivable: true,
      isMixed: true,
      priority: 2,
    },
    {
      distributionWarehouseBinId: BIN_IDS.B1_01,
      distributionWarehouseId: WAREHOUSE_IDS.MAIN,
      distributionWarehouseZoneId: ZONE_IDS.MAIN_PICKING,
      locationCode: 'B1-01',
      isActive: true,
      binType: 'picking',
      height: 150,
      width: 80,
      depth: 80,
      maxVolume: 960000,
      maxWeight: 200,
      isPickable: true,
      isReceivable: false,
      isMixed: false,
      priority: 1,
    },
    {
      distributionWarehouseBinId: BIN_IDS.SHIP_01,
      distributionWarehouseId: WAREHOUSE_IDS.MAIN,
      distributionWarehouseZoneId: ZONE_IDS.MAIN_SHIPPING,
      locationCode: 'SHIP-01',
      isActive: true,
      binType: 'shipping',
      height: 100,
      width: 200,
      depth: 200,
      maxVolume: 4000000,
      maxWeight: 1000,
      isPickable: false,
      isReceivable: false,
      isMixed: true,
      priority: 1,
    },
  ]);
};
