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
  // Create countries table for regional settings
  pgm.createTable("country", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    code: { type: "varchar(2)", notNull: true, unique: true }, // ISO 3166-1 alpha-2 code
    name: { type: "varchar(100)", notNull: true },
    numeric_code: { type: "integer" }, // ISO 3166-1 numeric code
    alpha3_code: { type: "varchar(3)" }, // ISO 3166-1 alpha-3 code
    default_currency_id: { type: "uuid", references: "currency" },
    is_active: { type: "boolean", notNull: true, default: true },
    flag_icon: { type: "varchar(255)" }, // URL or path to flag icon
    region: { type: "varchar(100)" }, // Geographic region (Europe, North America, etc.)
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for countries
  pgm.createIndex("country", "code");
  pgm.createIndex("country", "default_currency_id");
  pgm.createIndex("country", "is_active");
  pgm.createIndex("country", "region");

  // Create locales table
  pgm.createTable("locale", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    code: { type: "varchar(10)", notNull: true, unique: true }, // BCP 47 format (e.g., en-US, fr-FR)
    name: { type: "varchar(100)", notNull: true },
    language: { type: "varchar(2)", notNull: true }, // ISO 639-1 language code
    country_code: { type: "varchar(2)" }, // ISO 3166-1 alpha-2 country code
    is_active: { type: "boolean", notNull: true, default: true },
    is_default: { type: "boolean", notNull: true, default: false },
    text_direction: { 
      type: "varchar(3)", 
      notNull: true, 
      default: "ltr", 
      check: '"text_direction" IN (\'ltr\', \'rtl\')' 
    }, // Left-to-right or right-to-left
    date_format: { type: "varchar(50)", notNull: true, default: "yyyy-MM-dd" },
    time_format: { type: "varchar(50)", notNull: true, default: "HH:mm:ss" },
    time_zone: { type: "varchar(50)", notNull: true, default: "UTC" },
    default_currency_id: { type: "uuid", references: "currency" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for locales
  pgm.createIndex("locale", "code");
  pgm.createIndex("locale", "language");
  pgm.createIndex("locale", "country_code");
  pgm.createIndex("locale", "is_active");
  pgm.createIndex("locale", "is_default");
  pgm.createIndex("locale", "default_currency_id");

  // Only one locale can be the default
  pgm.createIndex("locale", "is_default", { 
    unique: true,
    where: '\"is_default\" = true',
    name: 'locale_is_default_unique_index'
  });

  // Create currency localization table for localized currency names and formatting
  pgm.createTable("currency_localization", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    currency_id: { type: "uuid", notNull: true, references: "currency", onDelete: "CASCADE" },
    locale_id: { type: "uuid", notNull: true, references: "locale", onDelete: "CASCADE" },
    localized_name: { type: "varchar(100)" },
    localized_symbol: { type: "varchar(10)" },
    decimal_separator: { type: "varchar(1)" },
    thousands_separator: { type: "varchar(1)" },
    symbol_position: { type: "varchar(10)", check: "symbol_position IN ('before', 'after')" },
    format: { type: "varchar(100)" }, // Custom format string, e.g., "%s%v" for symbol-before-value
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for currency localization
  pgm.createIndex("currency_localization", "currency_id");
  pgm.createIndex("currency_localization", "locale_id");
  pgm.createIndex("currency_localization", ["currency_id", "locale_id"], { unique: true });

  // Insert data for major countries
  pgm.sql(`
    INSERT INTO "country" ("code", "name", "alpha3_code", "numeric_code", "region", "is_active")
    VALUES 
      ('US', 'United States', 'USA', 840, 'North America', true),
      ('CA', 'Canada', 'CAN', 124, 'North America', true),
      ('GB', 'United Kingdom', 'GBR', 826, 'Europe', true),
      ('DE', 'Germany', 'DEU', 276, 'Europe', true),
      ('FR', 'France', 'FRA', 250, 'Europe', true),
      ('IT', 'Italy', 'ITA', 380, 'Europe', true),
      ('ES', 'Spain', 'ESP', 724, 'Europe', true),
      ('JP', 'Japan', 'JPN', 392, 'Asia', true),
      ('CN', 'China', 'CHN', 156, 'Asia', true),
      ('IN', 'India', 'IND', 356, 'Asia', true),
      ('AU', 'Australia', 'AUS', 36, 'Oceania', true),
      ('BR', 'Brazil', 'BRA', 76, 'South America', true),
      ('MX', 'Mexico', 'MEX', 484, 'North America', true)
  `);

  // Insert data for major locales
  pgm.sql(`
    INSERT INTO "locale" ("code", "name", "language", "country_code", "is_active", "is_default", "text_direction", "date_format", "time_format")
    VALUES 
      ('en-US', 'English (United States)', 'en', 'US', true, true, 'ltr', 'MM/dd/yyyy', 'h:mm a'),
      ('en-GB', 'English (United Kingdom)', 'en', 'GB', true, false, 'ltr', 'dd/MM/yyyy', 'HH:mm'),
      ('es-ES', 'Spanish (Spain)', 'es', 'ES', true, false, 'ltr', 'dd/MM/yyyy', 'HH:mm'),
      ('fr-FR', 'French (France)', 'fr', 'FR', true, false, 'ltr', 'dd/MM/yyyy', 'HH:mm'),
      ('de-DE', 'German (Germany)', 'de', 'DE', true, false, 'ltr', 'dd.MM.yyyy', 'HH:mm'),
      ('it-IT', 'Italian (Italy)', 'it', 'IT', true, false, 'ltr', 'dd/MM/yyyy', 'HH:mm'),
      ('ja-JP', 'Japanese (Japan)', 'ja', 'JP', true, false, 'ltr', 'yyyy/MM/dd', 'HH:mm'),
      ('zh-CN', 'Chinese (China)', 'zh', 'CN', true, false, 'ltr', 'yyyy/MM/dd', 'HH:mm'),
      ('pt-BR', 'Portuguese (Brazil)', 'pt', 'BR', true, false, 'ltr', 'dd/MM/yyyy', 'HH:mm'),
      ('ar-AE', 'Arabic (UAE)', 'ar', 'AE', true, false, 'rtl', 'dd/MM/yyyy', 'HH:mm')
  `);

  // Set default currencies for countries
  pgm.sql(`
    -- Update countries with default currencies
    UPDATE "country" as c
    SET "default_currency_id" = curr.id
    FROM "currency" curr
    WHERE 
      (c."code" = 'US' AND curr.code = 'USD') OR
      (c."code" = 'CA' AND curr.code = 'CAD') OR
      (c."code" = 'GB' AND curr.code = 'GBP') OR
      (c."code" = 'DE' AND curr.code = 'EUR') OR
      (c."code" = 'FR' AND curr.code = 'EUR') OR
      (c."code" = 'IT' AND curr.code = 'EUR') OR
      (c."code" = 'ES' AND curr.code = 'EUR') OR
      (c."code" = 'JP' AND curr.code = 'JPY') OR
      (c."code" = 'CN' AND curr.code = 'CNY') OR
      (c."code" = 'IN' AND curr.code = 'INR') OR
      (c."code" = 'AU' AND curr.code = 'AUD') OR
      (c."code" = 'BR' AND curr.code = 'BRL') OR
      (c."code" = 'MX' AND curr.code = 'MXN');
  `);

  // Set default currencies for locales
  pgm.sql(`
    -- Update locales with default currencies
    UPDATE "locale" as l
    SET "default_currency_id" = curr.id
    FROM "currency" curr
    WHERE 
      (l."code" = 'en-US' AND curr."code" = 'USD') OR
      (l."code" = 'en-GB' AND curr."code" = 'GBP') OR
      (l."code" = 'es-ES' AND curr."code" = 'EUR') OR
      (l."code" = 'fr-FR' AND curr."code" = 'EUR') OR
      (l."code" = 'de-DE' AND curr."code" = 'EUR') OR
      (l."code" = 'it-IT' AND curr."code" = 'EUR') OR
      (l."code" = 'ja-JP' AND curr."code" = 'JPY') OR
      (l."code" = 'zh-CN' AND curr."code" = 'CNY') OR
      (l."code" = 'pt-BR' AND curr."code" = 'BRL');
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("currency_localization");
  pgm.dropTable("locale");
  pgm.dropTable("country");
};
