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
  // Create the orders table as the main checkout entity
  pgm.createTable("order", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderNumber: { type: "varchar(100)", notNull: true, unique: true }, // Human-readable order number
    customerId: { type: "uuid", references: "customer" }, // Can be null for guest checkouts
    basketId: { type: "uuid", references: "basket" }, // The basket that was converted to this order
    status: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "pending", 
      check: "status IN ('pending', 'processing', 'on_hold', 'completed', 'shipped', 'cancelled', 'refunded', 'failed', 'draft')" 
    },
    currency: { type: "varchar(3)", notNull: true },
    locale: { type: "varchar(10)", notNull: true, default: 'en-US' },
    email: { type: "varchar(255)", notNull: true },
    phoneNumber: { type: "varchar(100)" },
    ipAddress: { type: "varchar(50)" },
    userAgent: { type: "text" },
    subtotal: { type: "decimal(15,2)", notNull: true },
    taxAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    shippingAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    discountAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    grandTotal: { type: "decimal(15,2)", notNull: true },
    taxIncluded: { type: "boolean", notNull: true, default: false },
    notes: { type: "text" }, // Customer and/or admin notes
    customerNote: { type: "text" }, // Specific notes from the customer
    adminNote: { type: "text" }, // Specific notes from administrators
    giftMessage: { type: "text" }, // Optional gift message
    couponCodes: { type: "text[]" }, // Array of applied coupon codes
    referralCode: { type: "varchar(100)" }, // Referral code if order came from a referral
    source: { type: "varchar(100)", notNull: true, default: 'website' }, // website, mobile_app, pos, phone, etc.
    requiresShipping: { type: "boolean", notNull: true, default: true },
    shippingMethod: { type: "varchar(100)" }, // Selected shipping method
    estimatedDeliveryDate: { type: "timestamp" },
    completedAt: { type: "timestamp" }, // When the order was marked as completed
    cancelledAt: { type: "timestamp" }, // When the order was cancelled
    refundedAt: { type: "timestamp" }, // When the order was refunded
    metaData: { type: "jsonb" }, // Additional metadata for extensibility
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for efficient order querying
  pgm.createIndex("order", "orderNumber");
  pgm.createIndex("order", "customerId");
  pgm.createIndex("order", "basketId");
  pgm.createIndex("order", "status");
  pgm.createIndex("order", "email");
  pgm.createIndex("order", "createdAt");
  pgm.createIndex("order", "updatedAt");

  // Create the order items table to store line items
  pgm.createTable("order_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    basketItemId: { type: "uuid", references: "basket_item" }, // Optional reference to original basket item
    productId: { type: "uuid", notNull: true }, // Reference to product (not enforced with FK to allow product deletion)
    variantId: { type: "uuid" }, // Reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    quantity: { type: "integer", notNull: true, default: 1 },
    unitPrice: { type: "decimal(15,2)", notNull: true },
    subtotal: { type: "decimal(15,2)", notNull: true },
    taxAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    discountAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    total: { type: "decimal(15,2)", notNull: true },
    weight: { type: "decimal(10,3)" }, // For shipping calculations
    options: { type: "jsonb" }, // Product options/customizations
    imageUrl: { type: "text" },
    downloadable: { type: "boolean", notNull: true, default: false },
    taxable: { type: "boolean", notNull: true, default: true },
    taxClass: { type: "varchar(100)" },
    fulfillmentStatus: { 
      type: "varchar(50)", 
      default: "unfulfilled", 
      check: "fulfillmentStatus IN ('unfulfilled', 'fulfilled', 'partially_fulfilled', 'backordered', 'returned', 'exchanged')" 
    },
    metaData: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order items
  pgm.createIndex("order_item", "orderId");
  pgm.createIndex("order_item", "productId");
  pgm.createIndex("order_item", "sku");
  pgm.createIndex("order_item", "fulfillmentStatus");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("order_item");
  pgm.dropTable("order");
};
