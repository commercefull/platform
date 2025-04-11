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
  // Create tax calculation status enum
  pgm.createType("tax_calculation_status", [
    "pending",    // Calculation in progress
    "completed",  // Calculation completed successfully
    "failed",     // Calculation failed
    "adjusted",   // Tax was manually adjusted
    "refunded"    // Tax was refunded
  ]);

  // Create tax transaction source enum
  pgm.createType("tax_transaction_source", [
    "order",
    "invoice",
    "refund",
    "adjustment",
    "manual",
    "estimate"
  ]);

  // Create tax calculation log table
  pgm.createTable("tax_calculation", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    order_id: { type: "uuid", references: "order" },
    invoice_id: { type: "uuid" }, // Reference to invoice if applicable
    basket_id: { type: "uuid", references: "basket" },
    customer_id: { type: "uuid", references: "customer" },
    calculation_method: { type: "tax_calculation_method", notNull: true },
    status: { type: "tax_calculation_status", notNull: true, default: "pending" },
    source_type: { type: "tax_transaction_source", notNull: true },
    source_id: { type: "uuid" }, // ID of the source entity
    tax_address: { type: "jsonb" }, // Address used for tax calculation
    taxable_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    tax_exempt_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    tax_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    total_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    exchange_rate: { type: "decimal(15,6)", notNull: true, default: 1.0 },
    tax_provider_response: { type: "jsonb" }, // Raw response from tax provider
    tax_provider_reference: { type: "varchar(255)" }, // Reference ID from tax provider
    error_message: { type: "text" }, // Error message if calculation failed
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax calculation
  pgm.createIndex("tax_calculation", "merchant_id");
  pgm.createIndex("tax_calculation", "order_id");
  pgm.createIndex("tax_calculation", "invoice_id");
  pgm.createIndex("tax_calculation", "basket_id");
  pgm.createIndex("tax_calculation", "customer_id");
  pgm.createIndex("tax_calculation", "status");
  pgm.createIndex("tax_calculation", "source_type");
  pgm.createIndex("tax_calculation", "source_id");
  pgm.createIndex("tax_calculation", "tax_provider_reference");
  pgm.createIndex("tax_calculation", "created_at");

  // Create tax calculation line items table
  pgm.createTable("tax_calculation_line", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    calculation_id: { type: "uuid", notNull: true, references: "tax_calculation", onDelete: "CASCADE" },
    line_item_id: { type: "uuid" }, // ID of the original line item (order item, etc.)
    line_item_type: { type: "varchar(50)", notNull: true }, // Type of line item (product, shipping, etc.)
    product_id: { type: "uuid", references: "product" },
    variant_id: { type: "uuid", references: "product_variant" },
    sku: { type: "varchar(255)" },
    name: { type: "varchar(255)", notNull: true },
    quantity: { type: "integer", notNull: true, default: 1 },
    unit_price: { type: "decimal(15,2)", notNull: true },
    line_total: { type: "decimal(15,2)", notNull: true },
    discount_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    taxable_amount: { type: "decimal(15,2)", notNull: true },
    tax_exempt_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    tax_category_id: { type: "uuid", references: "tax_category" },
    tax_category_code: { type: "varchar(50)" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax calculation lines
  pgm.createIndex("tax_calculation_line", "calculation_id");
  pgm.createIndex("tax_calculation_line", "line_item_id");
  pgm.createIndex("tax_calculation_line", "line_item_type");
  pgm.createIndex("tax_calculation_line", "product_id");
  pgm.createIndex("tax_calculation_line", "variant_id");
  pgm.createIndex("tax_calculation_line", "tax_category_id");
  pgm.createIndex("tax_calculation_line", "sku");

  // Create tax applied table (detail of taxes applied to each item)
  pgm.createTable("tax_calculation_applied", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    calculation_id: { type: "uuid", notNull: true, references: "tax_calculation", onDelete: "CASCADE" },
    calculation_line_id: { type: "uuid", references: "tax_calculation_line", onDelete: "CASCADE" },
    tax_rate_id: { type: "uuid", references: "tax_rate" },
    tax_rate_name: { type: "varchar(100)", notNull: true },
    tax_zone_id: { type: "uuid", references: "tax_zone" },
    tax_zone_name: { type: "varchar(100)" },
    tax_category_id: { type: "uuid", references: "tax_category" },
    tax_category_name: { type: "varchar(100)" },
    jurisdiction_level: {
      type: "varchar(50)",
      notNull: true,
      check: "jurisdiction_level IN ('country', 'state', 'county', 'city', 'district', 'special')"
    },
    jurisdiction_name: { type: "varchar(100)", notNull: true },
    rate: { type: "decimal(10,6)", notNull: true },
    is_compound: { type: "boolean", notNull: true, default: false },
    taxable_amount: { type: "decimal(15,2)", notNull: true },
    tax_amount: { type: "decimal(15,2)", notNull: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax applied
  pgm.createIndex("tax_calculation_applied", "calculation_id");
  pgm.createIndex("tax_calculation_applied", "calculation_line_id");
  pgm.createIndex("tax_calculation_applied", "tax_rate_id");
  pgm.createIndex("tax_calculation_applied", "tax_zone_id");
  pgm.createIndex("tax_calculation_applied", "tax_category_id");
  pgm.createIndex("tax_calculation_applied", "jurisdiction_level");
  pgm.createIndex("tax_calculation_applied", "jurisdiction_name");

  // Create tax report table
  pgm.createTable("tax_report", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    report_type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "report_type IN ('sales', 'filing', 'jurisdiction', 'summary', 'exemption', 'audit')" 
    },
    date_from: { type: "timestamp", notNull: true },
    date_to: { type: "timestamp", notNull: true },
    tax_jurisdictions: { type: "jsonb" }, // List of jurisdictions included
    file_url: { type: "text" }, // URL to download the file
    file_format: { 
      type: "varchar(20)",
      check: "file_format IN ('csv', 'xlsx', 'pdf', 'json')"
    },
    status: { 
      type: "varchar(50)",
      notNull: true,
      check: "status IN ('pending', 'processing', 'completed', 'failed')",
      default: "'pending'"
    },
    generated_by: { type: "uuid", references: "admin_user" },
    parameters: { type: "jsonb" }, // Report parameters
    results: { type: "jsonb" }, // Summary results
    error_message: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax reports
  pgm.createIndex("tax_report", "merchant_id");
  pgm.createIndex("tax_report", "report_type");
  pgm.createIndex("tax_report", "date_from");
  pgm.createIndex("tax_report", "date_to");
  pgm.createIndex("tax_report", "status");
  pgm.createIndex("tax_report", "generated_by");
  pgm.createIndex("tax_report", "created_at");

  // Create tax provider logs table
  pgm.createTable("tax_provider_log", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    provider: { 
      type: "varchar(50)", 
      notNull: true,
      check: "provider IN ('internal', 'avalara', 'taxjar', 'external')" 
    },
    request_type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "request_type IN ('calculation', 'verification', 'filing', 'refund', 'adjustment', 'validation')" 
    },
    entity_type: { 
      type: "varchar(50)",
      notNull: true
    },
    entity_id: { type: "uuid" },
    request_data: { type: "jsonb" },
    response_data: { type: "jsonb" },
    response_status: { type: "integer" },
    is_success: { type: "boolean", notNull: true },
    error_code: { type: "varchar(100)" },
    error_message: { type: "text" },
    processing_time_ms: { type: "integer" },
    provider_reference: { type: "varchar(255)" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax provider logs
  pgm.createIndex("tax_provider_log", "merchant_id");
  pgm.createIndex("tax_provider_log", "provider");
  pgm.createIndex("tax_provider_log", "request_type");
  pgm.createIndex("tax_provider_log", "entity_type");
  pgm.createIndex("tax_provider_log", "entity_id");
  pgm.createIndex("tax_provider_log", "is_success");
  pgm.createIndex("tax_provider_log", "provider_reference");
  pgm.createIndex("tax_provider_log", "created_at");

  // Add tax_nexus table for tracking where a merchant has tax obligations
  pgm.createTable("tax_nexus", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    country: { type: "varchar(2)", notNull: true },
    region: { type: "varchar(100)" }, // State/province/region
    region_code: { type: "varchar(10)" }, // State/province code
    city: { type: "varchar(100)" },
    postal_code: { type: "varchar(20)" },
    street_address: { type: "text" },
    tax_id: { type: "varchar(100)" }, // Tax registration number
    registration_number: { type: "varchar(100)" }, // Business registration
    is_default: { type: "boolean", notNull: true, default: false },
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    end_date: { type: "timestamp" },
    is_active: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax nexus
  pgm.createIndex("tax_nexus", "merchant_id");
  pgm.createIndex("tax_nexus", "country");
  pgm.createIndex("tax_nexus", "region_code");
  pgm.createIndex("tax_nexus", "city");
  pgm.createIndex("tax_nexus", "postal_code");
  pgm.createIndex("tax_nexus", "is_default");
  pgm.createIndex("tax_nexus", "is_active");
  pgm.createIndex("tax_nexus", "start_date");
  pgm.createIndex("tax_nexus", "end_date");

  // Insert sample tax nexus
  pgm.sql(`
    -- Insert sample tax nexus
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO tax_nexus (
      merchant_id,
      name,
      country,
      region,
      region_code,
      city,
      postal_code,
      street_address,
      tax_id,
      is_default,
      is_active
    )
    SELECT
      id,
      'Main Office',
      'US',
      'California',
      'CA',
      'San Francisco',
      '94105',
      '123 Market Street',
      '123-45-6789',
      true,
      true
    FROM
      sample_merchant
    WHERE
      EXISTS (SELECT 1 FROM sample_merchant);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable("tax_nexus");
  pgm.dropTable("tax_provider_log");
  pgm.dropTable("tax_report");
  pgm.dropTable("tax_calculation_applied");
  pgm.dropTable("tax_calculation_line");
  pgm.dropTable("tax_calculation");

  // Drop enum types
  pgm.dropType("tax_transaction_source");
  pgm.dropType("tax_calculation_status");
};
