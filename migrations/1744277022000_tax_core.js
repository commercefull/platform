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
  // Create tax calculation method enum
  pgm.createType("tax_calculation_method", [
    "unit_based", // Tax is calculated per line item
    "row_based",  // Tax is calculated per row total
    "total_based" // Tax is calculated on the order total
  ]);

  // Create tax rate type enum
  pgm.createType("tax_rate_type", [
    "percentage",   // Tax rate as a percentage
    "fixed_amount", // Fixed tax amount
    "compound",     // Compound tax (tax on tax)
    "combined"      // Combination of percentage and fixed
  ]);

  // Create tax category table
  pgm.createTable("tax_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    isDefault: { type: "boolean", notNull: true, default: false },
    sortOrder: { type: "integer", notNull: true, default: 0 },
    isActive: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax categories
  pgm.createIndex("tax_category", "code");
  pgm.createIndex("tax_category", "isDefault");
  pgm.createIndex("tax_category", "isActive");
  pgm.createIndex("tax_category", "sortOrder");

  // Create tax zone table
  pgm.createTable("tax_zone", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    isDefault: { type: "boolean", notNull: true, default: false },
    countries: { type: "varchar(2)[]", notNull: true }, // Array of country codes
    states: { type: "varchar(10)[]" }, // Array of state/province codes
    postcodes: { type: "text[]" }, // Array of postcode/zip patterns
    cities: { type: "text[]" }, // Array of city names
    isActive: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax zones
  pgm.createIndex("tax_zone", "code");
  pgm.createIndex("tax_zone", "isDefault");
  pgm.createIndex("tax_zone", "isActive");
  pgm.createIndex("tax_zone", "countries", { method: "gin" });
  pgm.createIndex("tax_zone", "states", { method: "gin" });
  pgm.createIndex("tax_zone", "postcodes", { method: "gin" });
  pgm.createIndex("tax_zone", "cities", { method: "gin" });

  // Create tax rate table
  pgm.createTable("tax_rate", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    taxCategoryId: { type: "uuid", notNull: true, references: "tax_category", onDelete: "CASCADE" },
    taxZoneId: { type: "uuid", notNull: true, references: "tax_zone", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    rate: { type: "decimal(10,6)", notNull: true }, // Tax rate value (percentage or fixed amount)
    type: { type: "tax_rate_type", notNull: true, default: "percentage" },
    priority: { type: "integer", notNull: true, default: 0 }, // For compound taxes - order of application
    isCompound: { type: "boolean", notNull: true, default: false }, // Whether this tax is applied on top of other taxes
    includeInPrice: { type: "boolean", notNull: true, default: false }, // Whether tax is included in product prices
    isShippingTaxable: { type: "boolean", notNull: true, default: false }, // Whether shipping is taxable
    fixedAmount: { type: "decimal(15,2)" }, // Used for fixed amount taxes
    minimumAmount: { type: "decimal(15,2)" }, // Minimum order amount to charge tax
    maximumAmount: { type: "decimal(15,2)" }, // Maximum order amount to charge tax
    threshold: { type: "decimal(15,2)" }, // Threshold amount for tax application
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" },
    isActive: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax rates
  pgm.createIndex("tax_rate", "taxCategoryId");
  pgm.createIndex("tax_rate", "taxZoneId");
  pgm.createIndex("tax_rate", "rate");
  pgm.createIndex("tax_rate", "type");
  pgm.createIndex("tax_rate", "priority");
  pgm.createIndex("tax_rate", "isCompound");
  pgm.createIndex("tax_rate", "includeInPrice");
  pgm.createIndex("tax_rate", "isShippingTaxable");
  pgm.createIndex("tax_rate", "startDate");
  pgm.createIndex("tax_rate", "endDate");
  pgm.createIndex("tax_rate", "isActive");
  pgm.createIndex("tax_rate", ["taxCategoryId", "taxZoneId", "priority"], {
    unique: true
  });

  // Create tax rule table
  pgm.createTable("tax_rule", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    taxRateId: { type: "uuid", notNull: true, references: "tax_rate", onDelete: "CASCADE" },
    name: { type: "varchar(100)" },
    description: { type: "text" },
    conditionType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "conditionType IN ('customer_group', 'product_attribute', 'minimum_amount', 'time_period', 'day_of_week', 'shipping_method', 'payment_method')" 
    },
    conditionValue: { type: "jsonb", notNull: true }, // Condition parameters
    sortOrder: { type: "integer", notNull: true, default: 0 },
    isActive: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax rules
  pgm.createIndex("tax_rule", "taxRateId");
  pgm.createIndex("tax_rule", "conditionType");
  pgm.createIndex("tax_rule", "sortOrder");
  pgm.createIndex("tax_rule", "isActive");

  // Create tax settings table
  pgm.createTable("tax_settings", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", unique: true },
    calculationMethod: { type: "tax_calculation_method", notNull: true, default: "unit_based" },
    pricesIncludeTax: { type: "boolean", notNull: true, default: false },
    displayPricesWithTax: { type: "boolean", notNull: true, default: false },
    taxBasedOn: { 
      type: "varchar(50)", 
      notNull: true,
      check: "taxBasedOn IN ('shipping_address', 'billing_address', 'store_address', 'origin_address')",
      default: "'shipping_address'"
    },
    shippingTaxClass: { type: "uuid", references: "tax_category" },
    displayTaxTotals: { 
      type: "varchar(50)", 
      notNull: true,
      check: "displayTaxTotals IN ('itemized', 'combined', 'none')",
      default: "'itemized'"
    },
    applyTaxToShipping: { type: "boolean", notNull: true, default: true },
    applyDiscountBeforeTax: { type: "boolean", notNull: true, default: true },
    roundTaxAtSubtotal: { type: "boolean", notNull: true, default: false },
    taxDecimalPlaces: { type: "integer", notNull: true, default: 2 },
    defaultTaxCategory: { type: "uuid", references: "tax_category" },
    defaultTaxZone: { type: "uuid", references: "tax_zone" },
    taxProvider: { 
      type: "varchar(50)", 
      check: "taxProvider IN ('internal', 'avalara', 'taxjar', 'external')",
      default: "'internal'"
    },
    taxProviderSettings: { type: "jsonb" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax settings
  pgm.createIndex("tax_settings", "merchantId");
  pgm.createIndex("tax_settings", "calculationMethod");
  pgm.createIndex("tax_settings", "taxBasedOn");
  pgm.createIndex("tax_settings", "shippingTaxClass");
  pgm.createIndex("tax_settings", "defaultTaxCategory");
  pgm.createIndex("tax_settings", "defaultTaxZone");
  pgm.createIndex("tax_settings", "taxProvider");

  // Insert sample data for core tax tables
  pgm.sql(`
    -- Insert sample tax categories
    INSERT INTO tax_category (
      name,
      code,
      description,
      isDefault,
      isActive
    )
    VALUES 
    (
      'Standard Rate',
      'standard',
      'Standard tax rate for most products',
      true,
      true
    ),
    (
      'Reduced Rate',
      'reduced',
      'Reduced tax rate for essential goods',
      false,
      true
    ),
    (
      'Zero Rate',
      'zero',
      'Zero tax rate for exempt goods',
      false,
      true
    );
  `);

  pgm.sql(`
    -- Insert sample tax zones
    INSERT INTO tax_zone (
      name,
      code,
      description,
      isDefault,
      countries,
      states,
      isActive
    )
    VALUES 
    (
      'US - All States',
      'us-all',
      'All United States',
      true,
      ARRAY['US'],
      NULL,
      true
    ),
    (
      'US - California',
      'us-ca',
      'California State',
      false,
      ARRAY['US'],
      ARRAY['CA'],
      true
    ),
    (
      'EU - Standard',
      'eu-standard',
      'Standard EU zone',
      false,
      ARRAY['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'GR', 'IE'],
      NULL,
      true
    ),
    (
      'UK',
      'uk',
      'United Kingdom',
      false,
      ARRAY['GB'],
      NULL,
      true
    );
  `);

  pgm.sql(`
    -- Insert sample tax rates
    WITH 
      standard_cat AS (SELECT id FROM tax_category WHERE code = 'standard'),
      reduced_cat AS (SELECT id FROM tax_category WHERE code = 'reduced'),
      zero_cat AS (SELECT id FROM tax_category WHERE code = 'zero'),
      us_all_zone AS (SELECT id FROM tax_zone WHERE code = 'us-all'),
      us_ca_zone AS (SELECT id FROM tax_zone WHERE code = 'us-ca'),
      eu_zone AS (SELECT id FROM tax_zone WHERE code = 'eu-standard'),
      uk_zone AS (SELECT id FROM tax_zone WHERE code = 'uk')
    INSERT INTO tax_rate (
      taxCategoryId,
      taxZoneId,
      name,
      rate,
      type,
      priority,
      isCompound,
      includeInPrice,
      isShippingTaxable,
      isActive
    )
    VALUES 
    (
      (SELECT id FROM standard_cat),
      (SELECT id FROM us_all_zone),
      'US Sales Tax',
      6.00,
      'percentage',
      1,
      false,
      false,
      true,
      true
    ),
    (
      (SELECT id FROM standard_cat),
      (SELECT id FROM us_ca_zone),
      'California Sales Tax',
      8.25,
      'percentage',
      1,
      false,
      false,
      true,
      true
    ),
    (
      (SELECT id FROM standard_cat),
      (SELECT id FROM eu_zone),
      'EU VAT Standard',
      21.00,
      'percentage',
      1,
      false,
      true,
      true,
      true
    ),
    (
      (SELECT id FROM reduced_cat),
      (SELECT id FROM eu_zone),
      'EU VAT Reduced',
      10.00,
      'percentage',
      1,
      false,
      true,
      true,
      true
    ),
    (
      (SELECT id FROM standard_cat),
      (SELECT id FROM uk_zone),
      'UK VAT Standard',
      20.00,
      'percentage',
      1,
      false,
      true,
      true,
      true
    ),
    (
      (SELECT id FROM reduced_cat),
      (SELECT id FROM uk_zone),
      'UK VAT Reduced',
      5.00,
      'percentage',
      1,
      false,
      true,
      true,
      true
    ),
    (
      (SELECT id FROM zero_cat),
      (SELECT id FROM uk_zone),
      'UK VAT Zero',
      0.00,
      'percentage',
      1,
      false,
      true,
      false,
      true
    );
  `);

  pgm.sql(`
    -- Insert sample tax settings
    WITH 
      sample_merchant AS (SELECT id FROM merchant LIMIT 1),
      standard_cat AS (SELECT id FROM tax_category WHERE code = 'standard'),
      us_all_zone AS (SELECT id FROM tax_zone WHERE code = 'us-all')
    INSERT INTO tax_settings (
      merchantId,
      calculationMethod,
      pricesIncludeTax,
      displayPricesWithTax,
      taxBasedOn,
      displayTaxTotals,
      applyTaxToShipping,
      applyDiscountBeforeTax,
      defaultTaxCategory,
      defaultTaxZone,
      taxProvider
    )
    SELECT
      sample_merchant.id,
      'unit_based',
      false,
      true,
      'shipping_address',
      'itemized',
      true,
      true,
      standard_cat.id,
      us_all_zone.id,
      'internal'
    FROM 
      sample_merchant, 
      standard_cat, 
      us_all_zone
    WHERE EXISTS (SELECT 1 FROM sample_merchant);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable("tax_settings");
  pgm.dropTable("tax_rule");
  pgm.dropTable("tax_rate");
  pgm.dropTable("tax_zone");
  pgm.dropTable("tax_category");

  // Drop enum types
  pgm.dropType("tax_rate_type");
  pgm.dropType("tax_calculation_method");
};
