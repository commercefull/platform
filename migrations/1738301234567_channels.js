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
  // Create channels table for distribution system
  pgm.createTable("channels", {
    channel_id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    code: { type: "varchar(100)", notNull: true, unique: true },
    type: { type: "varchar(50)", notNull: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    settings: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for channels
  pgm.createIndex("channels", "code");
  pgm.createIndex("channels", "type");
  pgm.createIndex("channels", "is_active");

  // Create channel_products table for the many-to-many relationship
  pgm.createTable("channel_products", {
    channel_product_id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    channel_id: { 
      type: "uuid", 
      notNull: true, 
      references: { table: "channels", column: "channel_id" },
      onDelete: "CASCADE" 
    },
    product_id: { type: "uuid", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    override_sku: { type: "varchar(100)" },
    override_price: { type: "numeric(15,2)" },
    sort_order: { type: "integer", default: 0 },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create unique constraint for channel-product combination
  pgm.addConstraint("channel_products", "unique_channel_product", {
    unique: ["channel_id", "product_id"]
  });

  // Create indexes for channel_products
  pgm.createIndex("channel_products", "channel_id");
  pgm.createIndex("channel_products", "product_id");
  pgm.createIndex("channel_products", "is_active");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("channel_products");
  pgm.dropTable("channels");
};
