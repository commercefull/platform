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
    pgm.createTable("product_attribute_category", {
        id: "id",
        product_id: { type: "integer", notNull: true, references: "product" },
        name: { type: "varchar(1000)", notNull: true},
        value: { type: "text", notNull: true},
        created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("product_attribute_category");
};
