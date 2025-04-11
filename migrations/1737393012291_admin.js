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
  pgm.createTable("admin", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    email: { type: "varchar(255)", notNull: true },
    first_name: { type: "varchar(255)", notNull: true },
    last_name: { type: "varchar(255)", notNull: true },
    password: { type: "varchar(255)", notNull: true },
    role: { type: "varchar(50)", notNull: true, default: "admin" }, // Allows for super-admin or other admin roles
    is_active: { type: "boolean", notNull: true, default: true },
    last_login_at: { type: "timestamp" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.createIndex("admin", "email", { unique: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("admin");
};
