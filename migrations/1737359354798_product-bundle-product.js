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
    pgm.createTable("productBundleProduct", {
        id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
        productBundleId: { type: "uuid", notNull: true, references: 'productBundle', onDelete: 'CASCADE' },
        productId: { type: "uuid", notNull: true, references: 'product', onDelete: 'CASCADE' },
        createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
    });
    pgm.createIndex('productBundleProduct', 'productBundleId');
    pgm.createIndex('productBundleProduct', 'productId');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("productBundleProduct");
};
