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
  
  // Check if email_verified column exists in customer table before adding
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer' 
        AND column_name = 'email_verified'
      ) THEN
        ALTER TABLE customer 
        ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
      END IF;
    END $$;
  `);

  // Check if email_verified column exists in merchant table before adding
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'merchant' 
        AND column_name = 'email_verified'
      ) THEN
        ALTER TABLE merchant 
        ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
      END IF;
    END $$;
  `);
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
