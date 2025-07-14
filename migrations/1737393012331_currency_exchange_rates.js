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
  // Create currency exchange rates table
  pgm.createTable("currency_exchange_rate", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    sourceCurrencyId: { type: "uuid", notNull: true, references: "currency" },
    targetCurrencyId: { type: "uuid", notNull: true, references: "currency" },
    rate: { type: "decimal(20,10)", notNull: true }, // Exchange rate with high precision
    inverseRate: { type: "decimal(20,10)", notNull: true }, // Pre-calculated inverse rate for efficiency
    provider: { type: "varchar(50)", notNull: true, default: "manual" }, // Source of exchange rate: 'manual', 'api', etc.
    providerReference: { type: "varchar(255)" }, // Reference ID from provider
    effectiveFrom: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }, // When rate becomes active
    effectiveTo: { type: "timestamp" }, // When rate expires (null for current rates)
    isActive: { type: "boolean", notNull: true, default: true },
    lastUpdated: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for exchange rates
  pgm.createIndex("currency_exchange_rate", "sourceCurrencyId");
  pgm.createIndex("currency_exchange_rate", "targetCurrencyId");
  pgm.createIndex("currency_exchange_rate", "isActive");
  pgm.createIndex("currency_exchange_rate", "effectiveFrom");
  pgm.createIndex("currency_exchange_rate", "effectiveTo");
  pgm.createIndex("currency_exchange_rate", "lastUpdated");
  
  // Create unique constraint for active currency pairs
  pgm.createIndex("currency_exchange_rate", ["sourceCurrencyId", "targetCurrencyId"], { 
    unique: true,
    where: '\"isActive\" = true AND \"effectiveTo\" IS NULL',
    name: 'idx_currency_exchange_rate_unique_active_pair'
  });

  // Create currency exchange rate history table for tracking rate changes
  pgm.createTable("currency_exchange_rate_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    sourceCurrencyId: { type: "uuid", notNull: true, references: "currency" },
    targetCurrencyId: { type: "uuid", notNull: true, references: "currency" },
    rate: { type: "decimal(20,10)", notNull: true },
    provider: { type: "varchar(50)", notNull: true },
    providerReference: { type: "varchar(255)" },
    timestamp: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for exchange rate history
  pgm.createIndex("currency_exchange_rate_history", "sourceCurrencyId");
  pgm.createIndex("currency_exchange_rate_history", "targetCurrencyId");
  pgm.createIndex("currency_exchange_rate_history", "timestamp");
  pgm.createIndex("currency_exchange_rate_history", ["sourceCurrencyId", "targetCurrencyId", "timestamp"]);

  // Create currency providers table for API integration settings
  pgm.createTable("currency_provider", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    apiUrl: { type: "text" },
    apiKey: { type: "text" },
    additionalConfig: { type: "jsonb" },
    isActive: { type: "boolean", notNull: true, default: false },
    lastSyncAt: { type: "timestamp" },
    syncFrequency: { type: "integer", default: 1440 }, // In minutes, default is daily
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for currency providers
  pgm.createIndex("currency_provider", "code");
  pgm.createIndex("currency_provider", "isActive");

  // Insert default providers
  pgm.sql(`
    INSERT INTO "currency_provider" ("name", "code", "description", "apiUrl", "isActive")
    VALUES 
      ('Manual', 'manual', 'Manually entered exchange rates', NULL, true),
      ('Exchange Rates API', 'exchangeratesapi', 'Exchange Rates API (exchangeratesapi.io)', 'https://api.exchangeratesapi.io', false),
      ('Open Exchange Rates', 'openexchangerates', 'Open Exchange Rates (openexchangerates.org)', 'https://openexchangerates.org/api', false),
      ('Currency Layer', 'currencylayer', 'Currency Layer (currencylayer.com)', 'https://api.currencylayer.com', false)
  `);

  // Insert some example exchange rates for common currencies (based on approximate values)
  pgm.sql(`
    -- Get currency IDs
    WITH currency_ids AS (
      SELECT id, code FROM currency WHERE code IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY')
    )
    
    -- Insert exchange rates using the IDs
    INSERT INTO "currency_exchange_rate" (
      "sourceCurrencyId", 
      "targetCurrencyId", 
      "rate", 
      "inverseRate", 
      "provider", 
      "effectiveFrom"
    )
    SELECT 
      usd.id, 
      eur.id, 
      0.9200000000, 
      1.0869565217, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      currency_ids usd, 
      currency_ids eur
    WHERE 
      usd.code = 'USD' AND 
      eur.code = 'EUR'
    
    UNION ALL
    
    SELECT 
      usd.id, 
      gbp.id, 
      0.7800000000, 
      1.2820512821, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      currency_ids usd, 
      currency_ids gbp
    WHERE 
      usd.code = 'USD' AND 
      gbp.code = 'GBP'
    
    UNION ALL
    
    SELECT 
      usd.id, 
      cad.id, 
      1.3500000000, 
      0.7407407407, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      currency_ids usd, 
      currency_ids cad
    WHERE 
      usd.code = 'USD' AND 
      cad.code = 'CAD'
    
    UNION ALL
    
    SELECT 
      usd.id, 
      aud.id, 
      1.5000000000, 
      0.6666666667, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      currency_ids usd, 
      currency_ids aud
    WHERE 
      usd.code = 'USD' AND 
      aud.code = 'AUD'
    
    UNION ALL
    
    SELECT 
      usd.id, 
      jpy.id, 
      110.0000000000, 
      0.0090909091, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      currency_ids usd, 
      currency_ids jpy
    WHERE 
      usd.code = 'USD' AND 
      jpy.code = 'JPY'
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("currency_exchange_rate_history");
  pgm.dropTable("currency_exchange_rate");
  pgm.dropTable("currency_provider");
};
