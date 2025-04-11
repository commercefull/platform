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
  // Create basket discount table for tracking applied promotions and vouchers
  pgm.createTable("basket_discount", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    basket_id: { type: "uuid", notNull: true, references: "basket", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "type IN ('coupon', 'promotion', 'automatic', 'loyalty', 'referral', 'system')" 
    },
    code: { type: "varchar(100)" }, // Coupon code if applicable
    description: { type: "varchar(255)", notNull: true },
    value: { type: "decimal(15,2)", notNull: true },
    is_percentage: { type: "boolean", notNull: true, default: false },
    target_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "target_type IN ('cart', 'item', 'shipping')"
    },
    target_id: { type: "uuid" }, // For item-specific discounts, references basket_item.id
    priority: { type: "integer", notNull: true, default: 0 }, // For controlling discount application order
    meta: { type: "jsonb" }, // Additional information about the discount
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for efficient querying
  pgm.createIndex("basket_discount", "basket_id");
  pgm.createIndex("basket_discount", "code");
  pgm.createIndex("basket_discount", "target_id");

  // Create a table for saved/wishlisted items from baskets
  pgm.createTable("basket_saved_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", references: "customer" }, // Can be null for guest baskets with cookie
    session_id: { type: "varchar(255)" }, // For anonymous/guest saves
    product_id: { type: "uuid", notNull: true },
    variant_id: { type: "uuid" },
    added_from: { type: "varchar(50)" }, // e.g., 'basket', 'product_page', 'recommendation'
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  
  // Create indexes for efficient querying of saved items
  pgm.createIndex("basket_saved_item", "customer_id");
  pgm.createIndex("basket_saved_item", "session_id");
  pgm.createIndex("basket_saved_item", "product_id");
  pgm.createIndex("basket_saved_item", "variant_id");

  // Create a unique index to prevent duplicate saved items per customer
  pgm.createIndex("basket_saved_item", ["customer_id", "product_id", "variant_id"], {
    unique: true,
    where: "customer_id IS NOT NULL",
    nulls: "not distinct"
  });

  // Create a unique index to prevent duplicate saved items per session
  pgm.createIndex("basket_saved_item", ["session_id", "product_id", "variant_id"], {
    unique: true,
    where: "session_id IS NOT NULL AND customer_id IS NULL",
    nulls: "not distinct"
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("basket_saved_item");
  pgm.dropTable("basket_discount");
};
