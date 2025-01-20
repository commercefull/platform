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
    pgm.createTable("product", {
        id: "id",
        name: { type: "varchar(1000)", notNull: true },
        price: { type: "integer", notNull: true },
        description: { type: "text" },
        created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("product");
};
