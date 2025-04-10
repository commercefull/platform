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
  // Create payment status enum if it doesn't exist
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
          'pending',
          'authorized',
          'paid',
          'partially_refunded',
          'refunded',
          'voided',
          'failed',
          'cancelled',
          'expired'
        );
      END IF;
    END
    $$;
  `);

  // Create payment gateway table
  pgm.createTable("payment_gateway", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    name: { type: "varchar(100)", notNull: true },
    provider: { type: "payment_provider", notNull: true },
    isActive: { type: "boolean", notNull: true, default: true },
    isDefault: { type: "boolean", notNull: true, default: false },
    isTestMode: { type: "boolean", notNull: true, default: false },
    apiKey: { type: "text" },
    apiSecret: { type: "text" },
    publicKey: { type: "text" },
    webhookSecret: { type: "text" },
    apiEndpoint: { type: "text" },
    supportedPaymentMethods: { type: "payment_method_type[]", notNull: true, default: "'{credit_card, debit_card}'" },
    supportedCurrencies: { type: "varchar(3)[]", notNull: true, default: "'{USD}'" },
    processingFees: { type: "jsonb" }, // Fee structure in JSON format
    checkoutSettings: { type: "jsonb" }, // JSON config for checkout integration
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment gateway
  pgm.createIndex("payment_gateway", "merchantId");
  pgm.createIndex("payment_gateway", "provider");
  pgm.createIndex("payment_gateway", "isActive");
  pgm.createIndex("payment_gateway", ["merchantId", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Create payment method configuration table
  pgm.createTable("payment_method_config", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    paymentMethod: { type: "payment_method_type", notNull: true },
    isEnabled: { type: "boolean", notNull: true, default: true },
    displayName: { type: "varchar(100)" },
    description: { type: "text" },
    processingFee: { type: "decimal(10,2)" }, // Fee charged to customer if any
    minimumAmount: { type: "decimal(15,2)" }, // Minimum order amount for this method
    maximumAmount: { type: "decimal(15,2)" }, // Maximum order amount for this method
    displayOrder: { type: "integer", notNull: true, default: 0 },
    icon: { type: "text" }, // URL to payment method icon
    supportedCurrencies: { type: "varchar(3)[]", notNull: true, default: "'{USD}'" },
    countries: { type: "varchar(2)[]" }, // Country codes where available
    gatewayId: { type: "uuid", references: "payment_gateway" },
    configuration: { type: "jsonb" }, // Method-specific configuration
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment method config
  pgm.createIndex("payment_method_config", "merchantId");
  pgm.createIndex("payment_method_config", "paymentMethod");
  pgm.createIndex("payment_method_config", "isEnabled");
  pgm.createIndex("payment_method_config", "displayOrder");
  pgm.createIndex("payment_method_config", "gatewayId");

  // Create payment settings table
  pgm.createTable("payment_settings", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", unique: true },
    capturePaymentsAutomatically: { type: "boolean", notNull: true, default: true },
    authorizationValidityPeriod: { type: "integer", notNull: true, default: 7 }, // Days
    cardVaultingEnabled: { type: "boolean", notNull: true, default: true }, // Store cards for future use
    allowGuestCheckout: { type: "boolean", notNull: true, default: true },
    requireBillingAddress: { type: "boolean", notNull: true, default: true },
    requireCvv: { type: "boolean", notNull: true, default: true },
    requirePostalCodeVerification: { type: "boolean", notNull: true, default: true },
    threeDSecureSettings: { type: "jsonb" }, // 3DS settings
    fraudDetectionSettings: { type: "jsonb" }, // Fraud detection configuration
    receiptSettings: { type: "jsonb" }, // Config for payment receipts
    paymentFormCustomization: { type: "jsonb" }, // Custom styling for payment forms
    autoRefundOnCancel: { type: "boolean", notNull: true, default: false },
    paymentAttemptLimit: { type: "integer", notNull: true, default: 3 }, // Max failed attempts
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment settings
  pgm.createIndex("payment_settings", "merchantId");

  // Create payment plans table for subscriptions
  pgm.createTable("payment_plan", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    isPublic: { type: "boolean", notNull: true, default: true },
    amount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    billingInterval: { 
      type: "varchar(20)", 
      notNull: true,
      check: "billingInterval IN ('daily', 'weekly', 'monthly', 'quarterly', 'biannually', 'annually')",
      default: "'monthly'"
    },
    billingFrequency: { type: "integer", notNull: true, default: 1 }, // How many intervals between bills
    trialPeriodDays: { type: "integer", default: 0 },
    setupFee: { type: "decimal(15,2)", default: 0 },
    maxBillingCycles: { type: "integer" }, // Number of billing cycles before ending (NULL = infinite)
    autoRenew: { type: "boolean", notNull: true, default: true },
    gracePeriodDays: { type: "integer", notNull: true, default: 3 },
    cancelationPolicy: { type: "jsonb" },
    allowedPaymentMethods: { type: "payment_method_type[]" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment plans
  pgm.createIndex("payment_plan", "merchantId");
  pgm.createIndex("payment_plan", "isActive");
  pgm.createIndex("payment_plan", "isPublic");
  pgm.createIndex("payment_plan", "billingInterval");
  pgm.createIndex("payment_plan", "amount");

  // Create payment subscriptions table
  pgm.createTable("payment_subscription", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer" },
    paymentPlanId: { type: "uuid", notNull: true, references: "payment_plan" },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('active', 'canceled', 'expired', 'past_due', 'pending', 'paused', 'trial')",
      default: "'pending'"
    },
    paymentMethodId: { type: "uuid", references: "payment_method" },
    startDate: { type: "timestamp", notNull: true },
    trialEndDate: { type: "timestamp" },
    nextBillingDate: { type: "timestamp" },
    lastBillingDate: { type: "timestamp" },
    endDate: { type: "timestamp" },
    canceledAt: { type: "timestamp" },
    currentPeriodStart: { type: "timestamp" },
    currentPeriodEnd: { type: "timestamp" },
    failedPaymentCount: { type: "integer", notNull: true, default: 0 },
    lastPaymentError: { type: "text" },
    gatewaySubscriptionId: { type: "varchar(255)" }, // ID from payment provider
    planSnapshot: { type: "jsonb" }, // Snapshot of plan at subscription time
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment subscriptions
  pgm.createIndex("payment_subscription", "customerId");
  pgm.createIndex("payment_subscription", "paymentPlanId");
  pgm.createIndex("payment_subscription", "merchantId");
  pgm.createIndex("payment_subscription", "status");
  pgm.createIndex("payment_subscription", "paymentMethodId");
  pgm.createIndex("payment_subscription", "nextBillingDate");
  pgm.createIndex("payment_subscription", "gatewaySubscriptionId");

  // Create subscription invoice table
  pgm.createTable("subscription_invoice", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscriptionId: { type: "uuid", notNull: true, references: "payment_subscription", onDelete: "CASCADE" },
    customerId: { type: "uuid", notNull: true, references: "customer" },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    amount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('draft', 'open', 'paid', 'past_due', 'failed', 'voided')",
      default: "'draft'"
    },
    dueDate: { type: "timestamp", notNull: true },
    paidDate: { type: "timestamp" },
    periodStart: { type: "timestamp", notNull: true },
    periodEnd: { type: "timestamp", notNull: true },
    paymentId: { type: "uuid", references: "order_payment" },
    invoiceNumber: { type: "varchar(50)" },
    invoiceUrl: { type: "text" },
    items: { type: "jsonb", notNull: true }, // Line items
    subtotal: { type: "decimal(15,2)", notNull: true },
    tax: { type: "decimal(15,2)", notNull: true, default: 0 },
    discount: { type: "decimal(15,2)", notNull: true, default: 0 },
    gatewayInvoiceId: { type: "varchar(255)" }, // ID from payment provider
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for subscription invoices
  pgm.createIndex("subscription_invoice", "subscriptionId");
  pgm.createIndex("subscription_invoice", "customerId");
  pgm.createIndex("subscription_invoice", "merchantId");
  pgm.createIndex("subscription_invoice", "status");
  pgm.createIndex("subscription_invoice", "dueDate");
  pgm.createIndex("subscription_invoice", "paymentId");
  pgm.createIndex("subscription_invoice", "invoiceNumber");
  pgm.createIndex("subscription_invoice", "gatewayInvoiceId");

  // Create payment webhook table
  pgm.createTable("payment_webhook", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    gatewayId: { type: "uuid", references: "payment_gateway" },
    provider: { type: "payment_provider", notNull: true },
    eventType: { type: "varchar(100)", notNull: true },
    payload: { type: "jsonb", notNull: true },
    headers: { type: "jsonb" },
    ipAddress: { type: "inet" },
    processedAt: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('pending', 'processed', 'failed', 'ignored')",
      default: "'pending'"
    },
    error: { type: "text" },
    relatedEntityType: { type: "varchar(50)" }, // 'payment', 'subscription', etc.
    relatedEntityId: { type: "uuid" }, // ID of the related entity
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment webhooks
  pgm.createIndex("payment_webhook", "merchantId");
  pgm.createIndex("payment_webhook", "gatewayId");
  pgm.createIndex("payment_webhook", "provider");
  pgm.createIndex("payment_webhook", "eventType");
  pgm.createIndex("payment_webhook", "status");
  pgm.createIndex("payment_webhook", "relatedEntityType");
  pgm.createIndex("payment_webhook", "relatedEntityId");
  pgm.createIndex("payment_webhook", "createdAt");

  // Create payment disputes table
  pgm.createTable("payment_dispute", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    paymentId: { type: "uuid", references: "order_payment" },
    orderId: { type: "uuid", references: "order" },
    customerId: { type: "uuid", references: "customer" },
    amount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    reason: { type: "varchar(100)", notNull: true },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('pending', 'under_review', 'won', 'lost', 'withdrawn')",
      default: "'pending'"
    },
    evidenceDetails: { type: "jsonb" },
    evidenceSubmittedAt: { type: "timestamp" },
    evidenceDueBy: { type: "timestamp" },
    gatewayDisputeId: { type: "varchar(255)" }, // ID from payment provider
    resolvedAt: { type: "timestamp" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment disputes
  pgm.createIndex("payment_dispute", "merchantId");
  pgm.createIndex("payment_dispute", "paymentId");
  pgm.createIndex("payment_dispute", "orderId");
  pgm.createIndex("payment_dispute", "customerId");
  pgm.createIndex("payment_dispute", "status");
  pgm.createIndex("payment_dispute", "gatewayDisputeId");
  pgm.createIndex("payment_dispute", "createdAt");

  // Insert sample payment gateway
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO payment_gateway (
      merchantId,
      name,
      provider,
      isActive,
      isDefault,
      isTestMode,
      apiKey,
      apiSecret,
      supportedPaymentMethods,
      supportedCurrencies,
      processingFees
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      'Stripe Gateway',
      'stripe',
      true,
      true,
      true,
      'pk_test_sample',
      'sk_test_sample',
      '{credit_card, debit_card, apple_pay, google_pay}',
      '{USD, EUR, GBP}',
      '{"standardRate": 2.9, "additionalFee": 0.30, "currency": "USD"}'
    )
  `);

  // Insert sample payment method configs
  pgm.sql(`
    WITH 
      sample_merchant AS (SELECT id FROM merchant LIMIT 1),
      sample_gateway AS (SELECT id FROM payment_gateway LIMIT 1)
    INSERT INTO payment_method_config (
      merchantId,
      paymentMethod,
      isEnabled,
      displayName,
      description,
      displayOrder,
      supportedCurrencies,
      countries,
      gatewayId
    )
    VALUES
    (
      (SELECT id FROM sample_merchant),
      'credit_card',
      true,
      'Credit Card',
      'Pay with Visa, Mastercard, American Express, or Discover',
      1,
      '{USD, EUR, GBP}',
      '{US, CA, GB, DE, FR}',
      (SELECT id FROM sample_gateway)
    ),
    (
      (SELECT id FROM sample_merchant),
      'paypal',
      true,
      'PayPal',
      'Fast, secure payments with PayPal',
      2,
      '{USD, EUR, GBP}',
      '{US, CA, GB, DE, FR, AU}',
      (SELECT id FROM sample_gateway)
    )
  `);

  // Insert sample payment settings
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO payment_settings (
      merchantId,
      capturePaymentsAutomatically,
      authorizationValidityPeriod,
      cardVaultingEnabled,
      allowGuestCheckout,
      requireBillingAddress,
      threeDSecureSettings,
      fraudDetectionSettings
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      true,
      7,
      true,
      true,
      true,
      '{"enabled": true, "requestedExemptions": ["low_value", "low_risk"]}',
      '{"enabled": true, "rules": [{"type": "address_verification", "action": "review"}, {"type": "high_value", "threshold": 1000, "action": "review"}]}'
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("payment_dispute");
  pgm.dropTable("payment_webhook");
  pgm.dropTable("subscription_invoice");
  pgm.dropTable("payment_subscription");
  pgm.dropTable("payment_plan");
  pgm.dropTable("payment_settings");
  pgm.dropTable("payment_method_config");
  pgm.dropTable("payment_gateway");

  // Note: We don't drop the payment_status enum because it might be used by other tables
};
