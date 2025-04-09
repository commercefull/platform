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
  // Create token blacklist table for invalidated tokens
  pgm.createTable("auth_token_blacklist", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    token: { type: "text", notNull: true },
    userType: { type: "varchar(20)", notNull: true }, // 'customer', 'merchant', 'admin'
    userId: { type: "uuid", notNull: true },
    expiresAt: { type: "timestamp", notNull: true },
    invalidatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    reason: { type: "varchar(50)" } // 'logout', 'password_change', 'security_concern', etc.
  });
  pgm.createIndex("auth_token_blacklist", "token");
  pgm.createIndex("auth_token_blacklist", "userId");
  pgm.createIndex("auth_token_blacklist", "expiresAt");
  
  // Create refresh token table for longer sessions
  pgm.createTable("auth_refresh_tokens", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    token: { type: "text", notNull: true },
    userType: { type: "varchar(20)", notNull: true },
    userId: { type: "uuid", notNull: true },
    isRevoked: { type: "boolean", notNull: true, default: false },
    expiresAt: { type: "timestamp", notNull: true },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    lastUsedAt: { type: "timestamp" },
    userAgent: { type: "text" },
    ipAddress: { type: "varchar(50)" }
  });
  pgm.createIndex("auth_refresh_tokens", "token", { unique: true });
  pgm.createIndex("auth_refresh_tokens", "userId");
  pgm.createIndex("auth_refresh_tokens", ["userId", "userType"]);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("auth_token_blacklist");
  pgm.dropTable("auth_refresh_tokens");
};
