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
    customerId: { type: "uuid", notNull: true, references: "customer" },
    token: { type: "varchar(255)", notNull: true },
    expiresAt: { type: "timestamp", notNull: true },
    isUsed: { type: "boolean", notNull: true, default: false },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.createIndex("customer_email_verification", "customerId");
  pgm.createIndex("customer_email_verification", "token");
  
  // Create merchant email verification table
  pgm.createTable("merchant_email_verification", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant" },
    token: { type: "varchar(255)", notNull: true },
    expiresAt: { type: "timestamp", notNull: true },
    isUsed: { type: "boolean", notNull: true, default: false },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.createIndex("merchant_email_verification", "merchantId");
  pgm.createIndex("merchant_email_verification", "token");
  
  // Update customer table to ensure it has an emailVerified field if not already present
  pgm.addColumns("customer", {
    emailVerified: {
      type: "boolean",
      notNull: true,
      default: false,
      // This is a safe addition as we're checking if it exists first
      ifNotExists: true
    }
  });
  
  // Update merchant table to track email verification
  pgm.addColumns("merchant", {
    emailVerified: {
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
  pgm.dropTable("customer_email_verification");
  pgm.dropTable("merchant_email_verification");
  
  // We don't remove the emailVerified column in down migration
  // as it might be used by other features and would be destructive
};
