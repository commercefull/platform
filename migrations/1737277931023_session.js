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
    pgm.createTable('session', {
        sid: {
            type: 'string',
            notNull: true,
        },
        sess: {
            type: 'jsonb',
            notNull: true,
        },
        expire: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    });
    pgm.createIndex('session', 'sid', { unique: true });
    pgm.createIndex('session', 'expire');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('session');
};
