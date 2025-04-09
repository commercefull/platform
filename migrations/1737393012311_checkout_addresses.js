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
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    customerAddressId: { type: "uuid", references: "customer_address" }, // Optional link to saved customer address
    addressType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "addressType IN ('billing', 'shipping')" 
    },
    firstName: { type: "varchar(100)", notNull: true },
    lastName: { type: "varchar(100)", notNull: true },
    company: { type: "varchar(255)" },
    addressLine1: { type: "varchar(255)", notNull: true },
    addressLine2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)", notNull: true },
    postalCode: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    phoneNumber: { type: "varchar(50)" },
    email: { type: "varchar(255)" },
    isDefault: { type: "boolean", notNull: true, default: false },
    validatedAt: { type: "timestamp" }, // When the address was validated with external service
    additionalInfo: { type: "text" }, // Additional delivery instructions
    metaData: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order addresses
  pgm.createIndex("order_address", "orderId");
  pgm.createIndex("order_address", "customerAddressId");
  pgm.createIndex("order_address", ["orderId", "addressType"], { unique: true });

  // Create a checkout session table for tracking incomplete checkouts
  pgm.createTable("checkout_session", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    sessionId: { type: "varchar(255)", notNull: true, unique: true }, // Client-side session identifier
    basketId: { type: "uuid", notNull: true, references: "basket" },
    customerId: { type: "uuid", references: "customer" }, // Optional for guest checkouts
    email: { type: "varchar(255)", notNull: true },
    phoneNumber: { type: "varchar(50)" },
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
    shippingAddressId: { type: "uuid", references: "order_address" },
    billingAddressId: { type: "uuid", references: "order_address" },
    sameBillingAsShipping: { type: "boolean", notNull: true, default: true },
    selectedShippingMethodId: { type: "varchar(100)" },
    shippingCalculated: { type: "boolean", notNull: true, default: false },
    taxesCalculated: { type: "boolean", notNull: true, default: false },
    agreeToTerms: { type: "boolean", notNull: true, default: false },
    agreeToMarketing: { type: "boolean", notNull: true, default: false },
    notes: { type: "text" },
    ipAddress: { type: "varchar(50)" },
    userAgent: { type: "text" },
    referrer: { type: "text" },
    convertedToOrderId: { type: "uuid", references: "order" },
    expiresAt: { type: "timestamp" },
    metaData: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    lastActivityAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for checkout session
  pgm.createIndex("checkout_session", "sessionId");
  pgm.createIndex("checkout_session", "basketId");
  pgm.createIndex("checkout_session", "customerId");
  pgm.createIndex("checkout_session", "email");
  pgm.createIndex("checkout_session", "status");
  pgm.createIndex("checkout_session", "step");
  pgm.createIndex("checkout_session", "convertedToOrderId");
  pgm.createIndex("checkout_session", "expiresAt");
  pgm.createIndex("checkout_session", "lastActivityAt");
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
