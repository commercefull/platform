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
    affectsAvailable: { type: "boolean", notNull: true, default: true }, // Affects available quantity
    direction: { 
      type: "varchar(10)", 
      notNull: true, 
      check: "direction IN ('in', 'out', 'transfer', 'adjust')" 
    },
    requiresApproval: { type: "boolean", notNull: true, default: false },
    requiresDocumentation: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory transaction types
  pgm.createIndex("inventory_transaction_type", "code");
  pgm.createIndex("inventory_transaction_type", "direction");
  pgm.createIndex("inventory_transaction_type", "affectsAvailable");

  // Create inventory transactions table for tracking all inventory movements
  pgm.createTable("inventory_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    typeId: { type: "uuid", notNull: true, references: "inventory_transaction_type" },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse" },
    binId: { type: "uuid", references: "warehouse_bin" }, // Optional specific bin
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    quantity: { type: "integer", notNull: true }, // Positive or negative quantity
    previousQuantity: { type: "integer" }, // Quantity before transaction
    newQuantity: { type: "integer" }, // Quantity after transaction
    referenceType: { type: "varchar(50)" }, // E.g., 'order', 'return', 'transfer'
    referenceId: { type: "uuid" }, // ID of the reference object
    lotNumber: { type: "varchar(100)" },
    serialNumber: { type: "varchar(100)" },
    expiryDate: { type: "timestamp" },
    notes: { type: "text" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'completed',
      check: "status IN ('pending', 'completed', 'cancelled', 'rejected')" 
    },
    reason: { type: "varchar(255)" }, // Reason for adjustment, returns, etc.
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }, // User who performed transaction
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    approvedAt: { type: "timestamp" },
    approvedBy: { type: "uuid" } // User who approved transaction
  });

  // Create indexes for inventory transactions
  pgm.createIndex("inventory_transaction", "typeId");
  pgm.createIndex("inventory_transaction", "warehouseId");
  pgm.createIndex("inventory_transaction", "binId");
  pgm.createIndex("inventory_transaction", "productId");
  pgm.createIndex("inventory_transaction", "variantId");
  pgm.createIndex("inventory_transaction", "sku");
  pgm.createIndex("inventory_transaction", "referenceType");
  pgm.createIndex("inventory_transaction", "referenceId");
  pgm.createIndex("inventory_transaction", "lotNumber");
  pgm.createIndex("inventory_transaction", "status");
  pgm.createIndex("inventory_transaction", "createdAt");

  // Create inventory transfer table for tracking stock movements between warehouses
  pgm.createTable("inventory_transfer", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    referenceNumber: { type: "varchar(50)", unique: true }, // Transfer reference number
    sourceWarehouseId: { type: "uuid", notNull: true, references: "warehouse" },
    sourceBinId: { type: "uuid", references: "warehouse_bin" },
    destinationWarehouseId: { type: "uuid", notNull: true, references: "warehouse" },
    destinationBinId: { type: "uuid", references: "warehouse_bin" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'in_transit', 'partially_received', 'completed', 'cancelled')" 
    },
    transferType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'standard',
      check: "transferType IN ('standard', 'return', 'rebalance', 'emergency')" 
    },
    priority: { 
      type: "varchar(10)", 
      notNull: true, 
      default: 'normal',
      check: "priority IN ('low', 'normal', 'high', 'urgent')" 
    },
    scheduledDate: { type: "timestamp" }, // When transfer should occur
    notes: { type: "text" },
    shippingCarrier: { type: "varchar(100)" },
    trackingNumber: { type: "varchar(100)" },
    expectedDeliveryDate: { type: "timestamp" },
    actualDeliveryDate: { type: "timestamp" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" },
    completedAt: { type: "timestamp" },
    completedBy: { type: "uuid" }
  });

  // Create indexes for inventory transfers
  pgm.createIndex("inventory_transfer", "referenceNumber");
  pgm.createIndex("inventory_transfer", "sourceWarehouseId");
  pgm.createIndex("inventory_transfer", "destinationWarehouseId");
  pgm.createIndex("inventory_transfer", "status");
  pgm.createIndex("inventory_transfer", "transferType");
  pgm.createIndex("inventory_transfer", "priority");
  pgm.createIndex("inventory_transfer", "scheduledDate");
  pgm.createIndex("inventory_transfer", "createdAt");

  // Create inventory transfer items table
  pgm.createTable("inventory_transfer_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    transferId: { type: "uuid", notNull: true, references: "inventory_transfer", onDelete: "CASCADE" },
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    quantity: { type: "integer", notNull: true },
    receivedQuantity: { type: "integer", default: 0 },
    lotNumber: { type: "varchar(100)" },
    serialNumber: { type: "varchar(100)" },
    expiryDate: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'in_transit', 'partially_received', 'received', 'cancelled')" 
    },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory transfer items
  pgm.createIndex("inventory_transfer_item", "transferId");
  pgm.createIndex("inventory_transfer_item", "productId");
  pgm.createIndex("inventory_transfer_item", "variantId");
  pgm.createIndex("inventory_transfer_item", "sku");
  pgm.createIndex("inventory_transfer_item", "status");
  pgm.createIndex("inventory_transfer_item", "lotNumber");

  // Create inventory count table for physical inventory counts
  pgm.createTable("inventory_count", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse" },
    referenceNumber: { type: "varchar(50)", unique: true }, // Count reference number
    countType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "countType IN ('full', 'cycle', 'spot', 'blind', 'audit')" 
    },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'in_progress', 'completed', 'cancelled', 'reconciled')" 
    },
    scheduledDate: { type: "timestamp" },
    startDate: { type: "timestamp" },
    endDate: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" },
    completedAt: { type: "timestamp" },
    completedBy: { type: "uuid" }
  });

  // Create indexes for inventory counts
  pgm.createIndex("inventory_count", "warehouseId");
  pgm.createIndex("inventory_count", "referenceNumber");
  pgm.createIndex("inventory_count", "countType");
  pgm.createIndex("inventory_count", "status");
  pgm.createIndex("inventory_count", "scheduledDate");
  pgm.createIndex("inventory_count", "startDate");
  pgm.createIndex("inventory_count", "endDate");
  pgm.createIndex("inventory_count", "createdAt");

  // Create inventory count items table
  pgm.createTable("inventory_count_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    countId: { type: "uuid", notNull: true, references: "inventory_count", onDelete: "CASCADE" },
    binId: { type: "uuid", references: "warehouse_bin" },
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    expectedQuantity: { type: "integer" }, // System quantity before count
    countedQuantity: { type: "integer" }, // Actual counted quantity
    adjustmentQuantity: { type: "integer" }, // Difference (counted - expected)
    lotNumber: { type: "varchar(100)" },
    serialNumber: { type: "varchar(100)" },
    expiryDate: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'counted', 'verified', 'adjusted', 'skipped')" 
    },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    countedAt: { type: "timestamp" },
    countedBy: { type: "uuid" },
    verifiedAt: { type: "timestamp" },
    verifiedBy: { type: "uuid" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory count items
  pgm.createIndex("inventory_count_item", "countId");
  pgm.createIndex("inventory_count_item", "binId");
  pgm.createIndex("inventory_count_item", "productId");
  pgm.createIndex("inventory_count_item", "variantId");
  pgm.createIndex("inventory_count_item", "sku");
  pgm.createIndex("inventory_count_item", "status");
  pgm.createIndex("inventory_count_item", "lotNumber");
  pgm.createIndex("inventory_count_item", "countedAt");

  // Insert default inventory transaction types
  pgm.sql(`
    INSERT INTO "inventory_transaction_type" (code, name, description, affectsAvailable, direction)
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
  pgm.dropTable("inventory_count_item");
  pgm.dropTable("inventory_count");
  pgm.dropTable("inventory_transfer_item");
  pgm.dropTable("inventory_transfer");
  pgm.dropTable("inventory_transaction");
  pgm.dropTable("inventory_transaction_type");
};
