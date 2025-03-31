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
    pgm.createTable("productAttributeValueLocale", {
        id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
        productAttributeValueId: { type: "uuid", notNull: true, references: 'productAttributeValue', onDelete: 'CASCADE' },
        localeId: { type: "uuid", notNull: true, references: 'locale', onDelete: 'CASCADE' },
        value: { type: "text", notNull: true },
        createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
    });
    pgm.createIndex('productAttributeValueLocale', 'productAttributeValueId');
    pgm.createIndex('productAttributeValueLocale', 'localeId');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("productAttributeValueLocale");
};
