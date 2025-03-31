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
    pgm.createTable("productAttributeCategory", {
        id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
        name: { type: "varchar(255)", notNull: true },
        productTypeId: { type: "uuid", notNull: true, references: 'productType', onDelete: 'CASCADE' },
        createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        value: { type: "text", notNull: true},
        order: { type: "integer", notNull: true, default: 0 },
    });
    pgm.createIndex('productAttributeCategory', 'productTypeId');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("productAttributeCategory");
};
