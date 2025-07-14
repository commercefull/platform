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
  // Create media folders table first
  pgm.createTable("content_media_folder", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    parentId: { type: "uuid", references: "content_media_folder" },
    path: { type: "varchar(255)" },
    depth: { type: "integer", notNull: true, default: 0 },
    sortOrder: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedBy: { type: "uuid" }
  });

  // Create indexes for media folders
  pgm.createIndex("content_media_folder", "parentId");
  pgm.createIndex("content_media_folder", "path");
  pgm.createIndex("content_media_folder", ["parentId", "name"], { unique: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("content_media_folder", { ifExists: true, cascade: true });
};
