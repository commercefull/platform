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
  // Create a payment method table to store saved payment methods
  pgm.createTable("payment_method", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer')" 
    },
    provider: { type: "varchar(100)", notNull: true }, // stripe, paypal, etc.
    token: { type: "varchar(255)" }, // Token from payment provider
    gateway_customer_id: { type: "varchar(255)" }, // Customer ID in the payment provider
    gateway_payment_method_id: { type: "varchar(255)" }, // Payment method ID in the payment provider
    masked_number: { type: "varchar(30)" }, // Last 4 digits for cards
    card_type: { type: "varchar(50)" }, // visa, mastercard, etc.
    expiry_month: { type: "integer", check: "expiry_month >= 1 AND expiry_month <= 12" },
    expiry_year: { type: "integer" },
    cardholder_name: { type: "varchar(255)" },
    is_default: { type: "boolean", notNull: true, default: false },
    billing_address_id: { type: "uuid", references: "customer_address" },
    meta_data: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment methods
  pgm.createIndex("payment_method", "customer_id");
  pgm.createIndex("payment_method", "type");
  pgm.createIndex("payment_method", "provider");
  pgm.createIndex("payment_method", "gateway_customer_id");
  pgm.createIndex("payment_method", "gateway_payment_method_id");

  // Create order payment table to track payments for orders
  pgm.createTable("order_payment", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    payment_method_id: { type: "uuid", references: "payment_method" }, // Optional link to saved payment method
    type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "type IN ('credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'crypto', 'gift_card', 'store_credit')" 
    },
    provider: { type: "varchar(100)", notNull: true }, // stripe, paypal, etc.
    amount: { type: "decimal(15,2)", notNull: true },
    currency: { type: "varchar(3)", notNull: true },
    status: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "pending", 
      check: "status IN ('pending', 'authorized', 'captured', 'refunded', 'partially_refunded', 'voided', 'failed')" 
    },
    transaction_id: { type: "varchar(255)" }, // ID from payment provider
    authorization_code: { type: "varchar(255)" },
    error_code: { type: "varchar(100)" },
    error_message: { type: "text" },
    metadata: { type: "jsonb" },
    masked_number: { type: "varchar(30)" }, // Last 4 digits for cards
    card_type: { type: "varchar(50)" }, // visa, mastercard, etc.
    gateway_response: { type: "jsonb" }, // Full response from payment gateway
    refunded_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    captured_at: { type: "timestamp" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order payments
  pgm.createIndex("order_payment", "order_id");
  pgm.createIndex("order_payment", "payment_method_id");
  pgm.createIndex("order_payment", "type");
  pgm.createIndex("order_payment", "provider");
  pgm.createIndex("order_payment", "status");
  pgm.createIndex("order_payment", "transaction_id");

  // Create order payment refund table
  pgm.createTable("order_payment_refund", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_payment_id: { type: "uuid", notNull: true, references: "order_payment", onDelete: "CASCADE" },
    amount: { type: "decimal(15,2)", notNull: true },
    reason: { type: "varchar(255)" },
    notes: { type: "text" },
    transaction_id: { type: "varchar(255)" }, // ID from payment provider
    status: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "pending", 
      check: "status IN ('pending', 'completed', 'failed')" 
    },
    gateway_response: { type: "jsonb" }, // Full response from payment gateway
    refunded_by: { type: "uuid" }, // User ID of admin who processed the refund
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for refunds
  pgm.createIndex("order_payment_refund", "order_payment_id");
  pgm.createIndex("order_payment_refund", "transaction_id");
  pgm.createIndex("order_payment_refund", "status");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("order_payment_refund");
  pgm.dropTable("order_payment");
  pgm.dropTable("payment_method");
};
