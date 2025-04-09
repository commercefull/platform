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
  // Create customer password reset table
  pgm.createTable("customer_password_reset", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    userId: { type: "uuid", notNull: true, references: "customer" },
    token: { type: "varchar(255)", notNull: true },
    expiresAt: { type: "timestamp", notNull: true },
    isUsed: { type: "boolean", notNull: true, default: false },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.createIndex("customer_password_reset", "userId");
  pgm.createIndex("customer_password_reset", "expiresAt");

  // Create merchant password reset table
  pgm.createTable("merchant_password_reset", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    userId: { type: "uuid", notNull: true, references: "merchant" },
    token: { type: "varchar(255)", notNull: true },
    expiresAt: { type: "timestamp", notNull: true },
    isUsed: { type: "boolean", notNull: true, default: false },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.createIndex("merchant_password_reset", "userId");
  pgm.createIndex("merchant_password_reset", "expiresAt");

  // Create admin password reset table
  pgm.createTable("admin_password_reset", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    userId: { type: "uuid", notNull: true, references: "admin" },
    token: { type: "varchar(255)", notNull: true },
    expiresAt: { type: "timestamp", notNull: true },
    isUsed: { type: "boolean", notNull: true, default: false },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.createIndex("admin_password_reset", "userId");
  pgm.createIndex("admin_password_reset", "expiresAt");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("customer_password_reset");
  pgm.dropTable("merchant_password_reset");
  pgm.dropTable("admin_password_reset");
};
