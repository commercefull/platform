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
  // Create payout status enum
  pgm.createType("payout_status", [
    "pending",
    "processing",
    "paid",
    "failed",
    "cancelled"
  ]);

  // Create payout frequency enum
  pgm.createType("payout_frequency", [
    "daily",
    "weekly",
    "biweekly",
    "monthly",
    "manual"
  ]);

  // Create payout settings table
  pgm.createTable("payout_settings", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", unique: true },
    frequency: { type: "payout_frequency", notNull: true, default: "weekly" },
    minimum_amount: { type: "decimal(15,2)", notNull: true, default: 1.00 },
    bank_account_id: { type: "uuid" }, // Reference to bank account in payment_method or external system
    payout_day: { type: "integer" }, // Day of week (1-7) or day of month (1-31) depending on frequency
    hold_period: { type: "integer", notNull: true, default: 0 }, // Days to hold payments before payout
    automatic_payouts: { type: "boolean", notNull: true, default: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    payout_provider: { type: "payment_provider", notNull: true, default: "stripe" },
    payout_method: { 
      type: "varchar(50)", 
      notNull: true,
      check: "payout_method IN ('bank_transfer', 'paypal', 'check', 'other')",
      default: "'bank_transfer'"
    },
    provider_settings: { type: "jsonb" }, // Provider-specific settings
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payout settings
  pgm.createIndex("payout_settings", "merchant_id");
  pgm.createIndex("payout_settings", "frequency");
  pgm.createIndex("payout_settings", "payout_provider");
  pgm.createIndex("payout_settings", "deleted_at");

  // Create payout table
  pgm.createTable("payout", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    amount: { type: "decimal(15,2)", notNull: true },
    fee: { type: "decimal(15,2)", notNull: true, default: 0 },
    net_amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    status: { type: "payout_status", notNull: true, default: "pending" },
    payout_method: { 
      type: "varchar(50)", 
      notNull: true,
      check: "payout_method IN ('bank_transfer', 'paypal', 'check', 'other')",
      default: "'bank_transfer'"
    },
    bank_account_id: { type: "uuid" }, // Reference to bank account in payment_method or external system
    bank_account_details: { type: "jsonb" }, // Snapshot of bank account info
    description: { type: "text" },
    statement_descriptor: { type: "varchar(255)" }, // Text that appears on bank statement
    period_start: { type: "timestamp" },
    period_end: { type: "timestamp" },
    expected_arrival_date: { type: "timestamp" },
    completed_at: { type: "timestamp" },
    failure_reason: { type: "text" },
    transaction_reference: { type: "varchar(255)" }, // Reference ID for the payout transaction
    gateway_payout_id: { type: "varchar(255)" }, // ID from payment provider
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payouts
  pgm.createIndex("payout", "merchant_id");
  pgm.createIndex("payout", "status");
  pgm.createIndex("payout", "payout_method");
  pgm.createIndex("payout", "period_start");
  pgm.createIndex("payout", "period_end");
  pgm.createIndex("payout", "gateway_payout_id");
  pgm.createIndex("payout", "transaction_reference");
  pgm.createIndex("payout", "completed_at");
  pgm.createIndex("payout", "created_at");
  pgm.createIndex("payout", "deleted_at");

  // Create payout item table (payments included in a payout)
  pgm.createTable("payout_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    payout_id: { type: "uuid", notNull: true, references: "payout", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('payment', 'refund', 'dispute', 'fee', 'adjustment', 'other')"
    },
    amount: { type: "decimal(15,2)", notNull: true },
    fee: { type: "decimal(15,2)", notNull: true, default: 0 },
    net_amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    description: { type: "text" },
    order_id: { type: "uuid", references: "order" },
    payment_id: { type: "uuid", references: "order_payment" },
    refund_id: { type: "uuid", references: "order_refund" },
    dispute_id: { type: "uuid", references: "payment_dispute" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payout items
  pgm.createIndex("payout_item", "payout_id");
  pgm.createIndex("payout_item", "type");
  pgm.createIndex("payout_item", "order_id");
  pgm.createIndex("payout_item", "payment_id");
  pgm.createIndex("payout_item", "refund_id");
  pgm.createIndex("payout_item", "dispute_id");
  pgm.createIndex("payout_item", "deleted_at");

  // Create payment balance table (running balances for merchants)
  pgm.createTable("payment_balance", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    available_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    pending_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    reserved_amount: { type: "decimal(15,2)", notNull: true, default: 0 }, // For disputes, potential refunds
    total_volume: { type: "decimal(15,2)", notNull: true, default: 0 }, // Lifetime volume
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    last_payout_date: { type: "timestamp" },
    next_payout_date: { type: "timestamp" },
    next_payout_amount: { type: "decimal(15,2)" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment balances
  pgm.createIndex("payment_balance", ["merchant_id", "currency_code"], { unique: true });

  // Create payment fee table
  pgm.createTable("payment_fee", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('transaction', 'subscription', 'dispute', 'refund', 'chargeback', 'payout', 'platform', 'other')"
    },
    amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    description: { type: "text" },
    payment_id: { type: "uuid", references: "order_payment" },
    order_id: { type: "uuid", references: "order" },
    subscription_id: { type: "uuid", references: "payment_subscription" },
    payout_id: { type: "uuid", references: "payout" },
    applied_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment fees
  pgm.createIndex("payment_fee", "merchant_id");
  pgm.createIndex("payment_fee", "type");
  pgm.createIndex("payment_fee", "payment_id");
  pgm.createIndex("payment_fee", "order_id");
  pgm.createIndex("payment_fee", "subscription_id");
  pgm.createIndex("payment_fee", "payout_id");
  pgm.createIndex("payment_fee", "applied_at");

  // Create payment report table
  pgm.createTable("payment_report", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    name: { type: "varchar(255)", notNull: true },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('transaction', 'payout', 'fee', 'settlement', 'summary', 'tax', 'custom')"
    },
    format: { 
      type: "varchar(10)", 
      notNull: true,
      check: "format IN ('csv', 'pdf', 'json', 'xlsx')",
      default: "'csv'"
    },
    parameters: { type: "jsonb" },
    date_range: { 
      type: "tstzrange",
      notNull: true
    },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('pending', 'processing', 'completed', 'failed')",
      default: "'pending'"
    },
    file_url: { type: "text" },
    size: { type: "integer" }, // Size in bytes
    error_message: { type: "text" },
    notify_email: { type: "varchar(255)" },
    created_by: { type: "uuid" }, // Reference to admin or user
    generated_at: { type: "timestamp" },
    downloaded_at: { type: "timestamp" },
    completed_at: { type: "timestamp" },
    expires_at: { type: "timestamp" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for payment reports
  pgm.createIndex("payment_report", "merchant_id");
  pgm.createIndex("payment_report", "type");
  pgm.createIndex("payment_report", "status");
  pgm.createIndex("payment_report", "created_by");
  pgm.createIndex("payment_report", "generated_at");
  pgm.createIndex("payment_report", "completed_at");
  pgm.createIndex("payment_report", "created_at");
  pgm.createIndex("payment_report", "expires_at");
  pgm.createIndex("payment_report", "deleted_at");

  // Insert sample payout settings
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO payout_settings (
      merchant_id,
      frequency,
      minimum_amount,
      payout_day,
      hold_period,
      automatic_payouts,
      provider_settings
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      'weekly',
      25.00,
      2, -- Tuesday
      3, -- 3 days hold
      true,
      '{"webhook_url": "https://example.com/payout-webhooks", "notifications": true}'
    )
  `);

  // Insert sample payment balance
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO payment_balance (
      merchant_id,
      available_amount,
      pending_amount,
      reserved_amount,
      total_volume,
      currency_code,
      next_payout_date,
      next_payout_amount
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      1250.00,
      450.00,
      200.00,
      15000.00,
      'USD',
      current_timestamp + interval '7 days',
      1250.00
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("payment_report");
  pgm.dropTable("payment_fee");
  pgm.dropTable("payment_balance");
  pgm.dropTable("payout_item");
  pgm.dropTable("payout");
  pgm.dropTable("payout_settings");
  pgm.dropType("payout_frequency");
  pgm.dropType("payout_status");
};
