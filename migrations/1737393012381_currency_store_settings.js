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
    store_currency_id: { type: "uuid", notNull: true, references: "currency" }, // Primary store operating currency
    base_currency_id: { type: "uuid", notNull: true, references: "currency" }, // Base currency for exchange rates
    display_currency_id: { type: "uuid", notNull: true, references: "currency" }, // Default display currency
    allow_customer_currency_selection: { type: "boolean", notNull: true, default: true },
    show_currency_selector: { type: "boolean", notNull: true, default: true },
    auto_update_rates: { type: "boolean", notNull: true, default: false },
    rate_update_frequency: { type: "integer", default: 1440 }, // In minutes
    active_provider_code: { type: "varchar(50)", references: "currency_provider(code)" },
    markup_percentage: { type: "decimal(5,2)", notNull: true, default: 0 }, // Percentage markup on exchange rates
    round_precision: { type: "integer", notNull: true, default: 2 }, // Decimal places for rounding
    rounding_method: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "half_up", 
      check: "rounding_method IN ('up', 'down', 'ceiling', 'floor', 'half_up', 'half_down', 'half_even')" 
    },
    enabled_currencies: { type: "text[]" }, // List of enabled currency codes for the store
    price_display_format: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "symbol", 
      check: "price_display_format IN ('symbol', 'code', 'symbol_code', 'name')" 
    },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for store currency settings
  pgm.createIndex("store_currency_settings", "store_currency_id");
  pgm.createIndex("store_currency_settings", "base_currency_id");
  pgm.createIndex("store_currency_settings", "display_currency_id");
  pgm.createIndex("store_currency_settings", "active_provider_code");

  // Create product currency prices table (for multi-currency pricing)
  pgm.createTable("product_currency_price", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true }, // Reference to product (not FK to allow product deletion)
    variant_id: { type: "uuid" }, // Optional reference to product variant
    currency_id: { type: "uuid", notNull: true, references: "currency" },
    price: { type: "decimal(15,4)", notNull: true },
    compare_at_price: { type: "decimal(15,4)" }, // Original/MSRP price for showing discounts
    is_manual: { type: "boolean", notNull: true, default: true }, // Whether price was manually set or auto-converted
    last_updated: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for product currency prices
  pgm.createIndex("product_currency_price", "product_id");
  pgm.createIndex("product_currency_price", "variant_id");
  pgm.createIndex("product_currency_price", "currency_id");
  pgm.createIndex("product_currency_price", ["product_id", "variant_id", "currency_id"], { unique: true });

  // Create customer currency preferences table
  pgm.createTable("customer_currency_preference", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    currency_id: { type: "uuid", notNull: true, references: "currency" },
    automatic_detection: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer currency preferences
  pgm.createIndex("customer_currency_preference", "customer_id");
  pgm.createIndex("customer_currency_preference", "currency_id");
  pgm.createIndex("customer_currency_preference", ["customer_id"], { unique: true });

  // Insert default store currency settings
  pgm.sql(`
    INSERT INTO "store_currency_settings" (
      "store_currency_id",
      "base_currency_id",
      "display_currency_id",
      "allow_customer_currency_selection",
      "show_currency_selector",
      "auto_update_rates",
      "rate_update_frequency",
      "active_provider_code",
      "markup_percentage",
      "round_precision",
      "rounding_method",
      "enabled_currencies",
      "price_display_format"
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
