const { verify } = require('crypto');

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
    pgm.createTable("auth_merchant", {
        id: {
            type: "uuid",
            notNull: true,
            default: pgm.func("uuid_generate_v4"),
            primaryKey: true,
        },
        created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        email: { type: "varchar(255)", notNull: true },
        password: { type: "varchar(255)", notNull: true },
        verify_token: { type: "varchar(255)"},
    });

    pgm.createIndex('auth_merchant', 'email', { unique: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("auth_merchant");
};
