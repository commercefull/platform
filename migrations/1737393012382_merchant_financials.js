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
  // Create merchant balance table
  pgm.createTable("merchant_balance", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    availableBalance: { type: "decimal(15,2)", notNull: true, default: 0 },
    pendingBalance: { type: "decimal(15,2)", notNull: true, default: 0 },
    reserveBalance: { type: "decimal(15,2)", notNull: true, default: 0 }, // Reserved for disputes/chargebacks
    lifetimeRevenue: { type: "decimal(15,2)", notNull: true, default: 0 },
    lifetimeCommission: { type: "decimal(15,2)", notNull: true, default: 0 },
    lifetimePayout: { type: "decimal(15,2)", notNull: true, default: 0 },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    lastPayoutDate: { type: "timestamp" },
    nextScheduledPayoutDate: { type: "timestamp" },
    isPayoutHeld: { type: "boolean", notNull: true, default: false },
    payoutHoldReason: { type: "text" },
    metadata: { type: "jsonb" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant balances
  pgm.createIndex("merchant_balance", "merchantId", { unique: true });
  pgm.createIndex("merchant_balance", "availableBalance");
  pgm.createIndex("merchant_balance", "pendingBalance");
  pgm.createIndex("merchant_balance", "reserveBalance");
  pgm.createIndex("merchant_balance", "lastPayoutDate");
  pgm.createIndex("merchant_balance", "nextScheduledPayoutDate");
  pgm.createIndex("merchant_balance", "isPayoutHeld");

  // Create merchant transaction table
  pgm.createTable("merchant_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    transactionType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "transactionType IN ('sale', 'refund', 'chargeback', 'commission', 'adjustment', 'payout', 'fee')" 
    },
    amount: { type: "decimal(15,2)", notNull: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    referenceId: { type: "uuid" }, // Order ID, payout ID, etc.
    referenceType: { type: "varchar(50)" }, // 'order', 'payout', etc.
    description: { type: "text" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'completed',
      check: "status IN ('pending', 'completed', 'failed', 'cancelled')" 
    },
    availableBalanceBefore: { type: "decimal(15,2)" },
    availableBalanceAfter: { type: "decimal(15,2)" },
    pendingBalanceBefore: { type: "decimal(15,2)" },
    pendingBalanceAfter: { type: "decimal(15,2)" },
    reserveBalanceBefore: { type: "decimal(15,2)" },
    reserveBalanceAfter: { type: "decimal(15,2)" },
    metadata: { type: "jsonb" },
    notes: { type: "text" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for merchant transactions
  pgm.createIndex("merchant_transaction", "merchantId");
  pgm.createIndex("merchant_transaction", "transactionType");
  pgm.createIndex("merchant_transaction", "amount");
  pgm.createIndex("merchant_transaction", "currency");
  pgm.createIndex("merchant_transaction", "referenceId");
  pgm.createIndex("merchant_transaction", "referenceType");
  pgm.createIndex("merchant_transaction", "status");
  pgm.createIndex("merchant_transaction", "createdAt");

  // Create merchant payout table
  pgm.createTable("merchant_payout", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    paymentInfoId: { type: "uuid", references: "merchant_payment_info" },
    amount: { type: "decimal(15,2)", notNull: true },
    fee: { type: "decimal(15,2)", notNull: true, default: 0 },
    netAmount: { type: "decimal(15,2)", notNull: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    payoutMethod: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "payoutMethod IN ('bank_transfer', 'paypal', 'stripe', 'check', 'other')" 
    },
    transactionId: { type: "varchar(255)" }, // External transaction ID
    reference: { type: "varchar(255)" }, // Payout reference number
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')" 
    },
    notes: { type: "text" },
    startDate: { type: "timestamp" }, // Period start covered by payout
    endDate: { type: "timestamp" }, // Period end covered by payout
    requestedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    processedAt: { type: "timestamp" }, // When it was processed
    completedAt: { type: "timestamp" }, // When it was completed
    failureReason: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" }
  });

  // Create indexes for merchant payouts
  pgm.createIndex("merchant_payout", "merchantId");
  pgm.createIndex("merchant_payout", "paymentInfoId");
  pgm.createIndex("merchant_payout", "amount");
  pgm.createIndex("merchant_payout", "currency");
  pgm.createIndex("merchant_payout", "payoutMethod");
  pgm.createIndex("merchant_payout", "transactionId");
  pgm.createIndex("merchant_payout", "reference");
  pgm.createIndex("merchant_payout", "status");
  pgm.createIndex("merchant_payout", "startDate");
  pgm.createIndex("merchant_payout", "endDate");
  pgm.createIndex("merchant_payout", "requestedAt");
  pgm.createIndex("merchant_payout", "processedAt");
  pgm.createIndex("merchant_payout", "completedAt");

  // Create merchant payout item table
  pgm.createTable("merchant_payout_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    payoutId: { type: "uuid", notNull: true, references: "merchant_payout", onDelete: "CASCADE" },
    orderId: { type: "uuid", references: "order" },
    merchantOrderId: { type: "uuid", references: "merchant_order" },
    amount: { type: "decimal(15,2)", notNull: true },
    description: { type: "text" },
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'order',
      check: "type IN ('order', 'adjustment', 'fee', 'refund')" 
    },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant payout items
  pgm.createIndex("merchant_payout_item", "payoutId");
  pgm.createIndex("merchant_payout_item", "orderId");
  pgm.createIndex("merchant_payout_item", "merchantOrderId");
  pgm.createIndex("merchant_payout_item", "amount");
  pgm.createIndex("merchant_payout_item", "type");

  // Create merchant invoice table
  pgm.createTable("merchant_invoice", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    invoiceNumber: { type: "varchar(50)", notNull: true, unique: true },
    payoutId: { type: "uuid", references: "merchant_payout" },
    amount: { type: "decimal(15,2)", notNull: true },
    tax: { type: "decimal(15,2)", notNull: true, default: 0 },
    total: { type: "decimal(15,2)", notNull: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'draft',
      check: "status IN ('draft', 'issued', 'paid', 'cancelled', 'void')" 
    },
    invoiceDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    dueDate: { type: "timestamp" },
    paidDate: { type: "timestamp" },
    startDate: { type: "timestamp" }, // Period start
    endDate: { type: "timestamp" }, // Period end
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" }
  });

  // Create indexes for merchant invoices
  pgm.createIndex("merchant_invoice", "merchantId");
  pgm.createIndex("merchant_invoice", "invoiceNumber");
  pgm.createIndex("merchant_invoice", "payoutId");
  pgm.createIndex("merchant_invoice", "amount");
  pgm.createIndex("merchant_invoice", "total");
  pgm.createIndex("merchant_invoice", "status");
  pgm.createIndex("merchant_invoice", "invoiceDate");
  pgm.createIndex("merchant_invoice", "dueDate");
  pgm.createIndex("merchant_invoice", "paidDate");
  pgm.createIndex("merchant_invoice", "startDate");
  pgm.createIndex("merchant_invoice", "endDate");

  // Create merchant tax info table
  pgm.createTable("merchant_tax_info", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    taxIdentificationType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "taxIdentificationType IN ('ssn', 'ein', 'tin', 'vat', 'gst', 'other')" 
    },
    taxIdentificationNumber: { type: "varchar(255)", notNull: true }, // Encrypted
    businessType: { 
      type: "varchar(50)", 
      check: "businessType IN ('individual', 'sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit')" 
    },
    legalName: { type: "varchar(100)", notNull: true },
    taxAddress: { type: "jsonb", notNull: true },
    isVerified: { type: "boolean", notNull: true, default: false },
    verifiedAt: { type: "timestamp" },
    verifiedBy: { type: "uuid" },
    verificationNotes: { type: "text" },
    taxFormFiled: { type: "boolean", notNull: true, default: false },
    taxFormType: { type: "varchar(20)" }, // W-9, W-8BEN, etc.
    taxFormFiledAt: { type: "timestamp" },
    taxExempt: { type: "boolean", notNull: true, default: false },
    taxExemptionReason: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for merchant tax info
  pgm.createIndex("merchant_tax_info", "merchantId", { unique: true });
  pgm.createIndex("merchant_tax_info", "taxIdentificationType");
  pgm.createIndex("merchant_tax_info", "isVerified");
  pgm.createIndex("merchant_tax_info", "taxFormFiled");
  pgm.createIndex("merchant_tax_info", "taxExempt");

  // Insert sample merchant balance
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_balance" (
      merchantId,
      availableBalance,
      pendingBalance,
      reserveBalance,
      lifetimeRevenue,
      lifetimeCommission,
      lifetimePayout,
      currency
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      1000.00,
      250.00,
      50.00,
      5000.00,
      500.00,
      3500.00,
      'USD'
    )
  `);

  // Insert sample merchant transaction
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_transaction" (
      merchantId,
      transactionType,
      amount,
      currency,
      description,
      status,
      availableBalanceBefore,
      availableBalanceAfter
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      'sale',
      150.00,
      'USD',
      'Sample sale transaction',
      'completed',
      850.00,
      1000.00
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("merchant_tax_info");
  pgm.dropTable("merchant_invoice");
  pgm.dropTable("merchant_payout_item");
  pgm.dropTable("merchant_payout");
  pgm.dropTable("merchant_transaction");
  pgm.dropTable("merchant_balance");
};
