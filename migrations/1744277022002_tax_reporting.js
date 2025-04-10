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
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    orderId: { type: "uuid", references: "order" },
    invoiceId: { type: "uuid" }, // Reference to invoice if applicable
    basketId: { type: "uuid", references: "basket" },
    customerId: { type: "uuid", references: "customer" },
    calculationMethod: { type: "tax_calculation_method", notNull: true },
    status: { type: "tax_calculation_status", notNull: true, default: "pending" },
    sourceType: { type: "tax_transaction_source", notNull: true },
    sourceId: { type: "uuid" }, // ID of the source entity
    taxAddress: { type: "jsonb" }, // Address used for tax calculation
    taxableAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    taxExemptAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    taxAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    totalAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    exchangeRate: { type: "decimal(15,6)", notNull: true, default: 1.0 },
    taxProviderResponse: { type: "jsonb" }, // Raw response from tax provider
    taxProviderReference: { type: "varchar(255)" }, // Reference ID from tax provider
    errorMessage: { type: "text" }, // Error message if calculation failed
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax calculation
  pgm.createIndex("tax_calculation", "merchantId");
  pgm.createIndex("tax_calculation", "orderId");
  pgm.createIndex("tax_calculation", "invoiceId");
  pgm.createIndex("tax_calculation", "basketId");
  pgm.createIndex("tax_calculation", "customerId");
  pgm.createIndex("tax_calculation", "status");
  pgm.createIndex("tax_calculation", "sourceType");
  pgm.createIndex("tax_calculation", "sourceId");
  pgm.createIndex("tax_calculation", "taxProviderReference");
  pgm.createIndex("tax_calculation", "createdAt");

  // Create tax calculation line items table
  pgm.createTable("tax_calculation_line", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    calculationId: { type: "uuid", notNull: true, references: "tax_calculation", onDelete: "CASCADE" },
    lineItemId: { type: "uuid" }, // ID of the original line item (order item, etc.)
    lineItemType: { type: "varchar(50)", notNull: true }, // Type of line item (product, shipping, etc.)
    productId: { type: "uuid", references: "product" },
    variantId: { type: "uuid", references: "productVariant" },
    sku: { type: "varchar(255)" },
    name: { type: "varchar(255)", notNull: true },
    quantity: { type: "integer", notNull: true, default: 1 },
    unitPrice: { type: "decimal(15,2)", notNull: true },
    lineTotal: { type: "decimal(15,2)", notNull: true },
    discountAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    taxableAmount: { type: "decimal(15,2)", notNull: true },
    taxExemptAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    taxCategoryId: { type: "uuid", references: "tax_category" },
    taxCategoryCode: { type: "varchar(50)" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax calculation lines
  pgm.createIndex("tax_calculation_line", "calculationId");
  pgm.createIndex("tax_calculation_line", "lineItemId");
  pgm.createIndex("tax_calculation_line", "lineItemType");
  pgm.createIndex("tax_calculation_line", "productId");
  pgm.createIndex("tax_calculation_line", "variantId");
  pgm.createIndex("tax_calculation_line", "taxCategoryId");
  pgm.createIndex("tax_calculation_line", "sku");

  // Create tax applied table (detail of taxes applied to each item)
  pgm.createTable("tax_calculation_applied", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    calculationId: { type: "uuid", notNull: true, references: "tax_calculation", onDelete: "CASCADE" },
    calculationLineId: { type: "uuid", references: "tax_calculation_line", onDelete: "CASCADE" },
    taxRateId: { type: "uuid", references: "tax_rate" },
    taxRateName: { type: "varchar(100)", notNull: true },
    taxZoneId: { type: "uuid", references: "tax_zone" },
    taxZoneName: { type: "varchar(100)" },
    taxCategoryId: { type: "uuid", references: "tax_category" },
    taxCategoryName: { type: "varchar(100)" },
    jurisdictionLevel: {
      type: "varchar(50)",
      notNull: true,
      check: "jurisdictionLevel IN ('country', 'state', 'county', 'city', 'district', 'special')"
    },
    jurisdictionName: { type: "varchar(100)", notNull: true },
    rate: { type: "decimal(10,6)", notNull: true },
    isCompound: { type: "boolean", notNull: true, default: false },
    taxableAmount: { type: "decimal(15,2)", notNull: true },
    taxAmount: { type: "decimal(15,2)", notNull: true },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax applied
  pgm.createIndex("tax_calculation_applied", "calculationId");
  pgm.createIndex("tax_calculation_applied", "calculationLineId");
  pgm.createIndex("tax_calculation_applied", "taxRateId");
  pgm.createIndex("tax_calculation_applied", "taxZoneId");
  pgm.createIndex("tax_calculation_applied", "taxCategoryId");
  pgm.createIndex("tax_calculation_applied", "jurisdictionLevel");
  pgm.createIndex("tax_calculation_applied", "jurisdictionName");

  // Create tax report table
  pgm.createTable("tax_report", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    reportType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "reportType IN ('sales', 'filing', 'jurisdiction', 'summary', 'exemption', 'audit')" 
    },
    dateFrom: { type: "timestamp", notNull: true },
    dateTo: { type: "timestamp", notNull: true },
    taxJurisdictions: { type: "jsonb" }, // List of jurisdictions included
    fileUrl: { type: "text" }, // URL to download the file
    fileFormat: { 
      type: "varchar(20)",
      check: "fileFormat IN ('csv', 'xlsx', 'pdf', 'json')"
    },
    status: { 
      type: "varchar(50)",
      notNull: true,
      check: "status IN ('pending', 'processing', 'completed', 'failed')",
      default: "'pending'"
    },
    generatedBy: { type: "uuid", references: "admin_user" },
    parameters: { type: "jsonb" }, // Report parameters
    results: { type: "jsonb" }, // Summary results
    errorMessage: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax reports
  pgm.createIndex("tax_report", "merchantId");
  pgm.createIndex("tax_report", "reportType");
  pgm.createIndex("tax_report", "dateFrom");
  pgm.createIndex("tax_report", "dateTo");
  pgm.createIndex("tax_report", "status");
  pgm.createIndex("tax_report", "generatedBy");
  pgm.createIndex("tax_report", "createdAt");

  // Create tax provider logs table
  pgm.createTable("tax_provider_log", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    provider: { 
      type: "varchar(50)", 
      notNull: true,
      check: "provider IN ('internal', 'avalara', 'taxjar', 'external')" 
    },
    requestType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "requestType IN ('calculation', 'verification', 'filing', 'refund', 'adjustment', 'validation')" 
    },
    entityType: { 
      type: "varchar(50)",
      notNull: true
    },
    entityId: { type: "uuid" },
    requestData: { type: "jsonb" },
    responseData: { type: "jsonb" },
    responseStatus: { type: "integer" },
    isSuccess: { type: "boolean", notNull: true },
    errorCode: { type: "varchar(100)" },
    errorMessage: { type: "text" },
    processingTimeMs: { type: "integer" },
    providerReference: { type: "varchar(255)" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax provider logs
  pgm.createIndex("tax_provider_log", "merchantId");
  pgm.createIndex("tax_provider_log", "provider");
  pgm.createIndex("tax_provider_log", "requestType");
  pgm.createIndex("tax_provider_log", "entityType");
  pgm.createIndex("tax_provider_log", "entityId");
  pgm.createIndex("tax_provider_log", "isSuccess");
  pgm.createIndex("tax_provider_log", "providerReference");
  pgm.createIndex("tax_provider_log", "createdAt");

  // Add tax_nexus table for tracking where a merchant has tax obligations
  pgm.createTable("tax_nexus", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    country: { type: "varchar(2)", notNull: true },
    region: { type: "varchar(100)" }, // State/province/region
    regionCode: { type: "varchar(10)" }, // State/province code
    city: { type: "varchar(100)" },
    postalCode: { type: "varchar(20)" },
    streetAddress: { type: "text" },
    taxId: { type: "varchar(100)" }, // Tax registration number
    registrationNumber: { type: "varchar(100)" }, // Business registration
    isDefault: { type: "boolean", notNull: true, default: false },
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" },
    isActive: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax nexus
  pgm.createIndex("tax_nexus", "merchantId");
  pgm.createIndex("tax_nexus", "country");
  pgm.createIndex("tax_nexus", "regionCode");
  pgm.createIndex("tax_nexus", "city");
  pgm.createIndex("tax_nexus", "postalCode");
  pgm.createIndex("tax_nexus", "isDefault");
  pgm.createIndex("tax_nexus", "isActive");
  pgm.createIndex("tax_nexus", "startDate");
  pgm.createIndex("tax_nexus", "endDate");

  // Insert sample tax nexus
  pgm.sql(`
    -- Insert sample tax nexus
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO tax_nexus (
      merchantId,
      name,
      country,
      region,
      regionCode,
      city,
      postalCode,
      streetAddress,
      taxId,
      isDefault,
      isActive
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
