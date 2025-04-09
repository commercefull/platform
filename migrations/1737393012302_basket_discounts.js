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
    basketId: { type: "uuid", notNull: true, references: "basket", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "type IN ('coupon', 'promotion', 'automatic', 'loyalty', 'referral', 'system')" 
    },
    code: { type: "varchar(100)" }, // Coupon code if applicable
    description: { type: "varchar(255)", notNull: true },
    value: { type: "decimal(15,2)", notNull: true },
    isPercentage: { type: "boolean", notNull: true, default: false },
    targetType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "targetType IN ('cart', 'item', 'shipping')"
    },
    targetId: { type: "uuid" }, // For item-specific discounts, references basket_item.id
    priority: { type: "integer", notNull: true, default: 0 }, // For controlling discount application order
    meta: { type: "jsonb" }, // Additional information about the discount
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for efficient querying
  pgm.createIndex("basket_discount", "basketId");
  pgm.createIndex("basket_discount", "code");
  pgm.createIndex("basket_discount", "targetId");

  // Create a table for saved/wishlisted items from baskets
  pgm.createTable("basket_saved_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", references: "customer" }, // Can be null for guest baskets with cookie
    sessionId: { type: "varchar(255)" }, // For anonymous/guest saves
    productId: { type: "uuid", notNull: true },
    variantId: { type: "uuid" },
    addedFrom: { type: "varchar(50)" }, // e.g., 'basket', 'product_page', 'recommendation'
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for saved items
  pgm.createIndex("basket_saved_item", "customerId");
  pgm.createIndex("basket_saved_item", "sessionId");
  pgm.createIndex("basket_saved_item", "productId");
  
  // Create unique constraint to prevent duplicate saved items
  pgm.createIndex("basket_saved_item", ["customerId", "productId", "variantId"], {
    unique: true,
    where: "customerId IS NOT NULL",
    nulls: "not distinct"
  });
  
  pgm.createIndex("basket_saved_item", ["sessionId", "productId", "variantId"], {
    unique: true,
    where: "sessionId IS NOT NULL AND customerId IS NULL",
    nulls: "not distinct"
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("basket_discount");
  pgm.dropTable("basket_saved_item");
};
