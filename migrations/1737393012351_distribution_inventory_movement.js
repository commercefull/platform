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
  // Create inventory transaction types table
  pgm.createTable("inventory_transaction_type", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    code: { type: "varchar(20)", notNull: true, unique: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    affects_available: { type: "boolean", notNull: true, default: true }, // Affects available quantity
    direction: { 
      type: "varchar(10)", 
      notNull: true, 
      check: "direction IN ('in', 'out', 'transfer', 'adjust')" 
    },
    requires_approval: { type: "boolean", notNull: true, default: false },
    requires_documentation: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory transaction types
  pgm.createIndex("inventory_transaction_type", "code");
  pgm.createIndex("inventory_transaction_type", "direction");
  pgm.createIndex("inventory_transaction_type", "affects_available");

  // Create inventory transactions table for tracking all inventory movements
  pgm.createTable("inventory_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    type_id: { type: "uuid", notNull: true, references: "inventory_transaction_type" },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse" },
    bin_id: { type: "uuid", references: "warehouse_bin" }, // Optional specific bin
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    quantity: { type: "integer", notNull: true }, // Positive or negative quantity
    previous_quantity: { type: "integer" }, // Quantity before transaction
    new_quantity: { type: "integer" }, // Quantity after transaction
    reference_type: { type: "varchar(50)" }, // E.g., 'order', 'return', 'transfer'
    reference_id: { type: "uuid" }, // ID of the reference object
    lot_number: { type: "varchar(100)" },
    serial_number: { type: "varchar(100)" },
    expiry_date: { type: "timestamp" },
    notes: { type: "text" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'completed',
      check: "status IN ('pending', 'completed', 'cancelled', 'rejected')" 
    },
    reason: { type: "varchar(255)" }, // Reason for adjustment, returns, etc.
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // User who performed transaction
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    approved_at: { type: "timestamp" },
    approved_by: { type: "uuid" } // User who approved transaction
  });

  // Create indexes for inventory transactions
  pgm.createIndex("inventory_transaction", "type_id");
  pgm.createIndex("inventory_transaction", "warehouse_id");
  pgm.createIndex("inventory_transaction", "bin_id");
  pgm.createIndex("inventory_transaction", "product_id");
  pgm.createIndex("inventory_transaction", "variant_id");
  pgm.createIndex("inventory_transaction", "sku");
  pgm.createIndex("inventory_transaction", "reference_type");
  pgm.createIndex("inventory_transaction", "reference_id");
  pgm.createIndex("inventory_transaction", "lot_number");
  pgm.createIndex("inventory_transaction", "status");
  pgm.createIndex("inventory_transaction", "created_at");

  // Create inventory transfer table for tracking stock movements between warehouses
  pgm.createTable("inventory_transfer", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    reference_number: { type: "varchar(50)", unique: true }, // Transfer reference number
    source_warehouse_id: { type: "uuid", notNull: true, references: "warehouse" },
    source_bin_id: { type: "uuid", references: "warehouse_bin" },
    destination_warehouse_id: { type: "uuid", notNull: true, references: "warehouse" },
    destination_bin_id: { type: "uuid", references: "warehouse_bin" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'in_transit', 'partially_received', 'completed', 'cancelled')" 
    },
    transfer_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'standard',
      check: "transfer_type IN ('standard', 'return', 'rebalance', 'emergency')" 
    },
    priority: { 
      type: "varchar(10)", 
      notNull: true, 
      default: 'normal',
      check: "priority IN ('low', 'normal', 'high', 'urgent')" 
    },
    scheduled_date: { type: "timestamp" }, // When transfer should occur
    notes: { type: "text" },
    shipping_carrier: { type: "varchar(100)" },
    tracking_number: { type: "varchar(100)" },
    expected_delivery_date: { type: "timestamp" },
    actual_delivery_date: { type: "timestamp" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" },
    completed_at: { type: "timestamp" },
    completed_by: { type: "uuid" }
  });

  // Create indexes for inventory transfers
  pgm.createIndex("inventory_transfer", "reference_number");
  pgm.createIndex("inventory_transfer", "source_warehouse_id");
  pgm.createIndex("inventory_transfer", "destination_warehouse_id");
  pgm.createIndex("inventory_transfer", "status");
  pgm.createIndex("inventory_transfer", "transfer_type");
  pgm.createIndex("inventory_transfer", "priority");
  pgm.createIndex("inventory_transfer", "scheduled_date");
  pgm.createIndex("inventory_transfer", "created_at");

  // Create inventory transfer items table
  pgm.createTable("inventory_transfer_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    transfer_id: { type: "uuid", notNull: true, references: "inventory_transfer", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    quantity: { type: "integer", notNull: true },
    received_quantity: { type: "integer", default: 0 },
    lot_number: { type: "varchar(100)" },
    serial_number: { type: "varchar(100)" },
    expiry_date: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'in_transit', 'partially_received', 'received', 'cancelled')" 
    },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory transfer items
  pgm.createIndex("inventory_transfer_item", "transfer_id");
  pgm.createIndex("inventory_transfer_item", "product_id");
  pgm.createIndex("inventory_transfer_item", "variant_id");
  pgm.createIndex("inventory_transfer_item", "sku");
  pgm.createIndex("inventory_transfer_item", "status");
  pgm.createIndex("inventory_transfer_item", "lot_number");

  // Create inventory count table for physical inventory counts
  pgm.createTable("inventory_count", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse" },
    reference_number: { type: "varchar(50)", unique: true }, // Count reference number
    count_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "count_type IN ('full', 'cycle', 'spot', 'blind', 'audit')" 
    },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'in_progress', 'completed', 'cancelled', 'reconciled')" 
    },
    scheduled_date: { type: "timestamp" },
    start_date: { type: "timestamp" },
    end_date: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" },
    completed_at: { type: "timestamp" },
    completed_by: { type: "uuid" }
  });

  // Create indexes for inventory counts
  pgm.createIndex("inventory_count", "warehouse_id");
  pgm.createIndex("inventory_count", "reference_number");
  pgm.createIndex("inventory_count", "count_type");
  pgm.createIndex("inventory_count", "status");
  pgm.createIndex("inventory_count", "scheduled_date");
  pgm.createIndex("inventory_count", "start_date");
  pgm.createIndex("inventory_count", "end_date");
  pgm.createIndex("inventory_count", "created_at");

  // Create inventory count items table
  pgm.createTable("inventory_count_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    count_id: { type: "uuid", notNull: true, references: "inventory_count", onDelete: "CASCADE" },
    bin_id: { type: "uuid", references: "warehouse_bin" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    expected_quantity: { type: "integer" }, // System quantity before count
    counted_quantity: { type: "integer" }, // Actual counted quantity
    adjustment_quantity: { type: "integer" }, // Difference (counted - expected)
    lot_number: { type: "varchar(100)" },
    serial_number: { type: "varchar(100)" },
    expiry_date: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'counted', 'verified', 'adjusted', 'skipped')" 
    },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    counted_at: { type: "timestamp" },
    counted_by: { type: "uuid" },
    verified_at: { type: "timestamp" },
    verified_by: { type: "uuid" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory count items
  pgm.createIndex("inventory_count_item", "count_id");
  pgm.createIndex("inventory_count_item", "bin_id");
  pgm.createIndex("inventory_count_item", "product_id");
  pgm.createIndex("inventory_count_item", "variant_id");
  pgm.createIndex("inventory_count_item", "sku");
  pgm.createIndex("inventory_count_item", "status");
  pgm.createIndex("inventory_count_item", "lot_number");
  pgm.createIndex("inventory_count_item", "counted_at");

  // Create distribution inventory movement table
  pgm.createTable("distribution_inventory_movement", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    from_location_id: { type: "uuid", references: "inventory_location" }, // Where inventory moved from
    to_location_id: { type: "uuid", references: "inventory_location" }, // Where inventory moved to
    quantity: { type: "integer", notNull: true },
    reason: { type: "varchar(50)" }, // Reason for movement (e.g., 'transfer', 'return', 'adjustment')
    reference: { type: "varchar(255)" }, // Reference number (e.g., RMA number, transfer order number)
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" }
  });

  // Create indexes for inventory movements
  pgm.createIndex("distribution_inventory_movement", "warehouse_id");
  pgm.createIndex("distribution_inventory_movement", "product_id");
  pgm.createIndex("distribution_inventory_movement", "variant_id");
  pgm.createIndex("distribution_inventory_movement", "from_location_id");
  pgm.createIndex("distribution_inventory_movement", "to_location_id");

  // Insert default inventory transaction types
  pgm.sql(`
    INSERT INTO "inventory_transaction_type" (code, name, description, affects_available, direction)
    VALUES 
      ('RECEIVE', 'Receive Stock', 'Receiving new inventory', true, 'in'),
      ('SHIP', 'Ship Order', 'Shipping products for orders', true, 'out'),
      ('ADJUST_UP', 'Adjust Up', 'Positive inventory adjustment', true, 'adjust'),
      ('ADJUST_DOWN', 'Adjust Down', 'Negative inventory adjustment', true, 'adjust'),
      ('TRANSFER_OUT', 'Transfer Out', 'Transfer to another warehouse', true, 'out'),
      ('TRANSFER_IN', 'Transfer In', 'Transfer from another warehouse', true, 'in'),
      ('RETURN', 'Customer Return', 'Return from customer', true, 'in'),
      ('DAMAGE', 'Damage Write-Off', 'Inventory lost to damage', true, 'out'),
      ('EXPIRE', 'Expiry Write-Off', 'Inventory expired', true, 'out'),
      ('RESERVE', 'Reserve Stock', 'Reserve inventory for orders', false, 'adjust'),
      ('UNRESERVE', 'Unreserve Stock', 'Release reserved inventory', false, 'adjust'),
      ('COUNT', 'Inventory Count', 'Adjustment from physical count', true, 'adjust')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("distribution_inventory_movement");
  pgm.dropTable("inventory_count_item");
  pgm.dropTable("inventory_count");
  pgm.dropTable("inventory_transfer_item");
  pgm.dropTable("inventory_transfer");
  pgm.dropTable("inventory_transaction");
  pgm.dropTable("inventory_transaction_type");
};
