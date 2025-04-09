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
  // Create customer segment table for dynamic customer grouping
  pgm.createTable("customer_segment", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    isAutomatic: { type: "boolean", notNull: true, default: false }, // Whether segment is dynamically calculated
    conditions: { type: "jsonb" }, // Rules for automatic segment assignment
    lastRun: { type: "timestamp" }, // Last time segment membership was calculated
    memberCount: { type: "integer", default: 0 }, // Cached count of members
    priority: { type: "integer", default: 0 }, // For segment precedence
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for customer segments
  pgm.createIndex("customer_segment", "name");
  pgm.createIndex("customer_segment", "isActive");
  pgm.createIndex("customer_segment", "isAutomatic");
  pgm.createIndex("customer_segment", "priority");

  // Create customer segment membership table
  pgm.createTable("customer_segment_membership", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    segmentId: { type: "uuid", notNull: true, references: "customer_segment", onDelete: "CASCADE" },
    isActive: { type: "boolean", notNull: true, default: true },
    source: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "manual", 
      check: "source IN ('manual', 'automatic', 'import')" 
    },
    score: { type: "decimal(5,2)" }, // For scoring/ranking within segment
    expiresAt: { type: "timestamp" }, // For time-limited segment membership
    addedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    addedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for segment membership
  pgm.createIndex("customer_segment_membership", "customerId");
  pgm.createIndex("customer_segment_membership", "segmentId");
  pgm.createIndex("customer_segment_membership", "isActive");
  pgm.createIndex("customer_segment_membership", "source");
  pgm.createIndex("customer_segment_membership", "expiresAt");
  pgm.createIndex("customer_segment_membership", ["customerId", "segmentId"], { unique: true });

  // Create customer loyalty program table
  pgm.createTable("customer_loyalty_program", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" }, // Optional end date for temporary programs
    pointsName: { type: "varchar(50)", notNull: true, default: 'Points' }, // Custom name for points
    pointsAbbreviation: { type: "varchar(10)", notNull: true, default: 'pts' }, // Short form
    pointToValueRatio: { type: "decimal(10,4)", notNull: true, default: 0.01 }, // E.g., 0.01 means 100 points = $1
    minimumRedemption: { type: "integer", notNull: true, default: 500 }, // Minimum points for redemption
    redemptionMultiple: { type: "integer", notNull: true, default: 100 }, // Points must be redeemed in multiples
    enrollmentBonus: { type: "integer", default: 0 }, // Bonus points on enrollment
    rules: { type: "jsonb" }, // Program rules and earning structure
    tiers: { type: "jsonb" }, // Loyalty tiers configuration
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for loyalty program
  pgm.createIndex("customer_loyalty_program", "name");
  pgm.createIndex("customer_loyalty_program", "isActive");
  pgm.createIndex("customer_loyalty_program", "startDate");
  pgm.createIndex("customer_loyalty_program", "endDate");

  // Create customer loyalty account table
  pgm.createTable("customer_loyalty_account", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    programId: { type: "uuid", notNull: true, references: "customer_loyalty_program", onDelete: "CASCADE" },
    memberNumber: { type: "varchar(50)" }, // Customer's loyalty program ID
    tier: { type: "varchar(50)", default: 'Standard' }, // Current loyalty tier
    pointsBalance: { type: "integer", notNull: true, default: 0 },
    pointsEarned: { type: "integer", notNull: true, default: 0 }, // Total lifetime points earned
    pointsSpent: { type: "integer", notNull: true, default: 0 }, // Total lifetime points spent
    pointsExpired: { type: "integer", notNull: true, default: 0 }, // Total lifetime points expired
    lastActivity: { type: "timestamp" },
    enrolledAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expiresAt: { type: "timestamp" }, // Account expiration (if applicable)
    isActive: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for loyalty accounts
  pgm.createIndex("customer_loyalty_account", "customerId");
  pgm.createIndex("customer_loyalty_account", "programId");
  pgm.createIndex("customer_loyalty_account", "memberNumber", { unique: true, where: "memberNumber IS NOT NULL" });
  pgm.createIndex("customer_loyalty_account", "tier");
  pgm.createIndex("customer_loyalty_account", "pointsBalance");
  pgm.createIndex("customer_loyalty_account", "isActive");
  pgm.createIndex("customer_loyalty_account", "lastActivity");
  pgm.createIndex("customer_loyalty_account", ["customerId", "programId"], { unique: true });

  // Create customer loyalty transaction table
  pgm.createTable("customer_loyalty_transaction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    accountId: { type: "uuid", notNull: true, references: "customer_loyalty_account", onDelete: "CASCADE" },
    orderId: { type: "uuid", references: "order" }, // Optional reference to an order
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
    expiresAt: { type: "timestamp" }, // When these points expire
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" } // Reference to admin user or system
  });

  // Create indexes for loyalty transactions
  pgm.createIndex("customer_loyalty_transaction", "accountId");
  pgm.createIndex("customer_loyalty_transaction", "orderId");
  pgm.createIndex("customer_loyalty_transaction", "type");
  pgm.createIndex("customer_loyalty_transaction", "status");
  pgm.createIndex("customer_loyalty_transaction", "expiresAt");
  pgm.createIndex("customer_loyalty_transaction", "createdAt");

  // Create customer analytics table for storing aggregated metrics
  pgm.createTable("customer_analytics", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    totalOrders: { type: "integer", notNull: true, default: 0 },
    totalSpent: { type: "decimal(15,2)", notNull: true, default: 0 },
    averageOrderValue: { type: "decimal(15,2)" },
    firstOrderDate: { type: "timestamp" },
    lastOrderDate: { type: "timestamp" },
    lastVisitDate: { type: "timestamp" },
    visitCount: { type: "integer", notNull: true, default: 0 },
    cartCount: { type: "integer", notNull: true, default: 0 },
    abandonedCarts: { type: "integer", notNull: true, default: 0 },
    productViews: { type: "integer", notNull: true, default: 0 },
    wishlistItemCount: { type: "integer", notNull: true, default: 0 },
    reviewCount: { type: "integer", notNull: true, default: 0 },
    averageReviewRating: { type: "decimal(3,2)" },
    lifetimeValue: { type: "decimal(15,2)" }, // Predicted lifetime value
    riskScore: { type: "decimal(5,2)" }, // Fraud/risk assessment score
    engagementScore: { type: "decimal(5,2)" }, // Customer engagement score
    churnRisk: { type: "decimal(5,2)" }, // Probability of churn
    preferredCategories: { type: "jsonb" }, // Most ordered categories
    preferredProducts: { type: "jsonb" }, // Most ordered products
    preferredPaymentMethods: { type: "jsonb" }, // Payment method preferences
    preferredShippingMethods: { type: "jsonb" }, // Shipping method preferences
    segmentData: { type: "jsonb" }, // Derived segment data
    deviceUsage: { type: "jsonb" }, // Device type usage patterns
    lastUpdatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer analytics
  pgm.createIndex("customer_analytics", "customerId", { unique: true });
  pgm.createIndex("customer_analytics", "totalOrders");
  pgm.createIndex("customer_analytics", "totalSpent");
  pgm.createIndex("customer_analytics", "averageOrderValue");
  pgm.createIndex("customer_analytics", "lastOrderDate");
  pgm.createIndex("customer_analytics", "lifetimeValue");
  pgm.createIndex("customer_analytics", "engagementScore");
  pgm.createIndex("customer_analytics", "churnRisk");

  // Create customer notes table for admin/staff notes
  pgm.createTable("customer_note", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    title: { type: "varchar(255)" },
    content: { type: "text", notNull: true },
    type: { 
      type: "varchar(50)", 
      default: 'general', 
      check: "type IN ('general', 'support', 'order', 'payment', 'shipping', 'preference', 'flag')" 
    },
    isInternal: { type: "boolean", notNull: true, default: true }, // Whether visible to customer
    isPinned: { type: "boolean", notNull: true, default: false }, // Whether note is pinned to top
    relatedEntityType: { type: "varchar(50)" }, // E.g., 'order', 'support_ticket'
    relatedEntityId: { type: "uuid" }, // ID of related entity
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid", notNull: true }, // Reference to admin user
    updatedAt: { type: "timestamp" },
    updatedBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for customer notes
  pgm.createIndex("customer_note", "customerId");
  pgm.createIndex("customer_note", "type");
  pgm.createIndex("customer_note", "isPinned");
  pgm.createIndex("customer_note", "relatedEntityType");
  pgm.createIndex("customer_note", "relatedEntityId");
  pgm.createIndex("customer_note", "createdAt");

  // Insert default customer segments
  pgm.sql(`
    INSERT INTO "customer_segment" (name, description, isActive, isAutomatic, priority)
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
      isActive, 
      pointsName, 
      pointsAbbreviation, 
      pointToValueRatio,
      minimumRedemption,
      redemptionMultiple,
      enrollmentBonus
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
  pgm.dropTable("customer_segment");
};
