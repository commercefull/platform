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
  // Create a fulfillment table to track order shipments and fulfillments
  pgm.createTable("order_fulfillment", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    fulfillment_number: { type: "varchar(100)", notNull: true },
    type: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "shipping", 
      check: "type IN ('shipping', 'pickup', 'digital', 'service')" 
    },
    status: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "pending", 
      check: "status IN ('pending', 'processing', 'shipped', 'delivered', 'failed', 'cancelled')" 
    },
    tracking_number: { type: "varchar(255)" },
    tracking_url: { type: "text" },
    carrier_code: { type: "varchar(100)" }, // ups, fedex, usps, etc.
    carrier_name: { type: "varchar(255)" },
    shipping_method: { type: "varchar(255)" },
    shipping_address_id: { type: "uuid", references: "order_address" },
    weight: { type: "decimal(10,3)" },
    weight_unit: { type: "varchar(10)", default: "kg" },
    dimensions: { type: "jsonb" }, // {length, width, height, unit}
    package_count: { type: "integer", default: 1 },
    shipped_at: { type: "timestamp" },
    delivered_at: { type: "timestamp" },
    estimated_delivery_date: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    fulfilled_by: { type: "uuid" }, // User ID who processed the fulfillment
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order fulfillment
  pgm.createIndex("order_fulfillment", "order_id");
  pgm.createIndex("order_fulfillment", "fulfillment_number");
  pgm.createIndex("order_fulfillment", "status");
  pgm.createIndex("order_fulfillment", "tracking_number");
  pgm.createIndex("order_fulfillment", "carrier_code");

  // Create a fulfillment item table to track which items are in which fulfillment
  pgm.createTable("order_fulfillment_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    fulfillment_id: { type: "uuid", notNull: true, references: "order_fulfillment", onDelete: "CASCADE" },
    order_item_id: { type: "uuid", notNull: true, references: "order_item", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true, default: 1 },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for fulfillment items
  pgm.createIndex("order_fulfillment_item", "fulfillment_id");
  pgm.createIndex("order_fulfillment_item", "order_item_id");
  
  // Create unique constraint to ensure an item can't be added to the same fulfillment multiple times
  pgm.createIndex("order_fulfillment_item", ["fulfillment_id", "order_item_id"], { unique: true });

  // Create order discount table to track applied discounts
  pgm.createTable("order_discount", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    code: { type: "varchar(100)" }, // Coupon code if applicable
    type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "type IN ('coupon', 'promotion', 'automatic', 'loyalty', 'referral', 'manual')" 
    },
    description: { type: "varchar(255)", notNull: true },
    value: { type: "decimal(15,2)", notNull: true },
    is_percentage: { type: "boolean", notNull: true, default: false },
    target_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "target_type IN ('order', 'item', 'shipping')"
    },
    target_id: { type: "uuid" }, // For item-specific discounts, references order_item.id
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order discounts
  pgm.createIndex("order_discount", "order_id");
  pgm.createIndex("order_discount", "code");
  pgm.createIndex("order_discount", "type");
  pgm.createIndex("order_discount", "target_id");

  // Create an order status history table to track order status changes
  pgm.createTable("order_status_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    previous_status: { type: "varchar(50)" },
    new_status: { type: "varchar(50)", notNull: true },
    comment: { type: "text" },
    changed_by: { type: "uuid" }, // User ID who changed the status
    notify_customer: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order status history
  pgm.createIndex("order_status_history", "order_id");
  pgm.createIndex("order_status_history", "new_status");
  pgm.createIndex("order_status_history", "created_at");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("order_status_history");
  pgm.dropTable("order_discount");
  pgm.dropTable("order_fulfillment_item");
  pgm.dropTable("order_fulfillment");
};
