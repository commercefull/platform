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
    is_default: { type: "boolean", notNull: true, default: false },
    sort_order: { type: "integer", notNull: true, default: 0 },
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax categories
  pgm.createIndex("tax_category", "code");
  pgm.createIndex("tax_category", "is_default");
  pgm.createIndex("tax_category", "is_active");
  pgm.createIndex("tax_category", "sort_order");

  // Create tax zone table
  pgm.createTable("tax_zone", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    is_default: { type: "boolean", notNull: true, default: false },
    countries: { type: "varchar(2)[]", notNull: true }, // Array of country codes
    states: { type: "varchar(10)[]" }, // Array of state/province codes
    postcodes: { type: "text[]" }, // Array of postcode/zip patterns
    cities: { type: "text[]" }, // Array of city names
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax zones
  pgm.createIndex("tax_zone", "code");
  pgm.createIndex("tax_zone", "is_default");
  pgm.createIndex("tax_zone", "is_active");
  pgm.createIndex("tax_zone", "countries", { method: "gin" });
  pgm.createIndex("tax_zone", "states", { method: "gin" });
  pgm.createIndex("tax_zone", "postcodes", { method: "gin" });
  pgm.createIndex("tax_zone", "cities", { method: "gin" });

  // Create tax rate table
  pgm.createTable("tax_rate", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    tax_category_id: { type: "uuid", notNull: true, references: "tax_category", onDelete: "CASCADE" },
    tax_zone_id: { type: "uuid", notNull: true, references: "tax_zone", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    rate: { type: "decimal(10,6)", notNull: true }, // Tax rate value (percentage or fixed amount)
    type: { type: "tax_rate_type", notNull: true, default: "percentage" },
    priority: { type: "integer", notNull: true, default: 0 }, // For compound taxes - order of application
    is_compound: { type: "boolean", notNull: true, default: false }, // Whether this tax is applied on top of other taxes
    include_in_price: { type: "boolean", notNull: true, default: false }, // Whether tax is included in product prices
    is_shipping_taxable: { type: "boolean", notNull: true, default: false }, // Whether shipping is taxable
    fixed_amount: { type: "decimal(15,2)" }, // Used for fixed amount taxes
    minimum_amount: { type: "decimal(15,2)" }, // Minimum order amount to charge tax
    maximum_amount: { type: "decimal(15,2)" }, // Maximum order amount to charge tax
    threshold: { type: "decimal(15,2)" }, // Threshold amount for tax application
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    end_date: { type: "timestamp" },
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax rates
  pgm.createIndex("tax_rate", "tax_category_id");
  pgm.createIndex("tax_rate", "tax_zone_id");
  pgm.createIndex("tax_rate", "rate");
  pgm.createIndex("tax_rate", "type");
  pgm.createIndex("tax_rate", "priority");
  pgm.createIndex("tax_rate", "is_compound");
  pgm.createIndex("tax_rate", "include_in_price");
  pgm.createIndex("tax_rate", "is_shipping_taxable");
  pgm.createIndex("tax_rate", "start_date");
  pgm.createIndex("tax_rate", "end_date");
  pgm.createIndex("tax_rate", "is_active");
  pgm.createIndex("tax_rate", ["tax_category_id", "tax_zone_id", "priority"], {
    unique: true
  });

  // Create tax rule table
  pgm.createTable("tax_rule", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    tax_rate_id: { type: "uuid", notNull: true, references: "tax_rate", onDelete: "CASCADE" },
    name: { type: "varchar(100)" },
    description: { type: "text" },
    condition_type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "condition_type IN ('customer_group', 'product_attribute', 'minimum_amount', 'time_period', 'day_of_week', 'shipping_method', 'payment_method')" 
    },
    condition_value: { type: "jsonb", notNull: true }, // Condition parameters
    sort_order: { type: "integer", notNull: true, default: 0 },
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax rules
  pgm.createIndex("tax_rule", "tax_rate_id");
  pgm.createIndex("tax_rule", "condition_type");
  pgm.createIndex("tax_rule", "sort_order");
  pgm.createIndex("tax_rule", "is_active");

  // Create tax settings table
  pgm.createTable("tax_settings", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", unique: true },
    calculation_method: { type: "tax_calculation_method", notNull: true, default: "unit_based" },
    prices_include_tax: { type: "boolean", notNull: true, default: false },
    display_prices_with_tax: { type: "boolean", notNull: true, default: false },
    tax_based_on: { 
      type: "varchar(50)", 
      notNull: true,
      check: "tax_based_on IN ('shipping_address', 'billing_address', 'store_address', 'origin_address')",
      default: "'shipping_address'"
    },
    shipping_tax_class: { type: "uuid", references: "tax_category" },
    display_tax_totals: { 
      type: "varchar(50)", 
      notNull: true,
      check: "display_tax_totals IN ('itemized', 'combined', 'none')",
      default: "'itemized'"
    },
    apply_tax_to_shipping: { type: "boolean", notNull: true, default: true },
    apply_discount_before_tax: { type: "boolean", notNull: true, default: true },
    round_tax_at_subtotal: { type: "boolean", notNull: true, default: false },
    tax_decimal_places: { type: "integer", notNull: true, default: 2 },
    default_tax_category: { type: "uuid", references: "tax_category" },
    default_tax_zone: { type: "uuid", references: "tax_zone" },
    tax_provider: { 
      type: "varchar(50)", 
      check: "tax_provider IN ('internal', 'avalara', 'taxjar', 'external')",
      default: "'internal'"
    },
    tax_provider_settings: { type: "jsonb" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tax settings
  pgm.createIndex("tax_settings", "merchant_id");
  pgm.createIndex("tax_settings", "calculation_method");
  pgm.createIndex("tax_settings", "tax_based_on");
  pgm.createIndex("tax_settings", "shipping_tax_class");
  pgm.createIndex("tax_settings", "default_tax_category");
  pgm.createIndex("tax_settings", "default_tax_zone");
  pgm.createIndex("tax_settings", "tax_provider");

  // Insert sample data for core tax tables
  pgm.sql(`
    -- Insert sample tax categories
    INSERT INTO tax_category (
      name,
      code,
      description,
      is_default,
      is_active
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
      'Reduced tax rate for specific product categories',
      false,
      true
    ),
    (
      'Zero Rate',
      'zero',
      'Zero tax rate for exempt products',
      false,
      true
    );

    -- Insert sample tax zones
    INSERT INTO tax_zone (
      name,
      code,
      description,
      is_default,
      countries,
      is_active
    )
    VALUES 
    (
      'US',
      'us',
      'All United States',
      true,
      ARRAY['US'],
      true
    ),
    (
      'EU',
      'eu',
      'European Union Countries',
      false,
      ARRAY['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'GR', 'PT', 'FI', 'IE', 'LU', 'MT', 'CY'],
      true
    ),
    (
      'UK',
      'uk',
      'United Kingdom',
      false,
      ARRAY['GB'],
      true
    ),
    (
      'CA',
      'ca',
      'Canada',
      false,
      ARRAY['CA'],
      true
    );
  `);

  pgm.sql(`
    -- Insert sample tax rates
    WITH 
      standard_cat AS (SELECT id FROM tax_category WHERE code = 'standard'),
      reduced_cat AS (SELECT id FROM tax_category WHERE code = 'reduced'),
      zero_cat AS (SELECT id FROM tax_category WHERE code = 'zero'),
      us_zone AS (SELECT id FROM tax_zone WHERE code = 'us'),
      eu_zone AS (SELECT id FROM tax_zone WHERE code = 'eu'),
      uk_zone AS (SELECT id FROM tax_zone WHERE code = 'uk'),
      ca_zone AS (SELECT id FROM tax_zone WHERE code = 'ca')
    INSERT INTO tax_rate (
      tax_category_id,
      tax_zone_id,
      name,
      rate,
      type,
      priority,
      is_compound,
      include_in_price,
      is_shipping_taxable,
      is_active
    )
    VALUES 
    (
      (SELECT id FROM standard_cat),
      (SELECT id FROM us_zone),
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
    ),
    (
      (SELECT id FROM standard_cat),
      (SELECT id FROM ca_zone),
      'CA GST',
      5.00,
      'percentage',
      1,
      false,
      true,
      true,
      true
    ),
    (
      (SELECT id FROM standard_cat),
      (SELECT id FROM ca_zone),
      'CA PST',
      7.00,
      'percentage',
      2,
      false,
      true,
      true,
      true
    );
  `);

  pgm.sql(`
    -- Insert sample tax settings
    WITH 
      sample_merchant AS (SELECT id FROM merchant LIMIT 1),
      standard_cat AS (SELECT id FROM tax_category WHERE code = 'standard'),
      us_zone AS (SELECT id FROM tax_zone WHERE code = 'us')
    INSERT INTO tax_settings (
      merchant_id,
      calculation_method,
      prices_include_tax,
      display_prices_with_tax,
      tax_based_on,
      display_tax_totals,
      apply_tax_to_shipping,
      apply_discount_before_tax,
      default_tax_category,
      default_tax_zone,
      tax_provider
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
      us_zone.id,
      'internal'
    FROM 
      sample_merchant, 
      standard_cat, 
      us_zone
    WHERE EXISTS (SELECT 1 FROM sample_merchant);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("tax_settings");
  pgm.dropTable("tax_rule");
  pgm.dropTable("tax_rate");
  pgm.dropTable("tax_zone");
  pgm.dropTable("tax_category");
  pgm.dropType("tax_rate_type");
  pgm.dropType("tax_calculation_method");
};
