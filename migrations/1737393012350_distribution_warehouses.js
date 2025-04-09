/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create warehouse table for physical storage locations
  pgm.createTable("warehouse", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true, unique: true }, // Short code for warehouse
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    isDefault: { type: "boolean", notNull: true, default: false }, // Primary warehouse
    isFulfillmentCenter: { type: "boolean", notNull: true, default: true }, // Can fulfill orders
    isReturnCenter: { type: "boolean", notNull: true, default: true }, // Can receive returns
    isVirtual: { type: "boolean", notNull: true, default: false }, // For dropshipping or virtual inventory
    merchantId: { type: "uuid", references: "merchant" }, // For merchant-specific warehouses
    addressLine1: { type: "varchar(255)", notNull: true },
    addressLine2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)", notNull: true },
    postalCode: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    latitude: { type: "decimal(10,7)" }, // For distance calculations
    longitude: { type: "decimal(10,7)" }, // For distance calculations
    email: { type: "varchar(255)" },
    phone: { type: "varchar(30)" },
    contactName: { type: "varchar(100)" },
    timezone: { type: "varchar(50)", notNull: true, default: 'UTC' },
    cutoffTime: { type: "time", default: '14:00:00' }, // Order cutoff for same-day processing
    processingTime: { type: "integer", default: 1 }, // Days to process an order
    operatingHours: { type: "jsonb" }, // Opening hours by day
    capabilities: { type: "jsonb" }, // Special capabilities (refrigeration, hazmat, etc.)
    shippingMethods: { type: "text[]" }, // Supported shipping methods
    metadata: { type: "jsonb" }, // Additional attributes
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for warehouse
  pgm.createIndex("warehouse", "code");
  pgm.createIndex("warehouse", "isActive");
  pgm.createIndex("warehouse", "isDefault");
  pgm.createIndex("warehouse", "isFulfillmentCenter");
  pgm.createIndex("warehouse", "isReturnCenter");
  pgm.createIndex("warehouse", "merchantId");
  pgm.createIndex("warehouse", "country");
  pgm.createIndex("warehouse", ["latitude", "longitude"]);

  // Only one default warehouse is allowed
  pgm.createIndex("warehouse", "isDefault", { 
    unique: true,
    where: "isDefault = true"
  });

  // Create warehouse zone table for warehouse sub-locations
  pgm.createTable("warehouse_zone", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true }, // Zone code (A, B, Cold Storage, etc.)
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    zoneType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "zoneType IN ('storage', 'picking', 'packing', 'shipping', 'receiving', 'returns', 'quarantine', 'special')" 
    },
    capabilities: { type: "jsonb" }, // Zone-specific capabilities
    priority: { type: "integer", default: 0 }, // For picking sequence
    capacity: { type: "decimal(10,2)" }, // Storage capacity (units vary)
    capacityUnit: { type: "varchar(10)" }, // Unit of capacity (sqft, cubic meters, pallets)
    temperature: { type: "decimal(5,2)" }, // For temperature-controlled zones
    humidity: { type: "decimal(5,2)" }, // For humidity-controlled zones
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for warehouse zones
  pgm.createIndex("warehouse_zone", "warehouseId");
  pgm.createIndex("warehouse_zone", "code");
  pgm.createIndex("warehouse_zone", "isActive");
  pgm.createIndex("warehouse_zone", "zoneType");
  pgm.createIndex("warehouse_zone", "priority");
  pgm.createIndex("warehouse_zone", ["warehouseId", "code"], { unique: true });

  // Create warehouse bin locations table
  pgm.createTable("warehouse_bin", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    zoneId: { type: "uuid", references: "warehouse_zone", onDelete: "SET NULL" },
    locationCode: { type: "varchar(50)", notNull: true }, // Unique bin location code
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    binType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'standard',
      check: "binType IN ('standard', 'oversize', 'bulk', 'special', 'hazardous', 'refrigerated')" 
    },
    aisle: { type: "varchar(10)" }, // Aisle identifier
    rack: { type: "varchar(10)" }, // Rack identifier
    shelf: { type: "varchar(10)" }, // Shelf identifier
    bin: { type: "varchar(10)" }, // Bin identifier
    position: { type: "jsonb" }, // 3D coordinates within warehouse
    dimensions: { type: "jsonb" }, // Width, depth, height
    maxWeight: { type: "decimal(10,2)" }, // Maximum weight capacity
    isPickable: { type: "boolean", notNull: true, default: true }, // Available for picking
    isReceivable: { type: "boolean", notNull: true, default: true }, // Available for receiving
    isMixed: { type: "boolean", notNull: true, default: true }, // Can contain mixed SKUs
    priority: { type: "integer", default: 0 }, // For picking optimization
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for warehouse bins
  pgm.createIndex("warehouse_bin", "warehouseId");
  pgm.createIndex("warehouse_bin", "zoneId");
  pgm.createIndex("warehouse_bin", "locationCode");
  pgm.createIndex("warehouse_bin", "isActive");
  pgm.createIndex("warehouse_bin", "binType");
  pgm.createIndex("warehouse_bin", "isPickable");
  pgm.createIndex("warehouse_bin", "isReceivable");
  pgm.createIndex("warehouse_bin", "priority");
  pgm.createIndex("warehouse_bin", ["warehouseId", "locationCode"], { unique: true });

  // Create inventory location table (links products to warehouse locations)
  pgm.createTable("inventory_location", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    binId: { type: "uuid", references: "warehouse_bin", onDelete: "SET NULL" },
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    quantity: { type: "integer", notNull: true, default: 0 },
    reservedQuantity: { type: "integer", notNull: true, default: 0 }, // Qty reserved for orders
    availableQuantity: { 
      type: "integer", 
      notNull: true, 
      default: 0,
      check: "availableQuantity = quantity - reservedQuantity" 
    },
    minimumStockLevel: { type: "integer", default: 0 }, // Reorder point
    maximumStockLevel: { type: "integer" }, // Maximum inventory level
    lotNumber: { type: "varchar(100)" },
    serialNumber: { type: "varchar(100)" },
    expiryDate: { type: "timestamp" },
    receivedDate: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'available',
      check: "status IN ('available', 'reserved', 'damaged', 'quarantine', 'expired', 'pending')" 
    },
    lastCountDate: { type: "timestamp" }, // Last physical count date
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory locations
  pgm.createIndex("inventory_location", "warehouseId");
  pgm.createIndex("inventory_location", "binId");
  pgm.createIndex("inventory_location", "productId");
  pgm.createIndex("inventory_location", "variantId");
  pgm.createIndex("inventory_location", "sku");
  pgm.createIndex("inventory_location", "quantity");
  pgm.createIndex("inventory_location", "reservedQuantity");
  pgm.createIndex("inventory_location", "availableQuantity");
  pgm.createIndex("inventory_location", "status");
  pgm.createIndex("inventory_location", "lotNumber");
  pgm.createIndex("inventory_location", "expiryDate");
  pgm.createIndex("inventory_location", ["warehouseId", "binId", "productId", "variantId", "lotNumber"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Insert a default warehouse
  pgm.sql(`
    INSERT INTO "warehouse" (
      name,
      code,
      description,
      isActive,
      isDefault,
      isFulfillmentCenter,
      isReturnCenter,
      addressLine1,
      city,
      state,
      postalCode,
      country,
      timezone
    )
    VALUES (
      'Main Warehouse',
      'MAIN',
      'Primary distribution center',
      true,
      true,
      true,
      true,
      '123 Warehouse Ave',
      'Anytown',
      'State',
      '12345',
      'US',
      'America/New_York'
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("inventory_location");
  pgm.dropTable("warehouse_bin");
  pgm.dropTable("warehouse_zone");
  pgm.dropTable("warehouse");
};
