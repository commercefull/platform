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
    merchantId: { type: "uuid", notNull: true, references: "merchant", unique: true },
    frequency: { type: "payout_frequency", notNull: true, default: "weekly" },
    minimumAmount: { type: "decimal(15,2)", notNull: true, default: 1.00 },
    bankAccountId: { type: "uuid" }, // Reference to bank account in payment_method or external system
    payoutDay: { type: "integer" }, // Day of week (1-7) or day of month (1-31) depending on frequency
    holdPeriod: { type: "integer", notNull: true, default: 0 }, // Days to hold payments before payout
    automaticPayouts: { type: "boolean", notNull: true, default: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    payoutProvider: { type: "payment_provider", notNull: true, default: "stripe" },
    payoutMethod: { 
      type: "varchar(50)", 
      notNull: true,
      check: "payoutMethod IN ('bank_transfer', 'paypal', 'check', 'other')",
      default: "'bank_transfer'"
    },
    providerSettings: { type: "jsonb" }, // Provider-specific settings
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payout settings
  pgm.createIndex("payout_settings", "merchantId");
  pgm.createIndex("payout_settings", "frequency");
  pgm.createIndex("payout_settings", "payoutProvider");

  // Create payout table
  pgm.createTable("payout", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    amount: { type: "decimal(15,2)", notNull: true },
    fee: { type: "decimal(15,2)", notNull: true, default: 0 },
    netAmount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    status: { type: "payout_status", notNull: true, default: "pending" },
    payoutMethod: { 
      type: "varchar(50)", 
      notNull: true,
      check: "payoutMethod IN ('bank_transfer', 'paypal', 'check', 'other')",
      default: "'bank_transfer'"
    },
    bankAccountId: { type: "uuid" }, // Reference to bank account in payment_method or external system
    bankAccountDetails: { type: "jsonb" }, // Snapshot of bank account info
    description: { type: "text" },
    statementDescriptor: { type: "varchar(255)" }, // Text that appears on bank statement
    periodStart: { type: "timestamp" },
    periodEnd: { type: "timestamp" },
    expectedArrivalDate: { type: "timestamp" },
    completedAt: { type: "timestamp" },
    failureReason: { type: "text" },
    transactionReference: { type: "varchar(255)" }, // Reference ID for the payout transaction
    gatewayPayoutId: { type: "varchar(255)" }, // ID from payment provider
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payouts
  pgm.createIndex("payout", "merchantId");
  pgm.createIndex("payout", "status");
  pgm.createIndex("payout", "payoutMethod");
  pgm.createIndex("payout", "periodStart");
  pgm.createIndex("payout", "periodEnd");
  pgm.createIndex("payout", "gatewayPayoutId");
  pgm.createIndex("payout", "transactionReference");
  pgm.createIndex("payout", "completedAt");
  pgm.createIndex("payout", "createdAt");

  // Create payout item table (payments included in a payout)
  pgm.createTable("payout_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    payoutId: { type: "uuid", notNull: true, references: "payout", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('payment', 'refund', 'dispute', 'fee', 'adjustment', 'other')"
    },
    amount: { type: "decimal(15,2)", notNull: true },
    fee: { type: "decimal(15,2)", notNull: true, default: 0 },
    netAmount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    description: { type: "text" },
    orderId: { type: "uuid", references: "order" },
    paymentId: { type: "uuid", references: "order_payment" },
    refundId: { type: "uuid", references: "order_refund" },
    disputeId: { type: "uuid", references: "payment_dispute" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payout items
  pgm.createIndex("payout_item", "payoutId");
  pgm.createIndex("payout_item", "type");
  pgm.createIndex("payout_item", "orderId");
  pgm.createIndex("payout_item", "paymentId");
  pgm.createIndex("payout_item", "refundId");
  pgm.createIndex("payout_item", "disputeId");

  // Create payment balance table (running balances for merchants)
  pgm.createTable("payment_balance", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    availableAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    pendingAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    reservedAmount: { type: "decimal(15,2)", notNull: true, default: 0 }, // For disputes, potential refunds
    totalVolume: { type: "decimal(15,2)", notNull: true, default: 0 }, // Lifetime volume
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    lastPayoutDate: { type: "timestamp" },
    nextPayoutDate: { type: "timestamp" },
    nextPayoutAmount: { type: "decimal(15,2)" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment balances
  pgm.createIndex("payment_balance", ["merchantId", "currencyCode"], { unique: true });

  // Create payment fee table
  pgm.createTable("payment_fee", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('transaction', 'subscription', 'dispute', 'refund', 'chargeback', 'payout', 'platform', 'other')"
    },
    amount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    description: { type: "text" },
    paymentId: { type: "uuid", references: "order_payment" },
    orderId: { type: "uuid", references: "order" },
    subscriptionId: { type: "uuid", references: "payment_subscription" },
    payoutId: { type: "uuid", references: "payout" },
    appliedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment fees
  pgm.createIndex("payment_fee", "merchantId");
  pgm.createIndex("payment_fee", "type");
  pgm.createIndex("payment_fee", "paymentId");
  pgm.createIndex("payment_fee", "orderId");
  pgm.createIndex("payment_fee", "subscriptionId");
  pgm.createIndex("payment_fee", "payoutId");
  pgm.createIndex("payment_fee", "appliedAt");

  // Create payment report table
  pgm.createTable("payment_report", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
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
    dateRange: { 
      type: "tstzrange",
      notNull: true
    },
    status: { 
      type: "varchar(20)", 
      notNull: true,
      check: "status IN ('pending', 'processing', 'completed', 'failed')",
      default: "'pending'"
    },
    fileUrl: { type: "text" },
    errorMessage: { type: "text" },
    notifyEmail: { type: "varchar(255)" },
    createdBy: { type: "uuid" }, // Reference to admin or user
    completedAt: { type: "timestamp" },
    expiresAt: { type: "timestamp" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for payment reports
  pgm.createIndex("payment_report", "merchantId");
  pgm.createIndex("payment_report", "type");
  pgm.createIndex("payment_report", "status");
  pgm.createIndex("payment_report", "createdBy");
  pgm.createIndex("payment_report", "createdAt");
  pgm.createIndex("payment_report", "expiresAt");

  // Insert sample payout settings
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO payout_settings (
      merchantId,
      frequency,
      minimumAmount,
      payoutDay,
      holdPeriod,
      automaticPayouts,
      providerSettings
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      'weekly',
      25.00,
      2, -- Tuesday
      3, -- 3 days hold
      true,
      '{"accountVerified": true, "defaultDescription": "Weekly payout", "instantPayouts": false}'
    )
  `);

  // Insert sample payment balance
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO payment_balance (
      merchantId,
      availableAmount,
      pendingAmount,
      reservedAmount,
      totalVolume,
      lastPayoutDate,
      nextPayoutDate,
      nextPayoutAmount
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      1250.00,
      350.75,
      100.00,
      15350.25,
      NOW() - INTERVAL '7 days',
      NOW() + INTERVAL '7 days',
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
