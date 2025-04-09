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
    basketId: { type: "uuid", notNull: true, references: "basket", onDelete: "CASCADE" },
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    quantity: { type: "integer", notNull: true, default: 1, check: "quantity > 0" },
    unitPrice: { type: "decimal(15,2)", notNull: true },
    totalPrice: { type: "decimal(15,2)", notNull: true },
    discountAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    taxAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    finalPrice: { type: "decimal(15,2)", notNull: true },
    imageUrl: { type: "text" },
    attributes: { type: "jsonb" }, // Store variant attributes, customizations, etc.
    itemType: { type: "varchar(20)", notNull: true, default: "standard" }, // standard, bundle, digital, etc.
    isGift: { type: "boolean", notNull: true, default: false },
    giftMessage: { type: "text" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for efficient querying
  pgm.createIndex("basket_item", "basketId");
  pgm.createIndex("basket_item", "productId");
  pgm.createIndex("basket_item", "variantId");
  pgm.createIndex("basket_item", "sku");
  
  // Create a unique index to ensure a product variant can only appear once in a basket
  pgm.createIndex("basket_item", ["basketId", "productId", "variantId"], {
    unique: true,
    where: "variantId IS NOT NULL",
    nulls: "not distinct"
  });

  // Create a unique index for products without variants
  pgm.createIndex("basket_item", ["basketId", "productId"], {
    unique: true,
    where: "variantId IS NULL"
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
