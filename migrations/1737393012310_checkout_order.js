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
    order_number: { type: "varchar(100)", notNull: true, unique: true }, // Human-readable order number
    customer_id: { type: "uuid", references: "customer" }, // Can be null for guest checkouts
    basket_id: { type: "uuid", references: "basket" }, // The basket that was converted to this order
    status: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "pending", 
      check: "status IN ('pending', 'processing', 'on_hold', 'completed', 'shipped', 'cancelled', 'refunded', 'failed', 'draft')" 
    },
    currency: { type: "varchar(3)", notNull: true },
    locale: { type: "varchar(10)", notNull: true, default: 'en-US' },
    email: { type: "varchar(255)", notNull: true },
    phone_number: { type: "varchar(100)" },
    ip_address: { type: "varchar(50)" },
    user_agent: { type: "text" },
    subtotal: { type: "decimal(15,2)", notNull: true },
    tax_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    shipping_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    discount_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    grand_total: { type: "decimal(15,2)", notNull: true },
    tax_included: { type: "boolean", notNull: true, default: false },
    notes: { type: "text" }, // Customer and/or admin notes
    customer_note: { type: "text" }, // Specific notes from the customer
    admin_note: { type: "text" }, // Specific notes from administrators
    gift_message: { type: "text" }, // Optional gift message
    coupon_codes: { type: "text[]" }, // Array of applied coupon codes
    referral_code: { type: "varchar(100)" }, // Referral code if order came from a referral
    source: { type: "varchar(100)", notNull: true, default: 'website' }, // website, mobile_app, pos, phone, etc.
    requires_shipping: { type: "boolean", notNull: true, default: true },
    shipping_method: { type: "varchar(100)" }, // Selected shipping method
    estimated_delivery_date: { type: "timestamp" },
    completed_at: { type: "timestamp" }, // When the order was marked as completed
    cancelled_at: { type: "timestamp" }, // When the order was cancelled
    refunded_at: { type: "timestamp" }, // When the order was refunded
    meta_data: { type: "jsonb" }, // Additional metadata for extensibility
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for efficient order querying
  pgm.createIndex("order", "order_number");
  pgm.createIndex("order", "customer_id");
  pgm.createIndex("order", "basket_id");
  pgm.createIndex("order", "status");
  pgm.createIndex("order", "email");
  pgm.createIndex("order", "created_at");
  pgm.createIndex("order", "updated_at");

  // Create the order items table to store line items
  pgm.createTable("order_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    basket_item_id: { type: "uuid", references: "basket_item" }, // Optional reference to original basket item
    product_id: { type: "uuid", notNull: true }, // Reference to product (not enforced with FK to allow product deletion)
    variant_id: { type: "uuid" }, // Reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    quantity: { type: "integer", notNull: true, default: 1 },
    unit_price: { type: "decimal(15,2)", notNull: true },
    subtotal: { type: "decimal(15,2)", notNull: true },
    tax_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    discount_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    total: { type: "decimal(15,2)", notNull: true },
    weight: { type: "decimal(10,3)" }, // For shipping calculations
    options: { type: "jsonb" }, // Product options/customizations
    image_url: { type: "text" },
    downloadable: { type: "boolean", notNull: true, default: false },
    taxable: { type: "boolean", notNull: true, default: true },
    tax_class: { type: "varchar(100)" },
    fulfillment_status: { 
      type: "varchar(50)", 
      default: "unfulfilled", 
      check: "fulfillment_status IN ('unfulfilled', 'fulfilled', 'partially_fulfilled', 'backordered', 'returned', 'exchanged')" 
    },
    meta_data: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order items
  pgm.createIndex("order_item", "order_id");
  pgm.createIndex("order_item", "product_id");
  pgm.createIndex("order_item", "sku");
  pgm.createIndex("order_item", "fulfillment_status");
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
