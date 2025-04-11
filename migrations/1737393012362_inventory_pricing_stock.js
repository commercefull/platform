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
    is_active: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // For handling conflicts between lists
    customer_group: { type: "text" }, // Customer group this applies to
    valid_from: { type: "timestamp" }, // Start date of validity
    valid_to: { type: "timestamp" }, // End date of validity
    currency_code: { type: "varchar(3)", notNull: true, default: 'USD' },
    price_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'fixed',
      check: "price_type IN ('fixed', 'percentage_discount', 'percentage_markup')" 
    },
    base_on: { 
      type: "varchar(20)", 
      default: 'original',
      check: "base_on IN ('original', 'cost', 'msrp')" 
    },
    percentage_value: { type: "decimal(10,4)" }, // For percentage discount/markup
    min_quantity: { type: "integer", default: 1 }, // Minimum quantity for this price list
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for price lists
  pgm.createIndex("price_list", "code");
  pgm.createIndex("price_list", "is_active");
  pgm.createIndex("price_list", "priority");
  pgm.createIndex("price_list", "customer_group");
  pgm.createIndex("price_list", "valid_from");
  pgm.createIndex("price_list", "valid_to");
  pgm.createIndex("price_list", "currency_code");
  pgm.createIndex("price_list", "price_type");
  pgm.createIndex("price_list", "min_quantity");

  // Create product price table for price rules
  pgm.createTable("product_price", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    price_list_id: { type: "uuid", notNull: true, references: "price_list", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    price: { type: "decimal(15,2)", notNull: true },
    sale_price: { type: "decimal(15,2)" },
    min_quantity: { type: "integer", default: 1 }, // Tiered pricing minimum
    max_quantity: { type: "integer" }, // Tiered pricing maximum
    valid_from: { type: "timestamp" }, // Start date of validity
    valid_to: { type: "timestamp" }, // End date of validity
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for product prices
  pgm.createIndex("product_price", "price_list_id");
  pgm.createIndex("product_price", "product_id");
  pgm.createIndex("product_price", "variant_id");
  pgm.createIndex("product_price", "price");
  pgm.createIndex("product_price", "sale_price");
  pgm.createIndex("product_price", "min_quantity");
  pgm.createIndex("product_price", "max_quantity");
  pgm.createIndex("product_price", "valid_from");
  pgm.createIndex("product_price", "valid_to");

  // Create a unique constraint for product/variant in a price list with a specific tier
  pgm.createIndex("product_price", ["price_list_id", "product_id", "variant_id", "min_quantity"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Create inventory level table for tracking stock across different warehouses
  pgm.createTable("inventory_level", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    is_tracked: { type: "boolean", notNull: true, default: true }, // Whether to track inventory
    is_backorderable: { type: "boolean", notNull: true, default: false }, // Allow backorders
    is_purchasable_out_of_stock: { type: "boolean", notNull: true, default: false }, // Can purchase when out of stock
    available_quantity: { type: "integer", notNull: true, default: 0 }, // Available for sale
    on_hand_quantity: { type: "integer", notNull: true, default: 0 }, // Physical inventory
    allocated_quantity: { type: "integer", notNull: true, default: 0 }, // Reserved for orders
    reserved_quantity: { type: "integer", notNull: true, default: 0 }, // Reserved by customers
    min_stock_level: { type: "integer", default: 0 }, // Reorder level
    max_stock_level: { type: "integer" }, // Max desired stock
    reorder_quantity: { type: "integer" }, // Amount to reorder
    reorder_status: { 
      type: "varchar(20)", 
      default: 'none',
      check: "reorder_status IN ('none', 'pending', 'ordered', 'received')" 
    },
    reorder_date: { type: "timestamp" }, // When reorder was triggered
    stock_status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'in_stock',
      check: "stock_status IN ('in_stock', 'out_of_stock', 'low_stock', 'backorder', 'preorder')" 
    },
    bin_location: { type: "varchar(100)" }, // Storage location code
    low_stock_notification_sent: { type: "boolean", notNull: true, default: false },
    metric_weight: { type: "decimal(10,3)" }, // Weight of inventory in kg
    serial_number_tracking: { type: "boolean", notNull: true, default: false }, // Track by serial number
    lot_number_tracking: { type: "boolean", notNull: true, default: false }, // Track by lot/batch
    expiry_date_tracking: { type: "boolean", notNull: true, default: false }, // Track expiry dates
    last_counted_at: { type: "timestamp" }, // Last inventory count date
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" }
  });

  // Create indexes for inventory levels
  pgm.createIndex("inventory_level", "product_id");
  pgm.createIndex("inventory_level", "variant_id");
  pgm.createIndex("inventory_level", "warehouse_id");
  pgm.createIndex("inventory_level", "available_quantity");
  pgm.createIndex("inventory_level", "on_hand_quantity");
  pgm.createIndex("inventory_level", "allocated_quantity");
  pgm.createIndex("inventory_level", "reserved_quantity");
  pgm.createIndex("inventory_level", "stock_status");
  pgm.createIndex("inventory_level", "min_stock_level");
  pgm.createIndex("inventory_level", "reorder_status");
  pgm.createIndex("inventory_level", "bin_location");

  // Create unique constraint for product/variant at warehouse
  pgm.createIndex("inventory_level", ["product_id", "variant_id", "warehouse_id"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Create stock reservation table
  pgm.createTable("stock_reservation", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true },
    reservation_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "reservation_type IN ('cart', 'order', 'pending', 'custom')" 
    },
    reference_id: { type: "uuid" }, // ID of cart/order/etc.
    reference_type: { type: "varchar(50)" }, // Type of reference (cart, order, etc.)
    expires_at: { type: "timestamp" }, // When reservation expires (for cart)
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for stock reservations
  pgm.createIndex("stock_reservation", "product_id");
  pgm.createIndex("stock_reservation", "variant_id");
  pgm.createIndex("stock_reservation", "warehouse_id");
  pgm.createIndex("stock_reservation", "quantity");
  pgm.createIndex("stock_reservation", "reservation_type");
  pgm.createIndex("stock_reservation", "reference_id");
  pgm.createIndex("stock_reservation", "reference_type");
  pgm.createIndex("stock_reservation", "expires_at");

  // Create lot tracking table for batch/lot inventory
  pgm.createTable("inventory_lot", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    bin_id: { type: "uuid", references: "warehouse_bin" },
    lot_number: { type: "varchar(100)", notNull: true },
    serial_numbers: { type: "text[]" }, // Array of serial numbers in this lot
    quantity: { type: "integer", notNull: true, default: 0 },
    expiry_date: { type: "timestamp" },
    manufacturing_date: { type: "timestamp" },
    receipt_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    supplier_lot_number: { type: "varchar(100)" }, // Supplier's own lot number
    supplier_id: { type: "uuid", references: "supplier" }, // Link to supplier
    purchase_order_id: { type: "uuid", references: "purchase_order" }, // Link to purchase order
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'available',
      check: "status IN ('available', 'reserved', 'allocated', 'quarantine', 'expired', 'consumed')" 
    },
    cost: { type: "decimal(15,2)" }, // Cost of this specific lot
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for inventory lots
  pgm.createIndex("inventory_lot", "product_id");
  pgm.createIndex("inventory_lot", "variant_id");
  pgm.createIndex("inventory_lot", "warehouse_id");
  pgm.createIndex("inventory_lot", "bin_id");
  pgm.createIndex("inventory_lot", "lot_number");
  pgm.createIndex("inventory_lot", "expiry_date");
  pgm.createIndex("inventory_lot", "quantity");
  pgm.createIndex("inventory_lot", "status");
  pgm.createIndex("inventory_lot", "supplier_id");
  pgm.createIndex("inventory_lot", "purchase_order_id");
  pgm.createIndex("inventory_lot", "serial_numbers", { method: "gin" });

  // Create a unique constraint for product + warehouse + lot number
  pgm.createIndex("inventory_lot", ["product_id", "variant_id", "warehouse_id", "lot_number"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Create low stock notification table
  pgm.createTable("low_stock_notification", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse", onDelete: "CASCADE" },
    threshold: { type: "integer", notNull: true }, // Threshold that triggered notification
    current_quantity: { type: "integer", notNull: true }, // Stock level at time of notification
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'new',
      check: "status IN ('new', 'acknowledged', 'resolved', 'ignored')" 
    },
    notified_users: { type: "text[]" }, // Who was notified
    resolved_at: { type: "timestamp" },
    resolved_by: { type: "uuid" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for low stock notifications
  pgm.createIndex("low_stock_notification", "product_id");
  pgm.createIndex("low_stock_notification", "variant_id");
  pgm.createIndex("low_stock_notification", "warehouse_id");
  pgm.createIndex("low_stock_notification", "threshold");
  pgm.createIndex("low_stock_notification", "current_quantity");
  pgm.createIndex("low_stock_notification", "status");
  pgm.createIndex("low_stock_notification", "created_at");
  pgm.createIndex("low_stock_notification", "resolved_at");

  // Insert default price list
  pgm.sql(`
    INSERT INTO "price_list" (
      name, 
      code, 
      description, 
      is_active, 
      priority,
      price_type,
      currency_code
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
      product_id,
      warehouse_id,
      is_tracked,
      available_quantity,
      on_hand_quantity,
      stock_status,
      min_stock_level
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
