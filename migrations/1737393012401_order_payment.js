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
  // Create payment method type enum
  pgm.createType("payment_method_type", [
    "credit_card",
    "debit_card",
    "paypal",
    "apple_pay",
    "google_pay",
    "bank_transfer",
    "gift_card",
    "store_credit",
    "crypto",
    "cash_on_delivery",
    "affirm",
    "klarna",
    "afterpay",
    "other"
  ]);

  // Create payment provider enum
  pgm.createType("payment_provider", [
    "stripe",
    "paypal",
    "braintree",
    "adyen",
    "square",
    "authorize_net",
    "worldpay",
    "internal", // For gift cards, store credit
    "manual", // For manually entered payments
    "other"
  ]);

  // Create order payment table
  pgm.createTable("order_payment", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    payment_method: { type: "payment_method_type", notNull: true },
    provider: { type: "payment_provider", notNull: true },
    status: { type: "payment_status", notNull: true, default: "pending" },
    transaction_id: { type: "varchar(255)" }, // Payment provider's transaction ID
    authorization_code: { type: "varchar(255)" }, // Authorization code from payment provider
    last_four: { type: "varchar(4)" }, // Last four digits of card
    card_type: { type: "varchar(50)" }, // Visa, Mastercard, etc.
    cardholder_name: { type: "varchar(255)" },
    expiry_month: { type: "varchar(2)" },
    expiry_year: { type: "varchar(4)" },
    billing_postal_code: { type: "varchar(20)" },
    billing_address_id: { type: "uuid", references: "customer_address" },
    billing_address: { type: "jsonb" }, // Copy of billing address at time of payment
    payment_intent_id: { type: "varchar(255)" }, // For providers like Stripe
    payment_method_id: { type: "varchar(255)" }, // Stored payment method ID
    customer_payment_profile_id: { type: "varchar(255)" }, // Customer's profile ID with payment provider
    error_code: { type: "varchar(100)" },
    error_message: { type: "text" },
    receipt_url: { type: "text" }, // URL to payment receipt
    metadata: { type: "jsonb" },
    captured_at: { type: "timestamp" },
    refunded_at: { type: "timestamp" },
    voided_at: { type: "timestamp" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order payments
  pgm.createIndex("order_payment", "order_id");
  pgm.createIndex("order_payment", "payment_method");
  pgm.createIndex("order_payment", "provider");
  pgm.createIndex("order_payment", "status");
  pgm.createIndex("order_payment", "transaction_id");
  pgm.createIndex("order_payment", "billing_address_id");
  pgm.createIndex("order_payment", "payment_intent_id");
  pgm.createIndex("order_payment", "payment_method_id");
  pgm.createIndex("order_payment", "customer_payment_profile_id");
  pgm.createIndex("order_payment", "captured_at");
  pgm.createIndex("order_payment", "refunded_at");
  pgm.createIndex("order_payment", "created_at");

  // Create payment transaction table
  pgm.createTable("payment_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    payment_id: { type: "uuid", notNull: true, references: "order_payment", onDelete: "CASCADE" },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('authorization', 'capture', 'sale', 'refund', 'void', 'verification')" 
    },
    amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    status: { type: "varchar(50)", notNull: true },
    transaction_id: { type: "varchar(255)" },
    authorization_code: { type: "varchar(255)" },
    response_code: { type: "varchar(50)" },
    response_message: { type: "text" },
    error_code: { type: "varchar(100)" },
    error_message: { type: "text" },
    gateway_response: { type: "jsonb" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment transactions
  pgm.createIndex("payment_transaction", "payment_id");
  pgm.createIndex("payment_transaction", "order_id");
  pgm.createIndex("payment_transaction", "type");
  pgm.createIndex("payment_transaction", "status");
  pgm.createIndex("payment_transaction", "transaction_id");
  pgm.createIndex("payment_transaction", "created_at");

  // Create refund table
  pgm.createTable("payment_refund", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    payment_id: { type: "uuid", notNull: true, references: "order_payment", onDelete: "CASCADE" },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    transaction_id: { type: "uuid", references: "payment_transaction", onDelete: "SET NULL" },
    amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    reason: { type: "varchar(255)" },
    status: { type: "varchar(50)", notNull: true, default: "pending" },
    refund_id: { type: "varchar(255)" }, // Payment provider's refund ID
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for refunds
  pgm.createIndex("payment_refund", "payment_id");
  pgm.createIndex("payment_refund", "order_id");
  pgm.createIndex("payment_refund", "transaction_id");
  pgm.createIndex("payment_refund", "status");
  pgm.createIndex("payment_refund", "refund_id");
  pgm.createIndex("payment_refund", "created_at");

  // Create table for payment methods (stored)
  pgm.createTable("stored_payment_method", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    nickname: { type: "varchar(255)" },
    payment_method: { type: "payment_method_type", notNull: true },
    provider: { type: "payment_provider", notNull: true },
    token: { type: "varchar(255)", notNull: true }, // Token from payment provider
    last_four: { type: "varchar(4)" },
    card_type: { type: "varchar(50)" },
    expiry_month: { type: "varchar(2)" },
    expiry_year: { type: "varchar(4)" },
    cardholder_name: { type: "varchar(255)" },
    billing_address_id: { type: "uuid", references: "customer_address" },
    billing_address: { type: "jsonb" },
    is_default: { type: "boolean", notNull: true, default: false },
    is_expired: { type: "boolean", notNull: true, default: false },
    customer_payment_profile_id: { type: "varchar(255)" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for stored payment methods
  pgm.createIndex("stored_payment_method", "customer_id");
  pgm.createIndex("stored_payment_method", "payment_method");
  pgm.createIndex("stored_payment_method", "provider");
  pgm.createIndex("stored_payment_method", "token");
  pgm.createIndex("stored_payment_method", "is_default");
  pgm.createIndex("stored_payment_method", "is_expired");
  pgm.createIndex("stored_payment_method", "customer_payment_profile_id");
  pgm.createIndex("stored_payment_method", "deleted_at");
  pgm.createIndex("stored_payment_method", "created_at");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("payment_refund", { cascade: true });
  pgm.dropTable("payment_transaction", { cascade: true });
  pgm.dropTable("stored_payment_method", { cascade: true });
  pgm.dropTable("order_payment", { cascade: true });
  pgm.dropType("payment_method_type");
  pgm.dropType("payment_provider");
};
