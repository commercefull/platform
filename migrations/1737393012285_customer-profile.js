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
    pgm.createTable('customerProfile', {
        id: {
            type: "uuid",
            notNull: true,
            default: pgm.func("uuid_generate_v4()"),
            primaryKey: true,
        },
        customerId: {
            type: 'uuid',
            notNull: true,
            references: 'customer',
            onDelete: 'CASCADE',
        },
        createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        firstName: { type: 'varchar(255)', notNull: true },
        lastName: { type: 'varchar(255)', notNull: true },
        phone: { type: 'string', notNull: true },
    });
    pgm.createIndex('customerProfile', 'customerId');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('customerProfile');
};
