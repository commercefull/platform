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
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    name: { type: "varchar(100)", notNull: true },
    provider: { type: "payment_provider", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    is_default: { type: "boolean", notNull: true, default: false },
    is_test_mode: { type: "boolean", notNull: true, default: false },
    api_key: { type: "text" },
    api_secret: { type: "text" },
    public_key: { type: "text" },
    webhook_secret: { type: "text" },
    api_endpoint: { type: "text" },
    supported_payment_methods: { type: "payment_method_type[]", notNull: true, default: "'{credit_card, debit_card}'" },
    supported_currencies: { type: "varchar(3)[]", notNull: true, default: "'{USD}'" },
    processing_fees: { type: "jsonb" }, // Fee structure in JSON format
    checkout_settings: { type: "jsonb" }, // JSON config for checkout integration
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payment gateway
  pgm.createIndex("payment_gateway", "merchant_id");
  pgm.createIndex("payment_gateway", "provider");
  pgm.createIndex("payment_gateway", "is_active");
  pgm.createIndex("payment_gateway", ["merchant_id", "is_default"], {
    unique: true,
    where: "is_default = true"
  });
  pgm.createIndex("payment_gateway", "deleted_at");

  // Create payment method configuration table
  pgm.createTable("payment_method_config", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    payment_method: { type: "payment_method_type", notNull: true },
    is_enabled: { type: "boolean", notNull: true, default: true },
    display_name: { type: "varchar(100)" },
    description: { type: "text" },
    processing_fee: { type: "decimal(10,2)" }, // Fee charged to customer if any
    minimum_amount: { type: "decimal(15,2)" }, // Minimum order amount for this method
    maximum_amount: { type: "decimal(15,2)" }, // Maximum order amount for this method
    display_order: { type: "integer", notNull: true, default: 0 },
    icon: { type: "text" }, // URL to payment method icon
    supported_currencies: { type: "varchar(3)[]", notNull: true, default: "'{USD}'" },
    countries: { type: "varchar(2)[]" }, // Country codes where available
    gateway_id: { type: "uuid", references: "payment_gateway" },
    configuration: { type: "jsonb" }, // Method-specific configuration
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payment method config
  pgm.createIndex("payment_method_config", "merchant_id");
  pgm.createIndex("payment_method_config", "payment_method");
  pgm.createIndex("payment_method_config", "is_enabled");
  pgm.createIndex("payment_method_config", "display_order");
  pgm.createIndex("payment_method_config", "gateway_id");
  pgm.createIndex("payment_method_config", "deleted_at");

  // Create payment settings table
  pgm.createTable("payment_settings", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", unique: true },
    capture_payments_automatically: { type: "boolean", notNull: true, default: true },
    authorization_validity_period: { type: "integer", notNull: true, default: 7 }, // Days
    card_vaulting_enabled: { type: "boolean", notNull: true, default: true }, // Store cards for future use
    allow_guest_checkout: { type: "boolean", notNull: true, default: true },
    require_billing_address: { type: "boolean", notNull: true, default: true },
    require_cvv: { type: "boolean", notNull: true, default: true },
    require_postal_code_verification: { type: "boolean", notNull: true, default: true },
    three_d_secure_settings: { type: "jsonb" }, // 3DS settings
    fraud_detection_settings: { type: "jsonb" }, // Fraud detection configuration
    receipt_settings: { type: "jsonb" }, // Config for payment receipts
    payment_form_customization: { type: "jsonb" }, // Custom styling for payment forms
    auto_refund_on_cancel: { type: "boolean", notNull: true, default: false },
    payment_attempt_limit: { type: "integer", notNull: true, default: 3 }, // Max failed attempts
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payment settings
  pgm.createIndex("payment_settings", "merchant_id");
  pgm.createIndex("payment_settings", "deleted_at");

  // Create payment plans table for subscriptions
  pgm.createTable("payment_plan", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_public: { type: "boolean", notNull: true, default: true },
    amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    billing_interval: { 
      type: "varchar(20)", 
      notNull: true,
      check: "billing_interval IN ('daily', 'weekly', 'monthly', 'quarterly', 'biannually', 'annually')",
      default: "'monthly'"
    },
    billing_frequency: { type: "integer", notNull: true, default: 1 }, // How many intervals between bills
    trial_period_days: { type: "integer", default: 0 },
    setup_fee: { type: "decimal(15,2)", default: 0 },
    max_billing_cycles: { type: "integer" }, // Number of billing cycles before ending (NULL = infinite)
    auto_renew: { type: "boolean", notNull: true, default: true },
    grace_period_days: { type: "integer", notNull: true, default: 3 },
    cancelation_policy: { type: "jsonb" },
    allowed_payment_methods: { type: "payment_method_type[]" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payment plans
  pgm.createIndex("payment_plan", "merchant_id");
  pgm.createIndex("payment_plan", "is_active");
  pgm.createIndex("payment_plan", "is_public");
  pgm.createIndex("payment_plan", "billing_interval");
  pgm.createIndex("payment_plan", "amount");
  pgm.createIndex("payment_plan", "deleted_at");

  // Create payment subscriptions table
  pgm.createTable("payment_subscription", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer" },
    payment_plan_id: { type: "uuid", notNull: true, references: "payment_plan" },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('active', 'canceled', 'expired', 'past_due', 'pending', 'paused', 'trial')",
      default: "'pending'"
    },
    payment_method_id: { type: "uuid", references: "payment_method" },
    start_date: { type: "timestamp", notNull: true },
    trial_end_date: { type: "timestamp" },
    next_billing_date: { type: "timestamp" },
    last_billing_date: { type: "timestamp" },
    end_date: { type: "timestamp" },
    canceled_at: { type: "timestamp" },
    current_period_start: { type: "timestamp" },
    current_period_end: { type: "timestamp" },
    failed_payment_count: { type: "integer", notNull: true, default: 0 },
    last_payment_error: { type: "text" },
    gateway_subscription_id: { type: "varchar(255)" }, // ID from payment provider
    plan_snapshot: { type: "jsonb" }, // Snapshot of plan at subscription time
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payment subscriptions
  pgm.createIndex("payment_subscription", "customer_id");
  pgm.createIndex("payment_subscription", "payment_plan_id");
  pgm.createIndex("payment_subscription", "merchant_id");
  pgm.createIndex("payment_subscription", "status");
  pgm.createIndex("payment_subscription", "payment_method_id");
  pgm.createIndex("payment_subscription", "next_billing_date");
  pgm.createIndex("payment_subscription", "gateway_subscription_id");
  pgm.createIndex("payment_subscription", "deleted_at");

  // Create subscription invoice table
  pgm.createTable("subscription_invoice", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscription_id: { type: "uuid", notNull: true, references: "payment_subscription", onDelete: "CASCADE" },
    customer_id: { type: "uuid", notNull: true, references: "customer" },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('draft', 'open', 'paid', 'past_due', 'failed', 'voided')",
      default: "'draft'"
    },
    due_date: { type: "timestamp", notNull: true },
    paid_date: { type: "timestamp" },
    period_start: { type: "timestamp", notNull: true },
    period_end: { type: "timestamp", notNull: true },
    payment_id: { type: "uuid", references: "order_payment" },
    invoice_number: { type: "varchar(50)" },
    invoice_url: { type: "text" },
    items: { type: "jsonb", notNull: true }, // Line items
    subtotal: { type: "decimal(15,2)", notNull: true },
    tax: { type: "decimal(15,2)", notNull: true, default: 0 },
    discount: { type: "decimal(15,2)", notNull: true, default: 0 },
    gateway_invoice_id: { type: "varchar(255)" }, // ID from payment provider
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for subscription invoices
  pgm.createIndex("subscription_invoice", "subscription_id");
  pgm.createIndex("subscription_invoice", "customer_id");
  pgm.createIndex("subscription_invoice", "merchant_id");
  pgm.createIndex("subscription_invoice", "status");
  pgm.createIndex("subscription_invoice", "due_date");
  pgm.createIndex("subscription_invoice", "payment_id");
  pgm.createIndex("subscription_invoice", "invoice_number");
  pgm.createIndex("subscription_invoice", "gateway_invoice_id");
  pgm.createIndex("subscription_invoice", "deleted_at");

  // Create payment webhook table
  pgm.createTable("payment_webhook", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    gateway_id: { type: "uuid", references: "payment_gateway" },
    provider: { type: "payment_provider", notNull: true },
    event_type: { type: "varchar(100)", notNull: true },
    payload: { type: "jsonb", notNull: true },
    headers: { type: "jsonb" },
    ip_address: { type: "inet" },
    processed_at: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('pending', 'processed', 'failed', 'ignored')",
      default: "'pending'"
    },
    error: { type: "text" },
    related_entity_type: { type: "varchar(50)" }, // 'payment', 'subscription', etc.
    related_entity_id: { type: "uuid" }, // ID of the related entity
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payment webhooks
  pgm.createIndex("payment_webhook", "merchant_id");
  pgm.createIndex("payment_webhook", "gateway_id");
  pgm.createIndex("payment_webhook", "provider");
  pgm.createIndex("payment_webhook", "event_type");
  pgm.createIndex("payment_webhook", "status");
  pgm.createIndex("payment_webhook", "related_entity_type");
  pgm.createIndex("payment_webhook", "related_entity_id");
  pgm.createIndex("payment_webhook", "created_at");
  pgm.createIndex("payment_webhook", "deleted_at");

  // Create payment disputes table
  pgm.createTable("payment_dispute", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    payment_id: { type: "uuid", references: "order_payment" },
    order_id: { type: "uuid", references: "order" },
    customer_id: { type: "uuid", references: "customer" },
    amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    reason: { type: "varchar(100)", notNull: true },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('pending', 'under_review', 'won', 'lost', 'withdrawn')",
      default: "'pending'"
    },
    evidence_details: { type: "jsonb" },
    evidence_submitted_at: { type: "timestamp" },
    evidence_due_by: { type: "timestamp" },
    gateway_dispute_id: { type: "varchar(255)" }, // ID from payment provider
    resolved_at: { type: "timestamp" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payment disputes
  pgm.createIndex("payment_dispute", "merchant_id");
  pgm.createIndex("payment_dispute", "payment_id");
  pgm.createIndex("payment_dispute", "order_id");
  pgm.createIndex("payment_dispute", "customer_id");
  pgm.createIndex("payment_dispute", "status");
  pgm.createIndex("payment_dispute", "gateway_dispute_id");
  pgm.createIndex("payment_dispute", "created_at");
  pgm.createIndex("payment_dispute", "deleted_at");

  // Insert sample payment gateway
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO payment_gateway (
      merchant_id,
      name,
      provider,
      is_active,
      is_default,
      is_test_mode,
      api_key,
      api_secret,
      supported_payment_methods,
      supported_currencies,
      processing_fees
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
      merchant_id,
      payment_method,
      is_enabled,
      display_name,
      description,
      display_order,
      supported_currencies,
      countries,
      gateway_id
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
      merchant_id,
      capture_payments_automatically,
      authorization_validity_period,
      card_vaulting_enabled,
      allow_guest_checkout,
      require_billing_address,
      three_d_secure_settings,
      fraud_detection_settings
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
