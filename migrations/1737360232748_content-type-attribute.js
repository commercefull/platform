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
    pgm.createTable("contentTypeAttribute", {
        id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
        contentTypeId: { type: "uuid", notNull: true, references: 'contentType', onDelete: 'CASCADE' },
        name: { type: "varchar(255)", notNull: true },
        createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
        updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
    });
    pgm.createIndex('contentTypeAttribute', 'contentTypeId');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("contentTypeAttribute");
};
