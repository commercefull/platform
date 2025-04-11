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
  // Create the basket items table
  pgm.createTable("basket_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    basket_id: { type: "uuid", notNull: true, references: "basket", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    quantity: { type: "integer", notNull: true, default: 1, check: "quantity > 0" },
    unit_price: { type: "decimal(15,2)", notNull: true },
    total_price: { type: "decimal(15,2)", notNull: true },
    discount_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    tax_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    final_price: { type: "decimal(15,2)", notNull: true },
    image_url: { type: "text" },
    attributes: { type: "jsonb" }, // Store variant attributes, customizations, etc.
    item_type: { type: "varchar(20)", notNull: true, default: "standard" }, // standard, bundle, digital, etc.
    is_gift: { type: "boolean", notNull: true, default: false },
    gift_message: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for efficient querying
  pgm.createIndex("basket_item", "basket_id");
  pgm.createIndex("basket_item", "product_id");
  pgm.createIndex("basket_item", "variant_id");
  pgm.createIndex("basket_item", "sku");
  
  // Create a unique index to ensure a product variant can only appear once in a basket
  pgm.createIndex("basket_item", ["basket_id", "product_id", "variant_id"], {
    unique: true,
    where: "variant_id IS NOT NULL",
    nulls: "not distinct"
  });

  // Create a unique index for products without variants
  pgm.createIndex("basket_item", ["basket_id", "product_id"], {
    unique: true,
    where: "variant_id IS NULL"
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("basket_item");
};
