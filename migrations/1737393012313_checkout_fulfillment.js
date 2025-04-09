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
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    fulfillmentNumber: { type: "varchar(100)", notNull: true },
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
    trackingNumber: { type: "varchar(255)" },
    trackingUrl: { type: "text" },
    carrierCode: { type: "varchar(100)" }, // ups, fedex, usps, etc.
    carrierName: { type: "varchar(255)" },
    shippingMethod: { type: "varchar(255)" },
    shippingAddressId: { type: "uuid", references: "order_address" },
    weight: { type: "decimal(10,3)" },
    weightUnit: { type: "varchar(10)", default: "kg" },
    dimensions: { type: "jsonb" }, // {length, width, height, unit}
    packageCount: { type: "integer", default: 1 },
    shippedAt: { type: "timestamp" },
    deliveredAt: { type: "timestamp" },
    estimatedDeliveryDate: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    fulfilledBy: { type: "uuid" }, // User ID who processed the fulfillment
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order fulfillment
  pgm.createIndex("order_fulfillment", "orderId");
  pgm.createIndex("order_fulfillment", "fulfillmentNumber");
  pgm.createIndex("order_fulfillment", "status");
  pgm.createIndex("order_fulfillment", "trackingNumber");
  pgm.createIndex("order_fulfillment", "carrierCode");

  // Create a fulfillment item table to track which items are in which fulfillment
  pgm.createTable("order_fulfillment_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    fulfillmentId: { type: "uuid", notNull: true, references: "order_fulfillment", onDelete: "CASCADE" },
    orderItemId: { type: "uuid", notNull: true, references: "order_item", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true, default: 1 },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for fulfillment items
  pgm.createIndex("order_fulfillment_item", "fulfillmentId");
  pgm.createIndex("order_fulfillment_item", "orderItemId");
  
  // Create unique constraint to ensure an item can't be added to the same fulfillment multiple times
  pgm.createIndex("order_fulfillment_item", ["fulfillmentId", "orderItemId"], { unique: true });

  // Create order discount table to track applied discounts
  pgm.createTable("order_discount", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    code: { type: "varchar(100)" }, // Coupon code if applicable
    type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "type IN ('coupon', 'promotion', 'automatic', 'loyalty', 'referral', 'manual')" 
    },
    description: { type: "varchar(255)", notNull: true },
    value: { type: "decimal(15,2)", notNull: true },
    isPercentage: { type: "boolean", notNull: true, default: false },
    targetType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "targetType IN ('order', 'item', 'shipping')"
    },
    targetId: { type: "uuid" }, // For item-specific discounts, references order_item.id
    metaData: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order discounts
  pgm.createIndex("order_discount", "orderId");
  pgm.createIndex("order_discount", "code");
  pgm.createIndex("order_discount", "type");
  pgm.createIndex("order_discount", "targetId");

  // Create an order status history table to track order status changes
  pgm.createTable("order_status_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    previousStatus: { type: "varchar(50)" },
    newStatus: { type: "varchar(50)", notNull: true },
    comment: { type: "text" },
    changedBy: { type: "uuid" }, // User ID who changed the status
    notifyCustomer: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order status history
  pgm.createIndex("order_status_history", "orderId");
  pgm.createIndex("order_status_history", "newStatus");
  pgm.createIndex("order_status_history", "createdAt");
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
