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
    pgm.createTable("pageAttributeValueLocale", {
        id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
        pageAttributeValueId: { type: "uuid", notNull: true, references: 'pageAttributeValue', onDelete: 'CASCADE' },
        localeId: { type: "uuid", notNull: true, references: 'locale', onDelete: 'CASCADE' },
        value: { type: "text", notNull: true },
        createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
    });
    pgm.createIndex('pageAttributeValueLocale', 'pageAttributeValueId');
    pgm.createIndex('pageAttributeValueLocale', 'localeId');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("pageAttributeValueLocale");
};
