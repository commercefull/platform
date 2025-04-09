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
  // Create price list table for advanced price rules and customer-specific pricing
  pgm.createTable("price_list", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // For handling conflicts between lists
    customerGroup: { type: "text" }, // Customer group this applies to
    validFrom: { type: "timestamp" }, // Start date of validity
    validTo: { type: "timestamp" }, // End date of validity
    currencyCode: { type: "varchar(3)", notNull: true, default: 'USD' },
    priceType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'fixed',
      check: "priceType IN ('fixed', 'percentage_discount', 'percentage_markup')" 
    },
    baseOn: { 
      type: "varchar(20)", 
      default: 'original',
      check: "baseOn IN ('original', 'cost', 'msrp')" 
    },
    percentageValue: { type: "decimal(10,4)" }, // For percentage discount/markup
    minQuantity: { type: "integer", default: 1 }, // Minimum quantity for this price list
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for price lists
  pgm.createIndex("price_list", "code");
  pgm.createIndex("price_list", "isActive");
  pgm.createIndex("price_list", "priority");
  pgm.createIndex("price_list", "customerGroup");
  pgm.createIndex("price_list", "validFrom");
  pgm.createIndex("price_list", "validTo");
  pgm.createIndex("price_list", "currencyCode");
  pgm.createIndex("price_list", "priceType");
  pgm.createIndex("price_list", "minQuantity");

  // Create product price table for price rules
  pgm.createTable("product_price", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    priceListId: { type: "uuid", notNull: true, references: "price_list", onDelete: "CASCADE" },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    price: { type: "decimal(15,2)", notNull: true },
    salePrice: { type: "decimal(15,2)" },
    minQuantity: { type: "integer", default: 1 }, // Tiered pricing minimum
    maxQuantity: { type: "integer" }, // Tiered pricing maximum
    validFrom: { type: "timestamp" }, // Start date of validity
    validTo: { type: "timestamp" }, // End date of validity
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for product prices
  pgm.createIndex("product_price", "priceListId");
  pgm.createIndex("product_price", "productId");
  pgm.createIndex("product_price", "variantId");
  pgm.createIndex("product_price", "price");
  pgm.createIndex("product_price", "salePrice");
  pgm.createIndex("product_price", "minQuantity");
  pgm.createIndex("product_price", "maxQuantity");
  pgm.createIndex("product_price", "validFrom");
  pgm.createIndex("product_price", "validTo");

  // Create a unique constraint for product/variant in a price list with a specific tier
  pgm.createIndex("product_price", ["priceListId", "productId", "variantId", "minQuantity"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Create inventory level table for tracking stock across different warehouses
  pgm.createTable("inventory_level", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    isTracked: { type: "boolean", notNull: true, default: true }, // Whether to track inventory
    isBackorderable: { type: "boolean", notNull: true, default: false }, // Allow backorders
    isPurchasableOutOfStock: { type: "boolean", notNull: true, default: false }, // Can purchase when out of stock
    availableQuantity: { type: "integer", notNull: true, default: 0 }, // Available for sale
    onHandQuantity: { type: "integer", notNull: true, default: 0 }, // Physical inventory
    allocatedQuantity: { type: "integer", notNull: true, default: 0 }, // Reserved for orders
    reservedQuantity: { type: "integer", notNull: true, default: 0 }, // Reserved by customers
    minStockLevel: { type: "integer", default: 0 }, // Reorder level
    maxStockLevel: { type: "integer" }, // Max desired stock
    reorderQuantity: { type: "integer" }, // Amount to reorder
    reorderStatus: { 
      type: "varchar(20)", 
      default: 'none',
      check: "reorderStatus IN ('none', 'pending', 'ordered', 'received')" 
    },
    reorderDate: { type: "timestamp" }, // When reorder was triggered
    stockStatus: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'in_stock',
      check: "stockStatus IN ('in_stock', 'out_of_stock', 'low_stock', 'backorder', 'preorder')" 
    },
    binLocation: { type: "varchar(100)" }, // Storage location code
    lowStockNotificationSent: { type: "boolean", notNull: true, default: false },
    metricWeight: { type: "decimal(10,3)" }, // Weight of inventory in kg
    serialNumberTracking: { type: "boolean", notNull: true, default: false }, // Track by serial number
    lotNumberTracking: { type: "boolean", notNull: true, default: false }, // Track by lot/batch
    expiryDateTracking: { type: "boolean", notNull: true, default: false }, // Track expiry dates
    lastCountedAt: { type: "timestamp" }, // Last inventory count date
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" }
  });

  // Create indexes for inventory levels
  pgm.createIndex("inventory_level", "productId");
  pgm.createIndex("inventory_level", "variantId");
  pgm.createIndex("inventory_level", "warehouseId");
  pgm.createIndex("inventory_level", "availableQuantity");
  pgm.createIndex("inventory_level", "onHandQuantity");
  pgm.createIndex("inventory_level", "allocatedQuantity");
  pgm.createIndex("inventory_level", "reservedQuantity");
  pgm.createIndex("inventory_level", "stockStatus");
  pgm.createIndex("inventory_level", "minStockLevel");
  pgm.createIndex("inventory_level", "reorderStatus");
  pgm.createIndex("inventory_level", "binLocation");

  // Create unique constraint for product/variant at warehouse
  pgm.createIndex("inventory_level", ["productId", "variantId", "warehouseId"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Create stock reservation table
  pgm.createTable("stock_reservation", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true },
    reservationType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "reservationType IN ('cart', 'order', 'pending', 'custom')" 
    },
    referenceId: { type: "uuid" }, // ID of cart/order/etc.
    referenceType: { type: "varchar(50)" }, // Type of reference (cart, order, etc.)
    expiresAt: { type: "timestamp" }, // When reservation expires (for cart)
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for stock reservations
  pgm.createIndex("stock_reservation", "productId");
  pgm.createIndex("stock_reservation", "variantId");
  pgm.createIndex("stock_reservation", "warehouseId");
  pgm.createIndex("stock_reservation", "quantity");
  pgm.createIndex("stock_reservation", "reservationType");
  pgm.createIndex("stock_reservation", "referenceId");
  pgm.createIndex("stock_reservation", "referenceType");
  pgm.createIndex("stock_reservation", "expiresAt");

  // Create lot tracking table for batch/lot inventory
  pgm.createTable("inventory_lot", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    binId: { type: "uuid", references: "warehouse_bin" },
    lotNumber: { type: "varchar(100)", notNull: true },
    serialNumbers: { type: "text[]" }, // Array of serial numbers in this lot
    quantity: { type: "integer", notNull: true, default: 0 },
    expiryDate: { type: "timestamp" },
    manufacturingDate: { type: "timestamp" },
    receiptDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    supplierLotNumber: { type: "varchar(100)" }, // Supplier's own lot identifier
    supplierId: { type: "uuid", references: "supplier" }, // Link to supplier
    purchaseOrderId: { type: "uuid", references: "purchase_order" }, // Link to purchase order
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'available',
      check: "status IN ('available', 'reserved', 'allocated', 'quarantine', 'expired', 'consumed')" 
    },
    cost: { type: "decimal(15,2)" }, // Cost of this specific lot
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for inventory lots
  pgm.createIndex("inventory_lot", "productId");
  pgm.createIndex("inventory_lot", "variantId");
  pgm.createIndex("inventory_lot", "warehouseId");
  pgm.createIndex("inventory_lot", "binId");
  pgm.createIndex("inventory_lot", "lotNumber");
  pgm.createIndex("inventory_lot", "expiryDate");
  pgm.createIndex("inventory_lot", "quantity");
  pgm.createIndex("inventory_lot", "status");
  pgm.createIndex("inventory_lot", "supplierId");
  pgm.createIndex("inventory_lot", "purchaseOrderId");
  pgm.createIndex("inventory_lot", "serialNumbers", { method: "gin" });

  // Create a unique constraint for product + warehouse + lot number
  pgm.createIndex("inventory_lot", ["productId", "variantId", "warehouseId", "lotNumber"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Create low stock notification table
  pgm.createTable("low_stock_notification", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    threshold: { type: "integer", notNull: true }, // Threshold that triggered notification
    currentQuantity: { type: "integer", notNull: true }, // Stock level at time of notification
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'new',
      check: "status IN ('new', 'acknowledged', 'resolved', 'ignored')" 
    },
    notifiedUsers: { type: "text[]" }, // Who was notified
    resolvedAt: { type: "timestamp" },
    resolvedBy: { type: "uuid" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for low stock notifications
  pgm.createIndex("low_stock_notification", "productId");
  pgm.createIndex("low_stock_notification", "variantId");
  pgm.createIndex("low_stock_notification", "warehouseId");
  pgm.createIndex("low_stock_notification", "threshold");
  pgm.createIndex("low_stock_notification", "currentQuantity");
  pgm.createIndex("low_stock_notification", "status");
  pgm.createIndex("low_stock_notification", "createdAt");
  pgm.createIndex("low_stock_notification", "resolvedAt");

  // Insert default price list
  pgm.sql(`
    INSERT INTO "price_list" (
      name, 
      code, 
      description, 
      isActive, 
      priority,
      priceType,
      currencyCode
    )
    VALUES (
      'Retail', 
      'RETAIL', 
      'Standard retail prices', 
      true,
      100,
      'fixed',
      'USD'
    ),
    (
      'Wholesale', 
      'WHOLESALE', 
      'Wholesale customer prices', 
      true,
      200,
      'percentage_discount',
      'USD'
    )
  `);

  // Insert sample inventory level for the sample product
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE sku = 'SAMPLE-001'),
      main_warehouse AS (SELECT id FROM warehouse WHERE code = 'MAIN')
    INSERT INTO "inventory_level" (
      productId,
      warehouseId,
      isTracked,
      availableQuantity,
      onHandQuantity,
      stockStatus,
      minStockLevel
    )
    VALUES (
      (SELECT id FROM sample_product),
      (SELECT id FROM main_warehouse),
      true,
      100,
      100,
      'in_stock',
      10
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("low_stock_notification");
  pgm.dropTable("inventory_lot");
  pgm.dropTable("stock_reservation");
  pgm.dropTable("inventory_level");
  pgm.dropTable("product_price");
  pgm.dropTable("price_list");
};
