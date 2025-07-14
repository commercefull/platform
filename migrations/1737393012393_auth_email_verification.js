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
  // Create customer email verification table
  pgm.createTable("customer_email_verification", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer" },
    token: { type: "varchar(255)", notNull: true },
    expires_at: { type: "timestamp", notNull: true },
    is_used: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.createIndex("customer_email_verification", "customer_id");
  pgm.createIndex("customer_email_verification", "token");
  
  // Create merchant email verification table
  pgm.createTable("merchant_email_verification", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant" },
    token: { type: "varchar(255)", notNull: true },
    expires_at: { type: "timestamp", notNull: true },
    is_used: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.createIndex("merchant_email_verification", "merchant_id");
  pgm.createIndex("merchant_email_verification", "token");
  
  // Update customer table to ensure it has an email_verified field if not already present
  pgm.addColumns("customer", {
    email_verified: {
      type: "boolean",
      notNull: true,
      default: false,
      // This is a safe addition as we're checking if it exists first
      ifNotExists: true
    }
  });
  
  // Update merchant table to track email verification
  pgm.addColumns("merchant", {
    email_verified: {
      type: "boolean",
      notNull: true,
      default: false,
      ifNotExists: true
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropColumns("merchant", ["email_verified"], { ifExists: true });
  pgm.dropColumns("customer", ["email_verified"], { ifExists: true });
  pgm.dropTable("merchant_email_verification");
  pgm.dropTable("customer_email_verification");
};
