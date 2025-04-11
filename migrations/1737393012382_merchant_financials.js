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
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    available_balance: { type: "decimal(15,2)", notNull: true, default: 0 },
    pending_balance: { type: "decimal(15,2)", notNull: true, default: 0 },
    reserve_balance: { type: "decimal(15,2)", notNull: true, default: 0 }, // Reserved for disputes/chargebacks
    lifetime_revenue: { type: "decimal(15,2)", notNull: true, default: 0 },
    lifetime_commission: { type: "decimal(15,2)", notNull: true, default: 0 },
    lifetime_payout: { type: "decimal(15,2)", notNull: true, default: 0 },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    last_payout_date: { type: "timestamp" },
    next_scheduled_payout_date: { type: "timestamp" },
    is_payout_held: { type: "boolean", notNull: true, default: false },
    payout_hold_reason: { type: "text" },
    metadata: { type: "jsonb" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant balances
  pgm.createIndex("merchant_balance", "merchant_id", { unique: true });
  pgm.createIndex("merchant_balance", "available_balance");
  pgm.createIndex("merchant_balance", "pending_balance");
  pgm.createIndex("merchant_balance", "reserve_balance");
  pgm.createIndex("merchant_balance", "last_payout_date");
  pgm.createIndex("merchant_balance", "next_scheduled_payout_date");
  pgm.createIndex("merchant_balance", "is_payout_held");

  // Create merchant transaction table
  pgm.createTable("merchant_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    transaction_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "transaction_type IN ('sale', 'refund', 'chargeback', 'commission', 'adjustment', 'payout', 'fee')" 
    },
    amount: { type: "decimal(15,2)", notNull: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    reference_id: { type: "uuid" }, // Order ID, payout ID, etc.
    reference_type: { type: "varchar(50)" }, // 'order', 'payout', etc.
    description: { type: "text" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'completed',
      check: "status IN ('pending', 'completed', 'failed', 'cancelled')" 
    },
    available_balance_before: { type: "decimal(15,2)" },
    available_balance_after: { type: "decimal(15,2)" },
    pending_balance_before: { type: "decimal(15,2)" },
    pending_balance_after: { type: "decimal(15,2)" },
    reserve_balance_before: { type: "decimal(15,2)" },
    reserve_balance_after: { type: "decimal(15,2)" },
    metadata: { type: "jsonb" },
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for merchant transactions
  pgm.createIndex("merchant_transaction", "merchant_id");
  pgm.createIndex("merchant_transaction", "transaction_type");
  pgm.createIndex("merchant_transaction", "amount");
  pgm.createIndex("merchant_transaction", "currency");
  pgm.createIndex("merchant_transaction", "reference_id");
  pgm.createIndex("merchant_transaction", "reference_type");
  pgm.createIndex("merchant_transaction", "status");
  pgm.createIndex("merchant_transaction", "created_at");

  // Create merchant payout table
  pgm.createTable("merchant_payout", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    payment_info_id: { type: "uuid", references: "merchant_payment_info" },
    amount: { type: "decimal(15,2)", notNull: true },
    fee: { type: "decimal(15,2)", notNull: true, default: 0 },
    net_amount: { type: "decimal(15,2)", notNull: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    payout_method: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "payout_method IN ('bank_transfer', 'paypal', 'stripe', 'check', 'other')" 
    },
    transaction_id: { type: "varchar(255)" }, // External transaction ID
    reference: { type: "varchar(255)" }, // Payout reference number
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')" 
    },
    notes: { type: "text" },
    start_date: { type: "timestamp" }, // Period start covered by payout
    end_date: { type: "timestamp" }, // Period end covered by payout
    requested_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    processed_at: { type: "timestamp" }, // When it was processed
    completed_at: { type: "timestamp" }, // When it was completed
    failure_reason: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" }
  });

  // Create indexes for merchant payouts
  pgm.createIndex("merchant_payout", "merchant_id");
  pgm.createIndex("merchant_payout", "payment_info_id");
  pgm.createIndex("merchant_payout", "amount");
  pgm.createIndex("merchant_payout", "currency");
  pgm.createIndex("merchant_payout", "payout_method");
  pgm.createIndex("merchant_payout", "transaction_id");
  pgm.createIndex("merchant_payout", "reference");
  pgm.createIndex("merchant_payout", "status");
  pgm.createIndex("merchant_payout", "start_date");
  pgm.createIndex("merchant_payout", "end_date");
  pgm.createIndex("merchant_payout", "requested_at");
  pgm.createIndex("merchant_payout", "processed_at");
  pgm.createIndex("merchant_payout", "completed_at");

  // Create merchant payout item table
  pgm.createTable("merchant_payout_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    payout_id: { type: "uuid", notNull: true, references: "merchant_payout", onDelete: "CASCADE" },
    order_id: { type: "uuid", references: "order" },
    merchant_order_id: { type: "uuid", references: "merchant_order" },
    amount: { type: "decimal(15,2)", notNull: true },
    description: { type: "text" },
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'order',
      check: "type IN ('order', 'adjustment', 'fee', 'refund')" 
    },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant payout items
  pgm.createIndex("merchant_payout_item", "payout_id");
  pgm.createIndex("merchant_payout_item", "order_id");
  pgm.createIndex("merchant_payout_item", "merchant_order_id");
  pgm.createIndex("merchant_payout_item", "amount");
  pgm.createIndex("merchant_payout_item", "type");

  // Create merchant invoice table
  pgm.createTable("merchant_invoice", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    invoice_number: { type: "varchar(50)", notNull: true, unique: true },
    payout_id: { type: "uuid", references: "merchant_payout" },
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
    invoice_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    due_date: { type: "timestamp" },
    paid_date: { type: "timestamp" },
    start_date: { type: "timestamp" }, // Period start
    end_date: { type: "timestamp" }, // Period end
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" }
  });

  // Create indexes for merchant invoices
  pgm.createIndex("merchant_invoice", "merchant_id");
  pgm.createIndex("merchant_invoice", "invoice_number");
  pgm.createIndex("merchant_invoice", "payout_id");
  pgm.createIndex("merchant_invoice", "amount");
  pgm.createIndex("merchant_invoice", "total");
  pgm.createIndex("merchant_invoice", "status");
  pgm.createIndex("merchant_invoice", "invoice_date");
  pgm.createIndex("merchant_invoice", "due_date");
  pgm.createIndex("merchant_invoice", "paid_date");
  pgm.createIndex("merchant_invoice", "start_date");
  pgm.createIndex("merchant_invoice", "end_date");

  // Create merchant tax info table
  pgm.createTable("merchant_tax_info", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    tax_identification_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "tax_identification_type IN ('ssn', 'ein', 'tin', 'vat', 'gst', 'other')" 
    },
    tax_identification_number: { type: "varchar(255)", notNull: true }, // Encrypted
    business_type: { 
      type: "varchar(50)", 
      check: "business_type IN ('individual', 'sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit')" 
    },
    legal_name: { type: "varchar(100)", notNull: true },
    tax_address: { type: "jsonb", notNull: true },
    is_verified: { type: "boolean", notNull: true, default: false },
    verified_at: { type: "timestamp" },
    verified_by: { type: "uuid" },
    verification_notes: { type: "text" },
    tax_form_filed: { type: "boolean", notNull: true, default: false },
    tax_form_type: { type: "varchar(20)" }, // W-9, W-8BEN, etc.
    tax_form_filed_at: { type: "timestamp" },
    tax_exempt: { type: "boolean", notNull: true, default: false },
    tax_exemption_reason: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for merchant tax info
  pgm.createIndex("merchant_tax_info", "merchant_id", { unique: true });
  pgm.createIndex("merchant_tax_info", "tax_identification_type");
  pgm.createIndex("merchant_tax_info", "is_verified");
  pgm.createIndex("merchant_tax_info", "tax_form_filed");
  pgm.createIndex("merchant_tax_info", "tax_exempt");

  // Insert sample merchant balance
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_balance" (
      merchant_id,
      available_balance,
      pending_balance,
      reserve_balance,
      lifetime_revenue,
      lifetime_commission,
      lifetime_payout,
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
      merchant_id,
      transaction_type,
      amount,
      currency,
      description,
      status,
      available_balance_before,
      available_balance_after
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
