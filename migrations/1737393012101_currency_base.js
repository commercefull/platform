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
  // Create currencies table
  pgm.createTable("currency", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    code: { type: "varchar(3)", notNull: true, unique: true }, // ISO 4217 currency code (USD, EUR, GBP, etc.)
    name: { type: "varchar(100)", notNull: true },
    symbol: { type: "varchar(10)", notNull: true }, // Currency symbol ($, €, £, etc.)
    numericCode: { type: "integer" }, // ISO 4217 numeric code
    decimalPlaces: { type: "integer", notNull: true, default: 2 }, // Number of decimal places to display
    decimalSeparator: { type: "varchar(1)", notNull: true, default: "." }, // Character to use as decimal separator
    thousandsSeparator: { type: "varchar(1)", notNull: true, default: "," }, // Character to use as thousands separator
    symbolPosition: { 
      type: "varchar(10)", 
      notNull: true, 
      default: "before", 
      check: "\"symbolPosition\" IN ('before', 'after')" 
    },
    isActive: { type: "boolean", notNull: true, default: true },
    isDefault: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for currencies
  pgm.createIndex("currency", "code");
  pgm.createIndex("currency", "isActive");
  pgm.createIndex("currency", "isDefault");

  // Only one currency can be the default
  pgm.createIndex("currency", "isDefault", { 
    unique: true,
    where: '\"isDefault\" = true'
  });

  // Insert common currencies
  pgm.sql(`
    INSERT INTO "currency" ("code", "name", "symbol", "numericCode", "decimalPlaces", "symbolPosition", "isActive", "isDefault")
    VALUES 
      ('USD', 'US Dollar', '$', 840, 2, 'before', true, true),
      ('EUR', 'Euro', '€', 978, 2, 'before', true, false),
      ('GBP', 'British Pound', '£', 826, 2, 'before', true, false),
      ('CAD', 'Canadian Dollar', 'CA$', 124, 2, 'before', true, false),
      ('AUD', 'Australian Dollar', 'A$', 36, 2, 'before', true, false),
      ('JPY', 'Japanese Yen', '¥', 392, 0, 'before', true, false),
      ('CNY', 'Chinese Yuan', '¥', 156, 2, 'before', true, false),
      ('INR', 'Indian Rupee', '₹', 356, 2, 'before', true, false),
      ('BRL', 'Brazilian Real', 'R$', 986, 2, 'before', true, false),
      ('MXN', 'Mexican Peso', 'MX$', 484, 2, 'before', true, false)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("currency");
};
