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
    firstName: { type: "varchar(255)", notNull: true },
    lastName: { type: "varchar(255)", notNull: true },
    password: { type: "varchar(255)", notNull: true },
    role: { type: "varchar(50)", notNull: true, default: "admin" }, // Allows for super-admin or other admin roles
    isActive: { type: "boolean", notNull: true, default: true },
    lastLoginAt: { type: "timestamp" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
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
