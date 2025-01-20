const { verify } = require('crypto');
const { rootLogger } = require('ts-jest');

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
    pgm.createType('roles', ['ADMIN', 'MERCHANT', 'VIEWER', 'AGENT']);
    pgm.createTable("merchant", {
        id: {
            type: "uuid",
            notNull: true,
            default: pgm.func("uuid_generate_v4()"),
            primaryKey: true,
        },
        created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        email: { type: "varchar(255)", notNull: true },
        password: { type: "varchar(255)", notNull: true },
        verify_token: { type: "varchar(255)"},
        role: { type: 'roles', notNull: true, default: 'VIEWER' },
    });
    pgm.createIndex('merchant', 'email', { unique: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("merchant");
    pgm.dropType('roles');

};
