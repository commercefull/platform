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
    customerId: { type: "uuid", references: "customer" }, // Can be null for guest baskets
    sessionId: { type: "varchar(255)" }, // For anonymous/guest carts
    status: { 
      type: "varchar(20)", 
      notNull: true,
      default: "active", 
      check: "status IN ('active', 'merged', 'converted', 'abandoned', 'completed')" 
    },
    currency: { type: "varchar(3)", notNull: true, default: "USD" },
    itemsCount: { type: "integer", notNull: true, default: 0 },
    subTotal: { type: "decimal(15,2)", notNull: true, default: 0 },
    taxAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    discountAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    shippingAmount: { type: "decimal(15,2)", notNull: true, default: 0 },
    grandTotal: { type: "decimal(15,2)", notNull: true, default: 0 },
    meta: { type: "jsonb" }, // For any additional data
    expiresAt: { type: "timestamp" }, // When the basket expires (for abandoned carts)
    convertedToOrderId: { type: "uuid" }, // Reference to the order if checkout completed
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    lastActivityAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for efficient querying
  pgm.createIndex("basket", "customerId");
  pgm.createIndex("basket", "sessionId");
  pgm.createIndex("basket", "status");
  pgm.createIndex("basket", "lastActivityAt");
  pgm.createIndex("basket", "expiresAt");
  pgm.createIndex("basket", "convertedToOrderId");

  // Create a unique index to ensure a customer can only have one active basket
  pgm.createIndex("basket", ["customerId", "status"], {
    unique: true,
    where: "status = 'active' AND customerId IS NOT NULL"
  });

  // Create a unique index to ensure a session can only have one active basket
  pgm.createIndex("basket", ["sessionId", "status"], {
    unique: true,
    where: "status = 'active' AND sessionId IS NOT NULL AND customerId IS NULL"
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
