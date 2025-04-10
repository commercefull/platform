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
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    amount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    paymentMethod: { type: "payment_method_type", notNull: true },
    provider: { type: "payment_provider", notNull: true },
    status: { type: "payment_status", notNull: true, default: "pending" },
    transactionId: { type: "varchar(255)" }, // Payment provider's transaction ID
    authorizationCode: { type: "varchar(255)" }, // Authorization code from payment provider
    lastFour: { type: "varchar(4)" }, // Last four digits of card
    cardType: { type: "varchar(50)" }, // Visa, Mastercard, etc.
    cardholderName: { type: "varchar(255)" },
    expiryMonth: { type: "varchar(2)" },
    expiryYear: { type: "varchar(4)" },
    billingPostalCode: { type: "varchar(20)" },
    billingAddressId: { type: "uuid", references: "customer_address" },
    billingAddress: { type: "jsonb" }, // Copy of billing address at time of payment
    paymentIntentId: { type: "varchar(255)" }, // For providers like Stripe
    paymentMethodId: { type: "varchar(255)" }, // Stored payment method ID
    customerPaymentProfileId: { type: "varchar(255)" }, // Customer's profile ID with payment provider
    errorCode: { type: "varchar(100)" },
    errorMessage: { type: "text" },
    receiptUrl: { type: "text" }, // URL to payment receipt
    metadata: { type: "jsonb" },
    capturedAt: { type: "timestamp" },
    refundedAt: { type: "timestamp" },
    voidedAt: { type: "timestamp" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order payments
  pgm.createIndex("order_payment", "orderId");
  pgm.createIndex("order_payment", "paymentMethod");
  pgm.createIndex("order_payment", "provider");
  pgm.createIndex("order_payment", "status");
  pgm.createIndex("order_payment", "transactionId");
  pgm.createIndex("order_payment", "billingAddressId");
  pgm.createIndex("order_payment", "paymentIntentId");
  pgm.createIndex("order_payment", "paymentMethodId");
  pgm.createIndex("order_payment", "customerPaymentProfileId");
  pgm.createIndex("order_payment", "capturedAt");
  pgm.createIndex("order_payment", "refundedAt");
  pgm.createIndex("order_payment", "createdAt");

  // Create payment transaction table
  pgm.createTable("payment_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    paymentId: { type: "uuid", notNull: true, references: "order_payment", onDelete: "CASCADE" },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('authorization', 'capture', 'sale', 'refund', 'void', 'verification')" 
    },
    amount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'success', 'failed', 'cancelled')" 
    },
    reference: { type: "varchar(255)" }, // Provider's reference for this transaction
    responseCode: { type: "varchar(100)" },
    responseMessage: { type: "text" },
    gatewayResponse: { type: "jsonb" }, // Full response from payment gateway
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment transactions
  pgm.createIndex("payment_transaction", "paymentId");
  pgm.createIndex("payment_transaction", "orderId");
  pgm.createIndex("payment_transaction", "type");
  pgm.createIndex("payment_transaction", "status");
  pgm.createIndex("payment_transaction", "reference");
  pgm.createIndex("payment_transaction", "createdAt");

  // Create order refund table
  pgm.createTable("order_refund", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    paymentId: { type: "uuid", references: "order_payment" },
    amount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    reason: { type: "text" },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('pending', 'processing', 'completed', 'failed')" 
    },
    refundMethod: { 
      type: "varchar(50)", 
      notNull: true,
      check: "refundMethod IN ('original_payment', 'store_credit', 'gift_card', 'manual', 'other')" 
    },
    transactionId: { type: "varchar(255)" }, // Payment provider's transaction ID
    items: { type: "jsonb" }, // Refunded items with quantities
    itemsTotal: { type: "decimal(15,2)" }, // Total for refunded items
    shippingTotal: { type: "decimal(15,2)" }, // Refunded shipping
    taxTotal: { type: "decimal(15,2)" }, // Refunded tax
    restockItems: { type: "boolean", notNull: true, default: true }, // Whether to restock items
    notes: { type: "text" },
    refundedBy: { type: "varchar(255)" }, // User who processed the refund
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order refunds
  pgm.createIndex("order_refund", "orderId");
  pgm.createIndex("order_refund", "paymentId");
  pgm.createIndex("order_refund", "status");
  pgm.createIndex("order_refund", "refundMethod");
  pgm.createIndex("order_refund", "transactionId");
  pgm.createIndex("order_refund", "refundedBy");
  pgm.createIndex("order_refund", "createdAt");

  // Create payment method table
  pgm.createTable("payment_method", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    type: { type: "payment_method_type", notNull: true },
    provider: { type: "payment_provider", notNull: true },
    tokenId: { type: "varchar(255)" }, // Payment method token from provider
    paymentMethodId: { type: "varchar(255)" }, // ID from payment provider
    customerPaymentProfileId: { type: "varchar(255)" }, // Customer's profile ID with payment provider
    isDefault: { type: "boolean", notNull: true, default: false },
    nickname: { type: "varchar(100)" }, // User-defined name for this payment method
    lastFour: { type: "varchar(4)" }, // Last four digits of card
    cardType: { type: "varchar(50)" }, // Visa, Mastercard, etc.
    cardholderName: { type: "varchar(255)" },
    expiryMonth: { type: "varchar(2)" },
    expiryYear: { type: "varchar(4)" },
    billingAddressId: { type: "uuid", references: "customer_address" },
    isExpired: { type: "boolean", notNull: true, default: false },
    isValid: { type: "boolean", notNull: true, default: true },
    validationError: { type: "text" },
    fingerprint: { type: "varchar(255)" }, // Card fingerprint for detecting duplicates
    metadata: { type: "jsonb" },
    expiresAt: { type: "timestamp" }, // When this payment method expires
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment methods
  pgm.createIndex("payment_method", "customerId");
  pgm.createIndex("payment_method", "type");
  pgm.createIndex("payment_method", "provider");
  pgm.createIndex("payment_method", "tokenId");
  pgm.createIndex("payment_method", "paymentMethodId");
  pgm.createIndex("payment_method", "customerPaymentProfileId");
  pgm.createIndex("payment_method", "isDefault");
  pgm.createIndex("payment_method", "lastFour");
  pgm.createIndex("payment_method", "billingAddressId");
  pgm.createIndex("payment_method", "isExpired");
  pgm.createIndex("payment_method", "isValid");
  pgm.createIndex("payment_method", "fingerprint");
  pgm.createIndex("payment_method", ["customerId", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Insert sample payment for the sample order
  pgm.sql(`
    WITH sample_order AS (SELECT id FROM "order" LIMIT 1)
    INSERT INTO "order_payment" (
      orderId,
      amount,
      currencyCode,
      paymentMethod,
      provider,
      status,
      transactionId,
      lastFour,
      cardType,
      cardholderName,
      billingAddress
    )
    VALUES (
      (SELECT id FROM sample_order),
      113.97,
      'USD',
      'credit_card',
      'stripe',
      'paid',
      'txn_' || SUBSTRING(CAST(gen_random_uuid() AS TEXT), 1, 12),
      '4242',
      'Visa',
      'Sample Customer',
      '{"firstName": "Sample", "lastName": "Customer", "address1": "123 Main St", "city": "Anytown", "state": "CA", "zip": "90210", "country": "US"}'
    )
  `);

  // Insert sample payment transaction
  pgm.sql(`
    WITH 
      sample_order AS (SELECT id FROM "order" LIMIT 1),
      sample_payment AS (SELECT id FROM "order_payment" LIMIT 1)
    INSERT INTO "payment_transaction" (
      paymentId,
      orderId,
      type,
      amount,
      currencyCode,
      status,
      reference
    )
    VALUES (
      (SELECT id FROM sample_payment),
      (SELECT id FROM sample_order),
      'sale',
      113.97,
      'USD',
      'success',
      'ch_' || SUBSTRING(CAST(gen_random_uuid() AS TEXT), 1, 12)
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("payment_method");
  pgm.dropTable("order_refund");
  pgm.dropTable("payment_transaction");
  pgm.dropTable("order_payment");
  pgm.dropType("payment_provider");
  pgm.dropType("payment_method_type");
};
