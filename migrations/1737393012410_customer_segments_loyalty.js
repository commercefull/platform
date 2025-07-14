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
  // Create customer segments table for dynamic customer grouping
  pgm.createTable("customer_segments", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    conditions: { type: "jsonb" }, // Rules for automatic segment assignment
    is_active: { type: "boolean", notNull: true, default: true },
    is_automatic: { type: "boolean", notNull: true, default: false }, // Whether segment is dynamically calculated
    last_run: { type: "timestamp" }, // Last time segment membership was calculated
    member_count: { type: "integer", default: 0 }, // Cached count of members
    priority: { type: "integer", default: 0 }, // For segment precedence
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for customer segments
  pgm.createIndex("customer_segments", "name");
  pgm.createIndex("customer_segments", "is_active");
  pgm.createIndex("customer_segments", "is_automatic");
  pgm.createIndex("customer_segments", "priority");

  // Create customer segment membership table
  pgm.createTable("customer_segment_membership", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    segment_id: { type: "uuid", notNull: true, references: "customer_segments", onDelete: "CASCADE" },
    is_active: { type: "boolean", notNull: true, default: true },
    source: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "manual", 
      check: "source IN ('manual', 'automatic', 'import')" 
    },
    score: { type: "decimal(5,2)" }, // For scoring/ranking within segment
    expires_at: { type: "timestamp" }, // For time-limited segment membership
    added_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    added_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for segment membership
  pgm.createIndex("customer_segment_membership", "customer_id");
  pgm.createIndex("customer_segment_membership", "segment_id");
  pgm.createIndex("customer_segment_membership", "is_active");
  pgm.createIndex("customer_segment_membership", "source");
  pgm.createIndex("customer_segment_membership", "expires_at");
  pgm.createIndex("customer_segment_membership", ["customer_id", "segment_id"], { unique: true });

  // Create customer loyalty program table
  pgm.createTable("customer_loyalty_program", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    end_date: { type: "timestamp" }, // Optional end date for temporary programs
    points_name: { type: "varchar(50)", notNull: true, default: 'Points' }, // Custom name for points
    points_abbreviation: { type: "varchar(10)", notNull: true, default: 'pts' }, // Short form
    point_to_value_ratio: { type: "decimal(10,4)", notNull: true, default: 0.01 }, // E.g., 0.01 means 100 points = $1
    minimum_redemption: { type: "integer", notNull: true, default: 500 }, // Minimum points for redemption
    redemption_multiple: { type: "integer", notNull: true, default: 100 }, // Points must be redeemed in multiples
    enrollment_bonus: { type: "integer", default: 0 }, // Bonus points on enrollment
    rules: { type: "jsonb" }, // Program rules and earning structure
    tiers: { type: "jsonb" }, // Loyalty tiers configuration
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for loyalty program
  pgm.createIndex("customer_loyalty_program", "name");
  pgm.createIndex("customer_loyalty_program", "is_active");
  pgm.createIndex("customer_loyalty_program", "start_date");
  pgm.createIndex("customer_loyalty_program", "end_date");

  // Create customer loyalty account table
  pgm.createTable("customer_loyalty_account", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    program_id: { type: "uuid", notNull: true, references: "customer_loyalty_program", onDelete: "CASCADE" },
    member_number: { type: "varchar(50)" }, // Customer's loyalty program ID
    tier: { type: "varchar(50)", default: 'Standard' }, // Current loyalty tier
    points_balance: { type: "integer", notNull: true, default: 0 },
    points_earned: { type: "integer", notNull: true, default: 0 }, // Total lifetime points earned
    points_spent: { type: "integer", notNull: true, default: 0 }, // Total lifetime points spent
    points_expired: { type: "integer", notNull: true, default: 0 }, // Total lifetime points expired
    last_activity: { type: "timestamp" },
    enrolled_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expires_at: { type: "timestamp" }, // Account expiration (if applicable)
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for loyalty accounts
  pgm.createIndex("customer_loyalty_account", "customer_id");
  pgm.createIndex("customer_loyalty_account", "program_id");
  pgm.createIndex("customer_loyalty_account", "member_number", { unique: true, where: "member_number IS NOT NULL" });
  pgm.createIndex("customer_loyalty_account", "tier");
  pgm.createIndex("customer_loyalty_account", "points_balance");
  pgm.createIndex("customer_loyalty_account", "is_active");
  pgm.createIndex("customer_loyalty_account", "last_activity");
  pgm.createIndex("customer_loyalty_account", ["customer_id", "program_id"], { unique: true });

  // Create customer loyalty transaction table
  pgm.createTable("customer_loyalty_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    account_id: { type: "uuid", notNull: true, references: "customer_loyalty_account", onDelete: "CASCADE" },
    order_id: { type: "uuid", references: "\"order\"" }, // Optional reference to an order
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "type IN ('earn', 'redeem', 'adjust', 'expire', 'bonus', 'referral', 'refund')" 
    },
    points: { type: "integer", notNull: true }, // Positive for earning, negative for spending
    balance: { type: "integer", notNull: true }, // Running balance after transaction
    description: { type: "text", notNull: true },
    source: { type: "varchar(50)", notNull: true }, // E.g., 'purchase', 'promotion', 'admin'
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'completed', 
      check: "status IN ('pending', 'completed', 'cancelled', 'expired')" 
    },
    expires_at: { type: "timestamp" }, // When these points expire
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" } // Reference to admin user or system
  });

  // Create indexes for loyalty transactions
  pgm.createIndex("customer_loyalty_transaction", "account_id");
  pgm.createIndex("customer_loyalty_transaction", "order_id");
  pgm.createIndex("customer_loyalty_transaction", "type");
  pgm.createIndex("customer_loyalty_transaction", "status");
  pgm.createIndex("customer_loyalty_transaction", "expires_at");
  pgm.createIndex("customer_loyalty_transaction", "created_at");

  // Create customer analytics table for storing aggregated metrics
  pgm.createTable("customer_analytics", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    total_orders: { type: "integer", notNull: true, default: 0 },
    total_spent: { type: "decimal(15,2)", notNull: true, default: 0 },
    average_order_value: { type: "decimal(15,2)" },
    first_order_date: { type: "timestamp" },
    last_order_date: { type: "timestamp" },
    last_visit_date: { type: "timestamp" },
    visit_count: { type: "integer", notNull: true, default: 0 },
    cart_count: { type: "integer", notNull: true, default: 0 },
    abandoned_carts: { type: "integer", notNull: true, default: 0 },
    product_views: { type: "integer", notNull: true, default: 0 },
    wishlist_item_count: { type: "integer", notNull: true, default: 0 },
    review_count: { type: "integer", notNull: true, default: 0 },
    average_review_rating: { type: "decimal(3,2)" },
    lifetime_value: { type: "decimal(15,2)" }, // Predicted lifetime value
    risk_score: { type: "decimal(5,2)" }, // Fraud/risk assessment score
    engagement_score: { type: "decimal(5,2)" }, // Customer engagement score
    churn_risk: { type: "decimal(5,2)" }, // Probability of churn
    preferred_categories: { type: "jsonb" }, // Most ordered categories
    preferred_products: { type: "jsonb" }, // Most ordered products
    preferred_payment_methods: { type: "jsonb" }, // Payment method preferences
    preferred_shipping_methods: { type: "jsonb" }, // Shipping method preferences
    segment_data: { type: "jsonb" }, // Derived segment data
    device_usage: { type: "jsonb" }, // Device type usage patterns
    lastupdated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer analytics
  pgm.createIndex("customer_analytics", "customer_id", { unique: true });
  pgm.createIndex("customer_analytics", "total_orders");
  pgm.createIndex("customer_analytics", "total_spent");
  pgm.createIndex("customer_analytics", "average_order_value");
  pgm.createIndex("customer_analytics", "last_order_date");
  pgm.createIndex("customer_analytics", "lifetime_value");
  pgm.createIndex("customer_analytics", "engagement_score");
  pgm.createIndex("customer_analytics", "churn_risk");

  // Create customer notes table for admin/staff notes
  pgm.createTable("customer_note", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    title: { type: "varchar(255)" },
    content: { type: "text", notNull: true },
    type: { 
      type: "varchar(50)", 
      default: 'general', 
      check: "type IN ('general', 'support', 'order', 'payment', 'shipping', 'preference', 'flag')" 
    },
    is_internal: { type: "boolean", notNull: true, default: true }, // Whether visible to customer
    is_pinned: { type: "boolean", notNull: true, default: false }, // Whether note is pinned to top
    related_entity_type: { type: "varchar(50)" }, // E.g., 'order', 'support_ticket'
    related_entity_id: { type: "uuid" }, // ID of related entity
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid", notNull: true }, // Reference to admin user
    updated_at: { type: "timestamp" },
    updated_by: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for customer notes
  pgm.createIndex("customer_note", "customer_id");
  pgm.createIndex("customer_note", "type");
  pgm.createIndex("customer_note", "is_pinned");
  pgm.createIndex("customer_note", "related_entity_type");
  pgm.createIndex("customer_note", "related_entity_id");
  pgm.createIndex("customer_note", "created_at");

  // Insert default customer segments
  pgm.sql(`
    INSERT INTO "customer_segments" (name, description, is_active, is_automatic, priority)
    VALUES 
      ('New Customers', 'Customers who registered in the last 30 days', true, true, 10),
      ('Active Customers', 'Customers who ordered in the last 90 days', true, true, 20),
      ('At-Risk Customers', 'Previously active customers with no recent orders', true, true, 30),
      ('VIP Customers', 'Top spending customers', true, true, 40),
      ('One-Time Buyers', 'Customers with exactly one purchase', true, true, 50),
      ('Repeat Customers', 'Customers with more than one purchase', true, true, 60)
  `);

  // Insert default loyalty program
  pgm.sql(`
    INSERT INTO "customer_loyalty_program" (
      name, 
      description, 
      is_active, 
      points_name, 
      points_abbreviation, 
      point_to_value_ratio,
      minimum_redemption,
      redemption_multiple,
      enrollment_bonus
    )
    VALUES (
      'Reward Points', 
      'Standard loyalty program awarding points for purchases', 
      true,
      'Points',
      'pts',
      0.01,
      500,
      100,
      200
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("customer_note");
  pgm.dropTable("customer_analytics");
  pgm.dropTable("customer_loyalty_transaction");
  pgm.dropTable("customer_loyalty_account");
  pgm.dropTable("customer_loyalty_program");
  pgm.dropTable("customer_segment_membership");
  pgm.dropTable("customer_segments");
};
