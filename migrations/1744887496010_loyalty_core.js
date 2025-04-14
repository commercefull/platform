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
  // Create loyalty tier table
  pgm.createTable("loyalty_tier", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    type: { 
      type: "varchar(20)", 
      notNull: true,
      check: "type IN ('bronze', 'silver', 'gold', 'platinum', 'custom')" 
    },
    points_threshold: { type: "integer", notNull: true },
    multiplier: { type: "decimal(3,2)", notNull: true, default: 1.0 },
    benefits: { type: "text[]" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create loyalty points table
  pgm.createTable("loyalty_points", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    tier_id: { type: "uuid", notNull: true, references: "loyalty_tier", onDelete: "RESTRICT" },
    current_points: { type: "integer", notNull: true, default: 0 },
    lifetime_points: { type: "integer", notNull: true, default: 0 },
    last_activity: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expiry_date: { type: "timestamp" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create loyalty transaction table
  pgm.createTable("loyalty_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    order_id: { type: "uuid", references: "order", onDelete: "SET NULL" },
    action: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "action IN ('purchase', 'review', 'referral', 'signup', 'birthday', 'anniversary', 'manual_adjustment', 'redemption', 'expiration')" 
    },
    points: { type: "integer", notNull: true },
    description: { type: "text" },
    reference_id: { type: "uuid" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create loyalty reward table
  pgm.createTable("loyalty_reward", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    points_cost: { type: "integer", notNull: true },
    discount_amount: { type: "decimal(10,2)" },
    discount_percent: { type: "decimal(5,2)" },
    discount_code: { type: "varchar(50)" },
    free_shipping: { type: "boolean", notNull: true, default: false },
    product_ids: { type: "uuid[]" },
    expires_at: { type: "timestamp" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create loyalty redemption table
  pgm.createTable("loyalty_redemption", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    reward_id: { type: "uuid", notNull: true, references: "loyalty_reward", onDelete: "RESTRICT" },
    points_spent: { type: "integer", notNull: true },
    redemption_code: { type: "varchar(50)", notNull: true, unique: true },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'used', 'expired', 'cancelled')" 
    },
    used_at: { type: "timestamp" },
    expires_at: { type: "timestamp" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes
  pgm.createIndex("loyalty_tier", "points_threshold");
  pgm.createIndex("loyalty_tier", "is_active");
  
  pgm.createIndex("loyalty_points", "customer_id", { unique: true });
  pgm.createIndex("loyalty_points", "tier_id");
  pgm.createIndex("loyalty_points", "current_points");
  pgm.createIndex("loyalty_points", "lifetime_points");
  
  pgm.createIndex("loyalty_transaction", "customer_id");
  pgm.createIndex("loyalty_transaction", "order_id");
  pgm.createIndex("loyalty_transaction", "action");
  pgm.createIndex("loyalty_transaction", "created_at");
  
  pgm.createIndex("loyalty_reward", "points_cost");
  pgm.createIndex("loyalty_reward", "is_active");
  
  pgm.createIndex("loyalty_redemption", "customer_id");
  pgm.createIndex("loyalty_redemption", "reward_id");
  pgm.createIndex("loyalty_redemption", "redemption_code");
  pgm.createIndex("loyalty_redemption", "status");
  pgm.createIndex("loyalty_redemption", "expires_at");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("loyalty_redemption");
  pgm.dropTable("loyalty_reward");
  pgm.dropTable("loyalty_transaction");
  pgm.dropTable("loyalty_points");
  pgm.dropTable("loyalty_tier");
};
