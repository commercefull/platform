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
  // Create the main basket table
  pgm.createTable("basket", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", references: "customer" }, // Can be null for guest baskets
    session_id: { type: "varchar(255)" }, // For anonymous/guest carts
    status: { 
      type: "varchar(20)", 
      notNull: true,
      default: "active", 
      check: "status IN ('active', 'merged', 'converted', 'abandoned', 'completed')" 
    },
    currency: { type: "varchar(3)", notNull: true, default: "USD" },
    items_count: { type: "integer", notNull: true, default: 0 },
    sub_total: { type: "decimal(15,2)", notNull: true, default: 0 },
    tax_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    discount_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    shipping_amount: { type: "decimal(15,2)", notNull: true, default: 0 },
    grand_total: { type: "decimal(15,2)", notNull: true, default: 0 },
    meta: { type: "jsonb" }, // For any additional data
    expires_at: { type: "timestamp" }, // When the basket expires (for abandoned carts)
    converted_to_order_id: { type: "uuid" }, // Reference to the order if checkout completed
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    last_activity_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for efficient querying
  pgm.createIndex("basket", "customer_id");
  pgm.createIndex("basket", "session_id");
  pgm.createIndex("basket", "status");
  pgm.createIndex("basket", "last_activity_at");
  pgm.createIndex("basket", "expires_at");
  pgm.createIndex("basket", "converted_to_order_id");

  // Create a unique index to ensure a customer can only have one active basket
  pgm.createIndex("basket", ["customer_id", "status"], {
    unique: true,
    where: "status = 'active' AND customer_id IS NOT NULL"
  });

  // Create a unique index to ensure a session can only have one active basket
  pgm.createIndex("basket", ["session_id", "status"], {
    unique: true,
    where: "status = 'active' AND session_id IS NOT NULL AND customer_id IS NULL"
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("basket");
};
