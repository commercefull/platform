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
    user_type: { type: "varchar(20)", notNull: true }, // 'customer', 'merchant', 'admin'
    user_id: { type: "uuid", notNull: true },
    expires_at: { type: "timestamp", notNull: true },
    invalidated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    reason: { type: "varchar(50)" } // 'logout', 'password_change', 'security_concern', etc.
  });
  pgm.createIndex("auth_token_blacklist", "token");
  pgm.createIndex("auth_token_blacklist", "user_id");
  pgm.createIndex("auth_token_blacklist", "expires_at");
  
  // Create refresh token table for longer sessions
  pgm.createTable("auth_refresh_tokens", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    token: { type: "text", notNull: true },
    user_type: { type: "varchar(20)", notNull: true },
    user_id: { type: "uuid", notNull: true },
    is_revoked: { type: "boolean", notNull: true, default: false },
    expires_at: { type: "timestamp", notNull: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    last_used_at: { type: "timestamp" },
    user_agent: { type: "text" },
    ip_address: { type: "varchar(50)" }
  });
  pgm.createIndex("auth_refresh_tokens", "token", { unique: true });
  pgm.createIndex("auth_refresh_tokens", "user_id");
  pgm.createIndex("auth_refresh_tokens", ["user_id", "user_type"]);
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
