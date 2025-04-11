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
  // Create order address table for storing shipping and billing addresses
  pgm.createTable("order_address", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    customer_address_id: { type: "uuid", references: "customer_address" }, // Optional link to saved customer address
    address_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "address_type IN ('billing', 'shipping')" 
    },
    first_name: { type: "varchar(100)", notNull: true },
    last_name: { type: "varchar(100)", notNull: true },
    company: { type: "varchar(255)" },
    address_line1: { type: "varchar(255)", notNull: true },
    address_line2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)", notNull: true },
    postal_code: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    phone_number: { type: "varchar(50)" },
    email: { type: "varchar(255)" },
    is_default: { type: "boolean", notNull: true, default: false },
    validated_at: { type: "timestamp" }, // When the address was validated with external service
    additional_info: { type: "text" }, // Additional delivery instructions
    meta_data: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order addresses
  pgm.createIndex("order_address", "order_id");
  pgm.createIndex("order_address", "customer_address_id");
  pgm.createIndex("order_address", ["order_id", "address_type"], { unique: true });

  // Create a checkout session table for tracking incomplete checkouts
  pgm.createTable("checkout_session", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    session_id: { type: "varchar(255)", notNull: true, unique: true }, // Client-side session identifier
    basket_id: { type: "uuid", notNull: true, references: "basket" },
    customer_id: { type: "uuid", references: "customer" }, // Optional for guest checkouts
    email: { type: "varchar(255)", notNull: true },
    phone_number: { type: "varchar(50)" },
    status: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "active", 
      check: "status IN ('active', 'completed', 'abandoned', 'expired')" 
    },
    step: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "cart", 
      check: "step IN ('cart', 'contact', 'shipping', 'billing', 'payment', 'review')" 
    },
    shipping_address_id: { type: "uuid", references: "order_address" },
    billing_address_id: { type: "uuid", references: "order_address" },
    same_billing_as_shipping: { type: "boolean", notNull: true, default: true },
    selected_shipping_method_id: { type: "varchar(100)" },
    shipping_calculated: { type: "boolean", notNull: true, default: false },
    taxes_calculated: { type: "boolean", notNull: true, default: false },
    agree_to_terms: { type: "boolean", notNull: true, default: false },
    agree_to_marketing: { type: "boolean", notNull: true, default: false },
    notes: { type: "text" },
    ip_address: { type: "varchar(50)" },
    user_agent: { type: "text" },
    referrer: { type: "text" },
    converted_to_order_id: { type: "uuid", references: "order" },
    expires_at: { type: "timestamp" },
    meta_data: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    last_activity_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for checkout session
  pgm.createIndex("checkout_session", "session_id");
  pgm.createIndex("checkout_session", "basket_id");
  pgm.createIndex("checkout_session", "customer_id");
  pgm.createIndex("checkout_session", "email");
  pgm.createIndex("checkout_session", "status");
  pgm.createIndex("checkout_session", "step");
  pgm.createIndex("checkout_session", "converted_to_order_id");
  pgm.createIndex("checkout_session", "expires_at");
  pgm.createIndex("checkout_session", "last_activity_at");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("checkout_session");
  pgm.dropTable("order_address");
};
