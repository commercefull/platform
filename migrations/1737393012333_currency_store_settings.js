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
  // Create store currency settings table
  pgm.createTable("store_currency_settings", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    storeCurrencyId: { type: "uuid", notNull: true, references: "currency" }, // Primary store operating currency
    baseCurrencyId: { type: "uuid", notNull: true, references: "currency" }, // Base currency for exchange rates
    displayCurrencyId: { type: "uuid", notNull: true, references: "currency" }, // Default display currency
    allowCustomerCurrencySelection: { type: "boolean", notNull: true, default: true },
    showCurrencySelector: { type: "boolean", notNull: true, default: true },
    autoUpdateRates: { type: "boolean", notNull: true, default: false },
    rateUpdateFrequency: { type: "integer", default: 1440 }, // In minutes
    activeProviderCode: { type: "varchar(50)", references: "currency_provider(code)" },
    markupPercentage: { type: "decimal(5,2)", notNull: true, default: 0 }, // Percentage markup on exchange rates
    roundPrecision: { type: "integer", notNull: true, default: 2 }, // Decimal places for rounding
    roundingMethod: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "half_up", 
      check: "roundingMethod IN ('up', 'down', 'ceiling', 'floor', 'half_up', 'half_down', 'half_even')" 
    },
    enabledCurrencies: { type: "text[]" }, // List of enabled currency codes for the store
    priceDisplayFormat: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "symbol", 
      check: "priceDisplayFormat IN ('symbol', 'code', 'symbol_code', 'name')" 
    },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for store currency settings
  pgm.createIndex("store_currency_settings", "storeCurrencyId");
  pgm.createIndex("store_currency_settings", "baseCurrencyId");
  pgm.createIndex("store_currency_settings", "displayCurrencyId");
  pgm.createIndex("store_currency_settings", "activeProviderCode");

  // Create product currency prices table (for multi-currency pricing)
  pgm.createTable("product_currency_price", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true }, // Reference to product (not FK to allow product deletion)
    variantId: { type: "uuid" }, // Optional reference to product variant
    currencyId: { type: "uuid", notNull: true, references: "currency" },
    price: { type: "decimal(15,4)", notNull: true },
    compareAtPrice: { type: "decimal(15,4)" }, // Original/MSRP price for showing discounts
    isManual: { type: "boolean", notNull: true, default: true }, // Whether price was manually set or auto-converted
    lastUpdated: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for product currency prices
  pgm.createIndex("product_currency_price", "productId");
  pgm.createIndex("product_currency_price", "variantId");
  pgm.createIndex("product_currency_price", "currencyId");
  pgm.createIndex("product_currency_price", ["productId", "variantId", "currencyId"], { unique: true });

  // Create customer currency preferences table
  pgm.createTable("customer_currency_preference", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    currencyId: { type: "uuid", notNull: true, references: "currency" },
    automaticDetection: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer currency preferences
  pgm.createIndex("customer_currency_preference", "customerId");
  pgm.createIndex("customer_currency_preference", "currencyId");
  pgm.createIndex("customer_currency_preference", ["customerId"], { unique: true });

  // Insert default store currency settings
  pgm.sql(`
    INSERT INTO "store_currency_settings" (
      "storeCurrencyId",
      "baseCurrencyId",
      "displayCurrencyId",
      "allowCustomerCurrencySelection",
      "showCurrencySelector",
      "autoUpdateRates",
      "rateUpdateFrequency",
      "activeProviderCode",
      "markupPercentage",
      "roundPrecision",
      "roundingMethod",
      "enabledCurrencies",
      "priceDisplayFormat"
    )
    SELECT 
      c1.id,
      c1.id,
      c1.id,
      true,
      true,
      false,
      1440,
      'manual',
      0,
      2,
      'half_up',
      ARRAY['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      'symbol'
    FROM 
      "currency" c1
    WHERE 
      c1.code = 'USD';
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("customer_currency_preference");
  pgm.dropTable("product_currency_price");
  pgm.dropTable("store_currency_settings");
};
