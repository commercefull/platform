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
    is_active: { type: "boolean", notNull: true, default: true },
    is_default: { type: "boolean", notNull: true, default: false }, // Primary warehouse
    is_fulfillment_center: { type: "boolean", notNull: true, default: true }, // Can fulfill orders
    is_return_center: { type: "boolean", notNull: true, default: true }, // Can receive returns
    is_virtual: { type: "boolean", notNull: true, default: false }, // For dropshipping or virtual inventory
    merchant_id: { type: "uuid", references: "merchant" }, // For merchant-specific warehouses
    address_line1: { type: "varchar(255)", notNull: true },
    address_line2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)", notNull: true },
    postal_code: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    latitude: { type: "decimal(10,7)" }, // For distance calculations
    longitude: { type: "decimal(10,7)" }, // For distance calculations
    email: { type: "varchar(255)" },
    phone: { type: "varchar(30)" },
    contact_name: { type: "varchar(100)" },
    timezone: { type: "varchar(50)", notNull: true, default: 'UTC' },
    cutoff_time: { type: "time", default: '14:00:00' }, // Order cutoff for same-day processing
    processing_time: { type: "integer", default: 1 }, // Days to process an order
    operating_hours: { type: "jsonb" }, // Opening hours by day
    capabilities: { type: "jsonb" }, // Special capabilities (refrigeration, hazmat, etc.)
    shipping_methods: { type: "text[]" }, // Supported shipping methods
    metadata: { type: "jsonb" }, // Additional attributes
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for warehouse
  pgm.createIndex("warehouse", "code");
  pgm.createIndex("warehouse", "is_active");
  pgm.createIndex("warehouse", "is_default");
  pgm.createIndex("warehouse", "is_fulfillment_center");
  pgm.createIndex("warehouse", "is_return_center");
  pgm.createIndex("warehouse", "merchant_id");
  pgm.createIndex("warehouse", "country");
  pgm.createIndex("warehouse", ["latitude", "longitude"]);

  // Only one default warehouse is allowed
  pgm.createIndex("warehouse", "is_default", { 
    unique: true,
    where: "is_default = true"
  });

  // Create warehouse zone table for warehouse sub-locations
  pgm.createTable("warehouse_zone", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true }, // Zone code (A, B, Cold Storage, etc.)
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    zone_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "zone_type IN ('storage', 'picking', 'packing', 'shipping', 'receiving', 'returns', 'quarantine', 'special')" 
    },
    capabilities: { type: "jsonb" }, // Zone-specific capabilities
    priority: { type: "integer", default: 0 }, // For picking sequence
    capacity: { type: "decimal(10,2)" }, // Storage capacity (units vary)
    capacity_unit: { type: "varchar(10)" }, // Unit of capacity (sqft, cubic meters, pallets)
    temperature: { type: "decimal(5,2)" }, // For temperature-controlled zones
    humidity: { type: "decimal(5,2)" }, // For humidity-controlled zones
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for warehouse zones
  pgm.createIndex("warehouse_zone", "warehouse_id");
  pgm.createIndex("warehouse_zone", "code");
  pgm.createIndex("warehouse_zone", "is_active");
  pgm.createIndex("warehouse_zone", "zone_type");
  pgm.createIndex("warehouse_zone", "priority");
  pgm.createIndex("warehouse_zone", ["warehouse_id", "code"], { unique: true });

  // Create warehouse bin locations table
  pgm.createTable("warehouse_bin", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    zone_id: { type: "uuid", references: "warehouse_zone", onDelete: "SET NULL" },
    location_code: { type: "varchar(50)", notNull: true }, // Unique bin location code
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    bin_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'standard',
      check: "bin_type IN ('standard', 'oversize', 'bulk', 'special', 'hazardous', 'refrigerated')" 
    },
    aisle: { type: "varchar(10)" }, // Aisle identifier
    rack: { type: "varchar(10)" }, // Rack identifier
    shelf: { type: "varchar(10)" }, // Shelf identifier
    bin: { type: "varchar(10)" }, // Bin identifier
    position: { type: "jsonb" }, // 3D coordinates within warehouse
    dimensions: { type: "jsonb" }, // Width, depth, height
    max_weight: { type: "decimal(10,2)" }, // Maximum weight capacity
    is_pickable: { type: "boolean", notNull: true, default: true }, // Available for picking
    is_receivable: { type: "boolean", notNull: true, default: true }, // Available for receiving
    is_mixed: { type: "boolean", notNull: true, default: true }, // Can contain mixed SKUs
    priority: { type: "integer", default: 0 }, // For picking optimization
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for warehouse bins
  pgm.createIndex("warehouse_bin", "warehouse_id");
  pgm.createIndex("warehouse_bin", "zone_id");
  pgm.createIndex("warehouse_bin", "location_code");
  pgm.createIndex("warehouse_bin", "is_active");
  pgm.createIndex("warehouse_bin", "bin_type");
  pgm.createIndex("warehouse_bin", "is_pickable");
  pgm.createIndex("warehouse_bin", "is_receivable");
  pgm.createIndex("warehouse_bin", "priority");
  pgm.createIndex("warehouse_bin", ["warehouse_id", "location_code"], { unique: true });

  // Create inventory location table (links products to warehouse locations)
  pgm.createTable("inventory_location", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    bin_id: { type: "uuid", references: "warehouse_bin", onDelete: "SET NULL" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    quantity: { type: "integer", notNull: true, default: 0 },
    reserved_quantity: { type: "integer", notNull: true, default: 0 }, // Qty reserved for orders
    available_quantity: { 
      type: "integer", 
      notNull: true, 
      default: 0,
      check: "available_quantity = quantity - reserved_quantity" 
    },
    minimum_stock_level: { type: "integer", default: 0 }, // Reorder point
    maximum_stock_level: { type: "integer" }, // Maximum inventory level
    lot_number: { type: "varchar(100)" },
    serial_number: { type: "varchar(100)" },
    expiry_date: { type: "timestamp" },
    received_date: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'available',
      check: "status IN ('available', 'reserved', 'damaged', 'quarantine', 'expired', 'pending')" 
    },
    last_count_date: { type: "timestamp" }, // Last physical count date
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory locations
  pgm.createIndex("inventory_location", "warehouse_id");
  pgm.createIndex("inventory_location", "bin_id");
  pgm.createIndex("inventory_location", "product_id");
  pgm.createIndex("inventory_location", "variant_id");
  pgm.createIndex("inventory_location", "sku");
  pgm.createIndex("inventory_location", "quantity");
  pgm.createIndex("inventory_location", "reserved_quantity");
  pgm.createIndex("inventory_location", "available_quantity");
  pgm.createIndex("inventory_location", "status");
  pgm.createIndex("inventory_location", "lot_number");
  pgm.createIndex("inventory_location", "expiry_date");
  pgm.createIndex("inventory_location", ["warehouse_id", "bin_id", "product_id", "variant_id", "lot_number"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Insert a default warehouse
  pgm.sql(`
    INSERT INTO "warehouse" (
      name,
      code,
      description,
      is_active,
      is_default,
      is_fulfillment_center,
      is_return_center,
      address_line1,
      city,
      state,
      postal_code,
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
