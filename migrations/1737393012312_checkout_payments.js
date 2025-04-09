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
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'crypto')" 
    },
    provider: { type: "varchar(100)", notNull: true }, // stripe, paypal, etc.
    token: { type: "varchar(255)" }, // Token from payment provider
    gatewayCustomerId: { type: "varchar(255)" }, // Customer ID in the payment provider
    gatewayPaymentMethodId: { type: "varchar(255)" }, // Payment method ID in the payment provider
    maskedNumber: { type: "varchar(30)" }, // Last 4 digits for cards
    cardType: { type: "varchar(50)" }, // visa, mastercard, etc.
    expiryMonth: { type: "integer", check: "expiryMonth >= 1 AND expiryMonth <= 12" },
    expiryYear: { type: "integer" },
    cardholderName: { type: "varchar(255)" },
    isDefault: { type: "boolean", notNull: true, default: false },
    billingAddressId: { type: "uuid", references: "customer_address" },
    metaData: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment methods
  pgm.createIndex("payment_method", "customerId");
  pgm.createIndex("payment_method", "type");
  pgm.createIndex("payment_method", "provider");
  pgm.createIndex("payment_method", "gatewayCustomerId");
  pgm.createIndex("payment_method", "gatewayPaymentMethodId");

  // Create order payment table to track payments for orders
  pgm.createTable("order_payment", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    paymentMethodId: { type: "uuid", references: "payment_method" }, // Optional link to saved payment method
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
    transactionId: { type: "varchar(255)" }, // ID from payment provider
    authorizationCode: { type: "varchar(255)" },
    errorCode: { type: "varchar(100)" },
    errorMessage: { type: "text" },
    metadata: { type: "jsonb" },
    maskedNumber: { type: "varchar(30)" }, // Last 4 digits for cards
    cardType: { type: "varchar(50)" }, // visa, mastercard, etc.
    gatewayResponse: { type: "jsonb" }, // Full response from payment gateway
    refundedAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    capturedAt: { type: "timestamp" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order payments
  pgm.createIndex("order_payment", "orderId");
  pgm.createIndex("order_payment", "paymentMethodId");
  pgm.createIndex("order_payment", "type");
  pgm.createIndex("order_payment", "provider");
  pgm.createIndex("order_payment", "status");
  pgm.createIndex("order_payment", "transactionId");

  // Create order payment refund table
  pgm.createTable("order_payment_refund", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderPaymentId: { type: "uuid", notNull: true, references: "order_payment", onDelete: "CASCADE" },
    amount: { type: "decimal(15,2)", notNull: true },
    reason: { type: "varchar(255)" },
    notes: { type: "text" },
    transactionId: { type: "varchar(255)" }, // ID from payment provider
    status: { 
      type: "varchar(50)", 
      notNull: true, 
      default: "pending", 
      check: "status IN ('pending', 'completed', 'failed')" 
    },
    gatewayResponse: { type: "jsonb" }, // Full response from payment gateway
    refundedBy: { type: "uuid" }, // User ID of admin who processed the refund
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for refunds
  pgm.createIndex("order_payment_refund", "orderPaymentId");
  pgm.createIndex("order_payment_refund", "status");
  pgm.createIndex("order_payment_refund", "transactionId");
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
