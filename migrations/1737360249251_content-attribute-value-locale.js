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
    pgm.createTable("content_attribute_value_locale", {
        id: {
            type: "uuid",
            notNull: true,
            default: pgm.func("uuid_generate_v4"),
            primaryKey: true,
        },
        created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        content_attribute_value_id: { type: "integer", notNull: true, references: "content_attribute_value" },
        locale_id: { type: "integer", notNull: true, references: "locale" },
        value: { type: "text", notNull: true },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("content_attribute_value_locale");
};
