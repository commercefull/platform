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
  // Create membership plan table
  pgm.createTable("membership_plan", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    short_description: { type: "varchar(255)" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_public: { type: "boolean", notNull: true, default: true }, // Whether visible to public
    is_default: { type: "boolean", notNull: true, default: false }, // Default for new members
    priority: { type: "integer", default: 0 }, // Display order
    level: { type: "integer", default: 1 }, // Membership tier level (1, 2, 3, etc.)
    trial_days: { type: "integer", default: 0 }, // Free trial period in days
    price: { type: "decimal(10,2)", notNull: true }, // Regular price
    sale_price: { type: "decimal(10,2)" }, // Discounted price
    setup_fee: { type: "decimal(10,2)", default: 0 }, // One-time setup fee
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    billing_cycle: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'monthly',
      check: "billing_cycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'biannual', 'annual', 'lifetime')" 
    },
    billing_period: { type: "integer", default: 1 }, // Number of billing cycle units
    max_members: { type: "integer" }, // Maximum allowed members (for group plans)
    auto_renew: { type: "boolean", notNull: true, default: true }, // Whether to auto-renew
    duration: { type: "integer" }, // Total duration in days (NULL = unlimited)
    grace_periods_allowed: { type: "integer", default: 0 }, // Number of payment grace periods
    grace_period_days: { type: "integer", default: 0 }, // Days in each grace period
    membership_image: { type: "text" }, // Badge or icon for membership
    public_details: { type: "jsonb" }, // Publicly visible details
    private_meta: { type: "jsonb" }, // Admin-only metadata
    visibility_rules: { type: "jsonb" }, // Rules for when plan is visible
    availability_rules: { type: "jsonb" }, // Rules for when plan is available
    custom_fields: { type: "jsonb" }, // Custom fields for the plan
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for membership plans
  pgm.createIndex("membership_plan", "code");
  pgm.createIndex("membership_plan", "is_active");
  pgm.createIndex("membership_plan", "is_public");
  pgm.createIndex("membership_plan", "is_default");
  pgm.createIndex("membership_plan", "priority");
  pgm.createIndex("membership_plan", "level");
  pgm.createIndex("membership_plan", "price");
  pgm.createIndex("membership_plan", "billing_cycle");

  // Only one default plan allowed
  pgm.createIndex("membership_plan", "is_default", { 
    unique: true,
    where: "is_default = true"
  });

  // Create membership benefit table
  pgm.createTable("membership_benefit", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    short_description: { type: "varchar(255)" },
    is_active: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // Display order
    benefit_type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "benefit_type IN ('discount', 'free_shipping', 'content_access', 'priority_support', 'reward_points', 'gift', 'early_access', 'custom')" 
    },
    value_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'fixed',
      check: "value_type IN ('fixed', 'percentage', 'boolean', 'text', 'json')" 
    },
    value: { type: "jsonb" }, // Configuration of the benefit
    icon: { type: "text" }, // Icon URL for the benefit
    rules: { type: "jsonb" }, // Rules for applying the benefit
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for membership benefits
  pgm.createIndex("membership_benefit", "code");
  pgm.createIndex("membership_benefit", "is_active");
  pgm.createIndex("membership_benefit", "priority");
  pgm.createIndex("membership_benefit", "benefit_type");
  pgm.createIndex("membership_benefit", "value_type");

  // Create plan benefit mapping table
  pgm.createTable("membership_plan_benefit", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    plan_id: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "CASCADE" },
    benefit_id: { type: "uuid", notNull: true, references: "membership_benefit", onDelete: "CASCADE" },
    is_active: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // Display order
    value_override: { type: "jsonb" }, // Override default benefit value
    rules_override: { type: "jsonb" }, // Override default benefit rules
    notes: { type: "text" }, // Internal notes
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for plan-benefit mappings
  pgm.createIndex("membership_plan_benefit", "plan_id");
  pgm.createIndex("membership_plan_benefit", "benefit_id");
  pgm.createIndex("membership_plan_benefit", "is_active");
  pgm.createIndex("membership_plan_benefit", "priority");
  pgm.createIndex("membership_plan_benefit", ["plan_id", "benefit_id"], { unique: true });

  // Create membership discount rule table
  pgm.createTable("membership_discount_rule", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    plan_id: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // For determining which rule applies
    discount_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "discount_type IN ('percentage', 'fixed_amount', 'free_item', 'buy_x_get_y')" 
    },
    discount_value: { type: "decimal(10,2)", notNull: true }, // Amount or percentage
    max_discount_amount: { type: "decimal(10,2)" }, // Cap on discount
    min_order_value: { type: "decimal(10,2)" }, // Minimum purchase for discount
    max_uses: { type: "integer" }, // Maximum times discount can be used
    uses_per_customer: { type: "integer" }, // Maximum uses per customer
    applies_to: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'entire_order',
      check: "applies_to IN ('entire_order', 'categories', 'products', 'shipping')" 
    },
    applicable_ids: { type: "uuid[]" }, // IDs of applicable products/categories
    excluded_ids: { type: "uuid[]" }, // IDs of excluded products/categories
    start_date: { type: "timestamp" }, // Optional start date
    end_date: { type: "timestamp" }, // Optional end date
    conditions: { type: "jsonb" }, // Additional conditions
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for membership discount rules
  pgm.createIndex("membership_discount_rule", "plan_id");
  pgm.createIndex("membership_discount_rule", "is_active");
  pgm.createIndex("membership_discount_rule", "priority");
  pgm.createIndex("membership_discount_rule", "discount_type");
  pgm.createIndex("membership_discount_rule", "discount_value");
  pgm.createIndex("membership_discount_rule", "applies_to");
  pgm.createIndex("membership_discount_rule", "start_date");
  pgm.createIndex("membership_discount_rule", "end_date");
  pgm.createIndex("membership_discount_rule", "applicable_ids", { method: "gin" });
  pgm.createIndex("membership_discount_rule", "excluded_ids", { method: "gin" });

  // Create membership content access table
  pgm.createTable("membership_content_access", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    plan_id: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    access_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "access_type IN ('content_page', 'category', 'product', 'media', 'download', 'feature')" 
    },
    accessible_ids: { type: "uuid[]" }, // IDs of accessible content
    conditions: { type: "jsonb" }, // Conditions for access
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for membership content access
  pgm.createIndex("membership_content_access", "plan_id");
  pgm.createIndex("membership_content_access", "is_active");
  pgm.createIndex("membership_content_access", "access_type");
  pgm.createIndex("membership_content_access", "accessible_ids", { method: "gin" });

  // Insert default membership plans
  pgm.sql(`
    INSERT INTO "membership_plan" (
      name, 
      code, 
      description, 
      short_description,
      is_active, 
      is_public,
      is_default,
      priority,
      level,
      price,
      billing_cycle
    )
    VALUES 
      ('Basic', 
       'BASIC', 
       'Basic membership plan with standard benefits', 
       'Essential membership benefits',
       true, 
       true,
       true,
       10,
       1,
       9.99,
       'monthly'),
      ('Premium', 
       'PREMIUM', 
       'Premium membership with additional benefits and features', 
       'Enhanced membership with more benefits',
       true, 
       true,
       false,
       20,
       2,
       19.99,
       'monthly'),
      ('Annual Premium', 
       'ANNUAL_PREMIUM', 
       'Annual premium membership with all benefits at a discounted rate', 
       'All benefits at a yearly discount',
       true, 
       true,
       false,
       30,
       2,
       199.99,
       'annual')
  `);

  // Insert default membership benefits
  pgm.sql(`
    INSERT INTO "membership_benefit" (
      name, 
      code, 
      description, 
      short_description,
      is_active,
      priority,
      benefit_type,
      value_type,
      value
    )
    VALUES 
      ('Member Discount', 
       'MEMBER_DISCOUNT', 
       'Discount on all purchases', 
       'Save on every order',
       true,
       10,
       'discount',
       'percentage',
       '{"percentage": 10}'
      ),
      ('Free Shipping', 
       'FREE_SHIPPING', 
       'Free shipping on all orders', 
       'No shipping costs',
       true,
       20,
       'free_shipping',
       'boolean',
       '{"enabled": true, "minimumOrderValue": 25}'
      ),
      ('Priority Support', 
       'PRIORITY_SUPPORT', 
       'Access to priority customer support', 
       'Get help faster',
       true,
       30,
       'priority_support',
       'boolean',
       '{"enabled": true}'
      ),
      ('Double Points', 
       'DOUBLE_POINTS', 
       'Earn double loyalty points on purchases', 
       'Earn rewards faster',
       true,
       40,
       'reward_points',
       'fixed',
       '{"multiplier": 2}'
      ),
      ('Exclusive Content', 
       'EXCLUSIVE_CONTENT', 
       'Access to exclusive member-only content', 
       'Members-only content',
       true,
       50,
       'content_access',
       'boolean',
       '{"enabled": true}'
      ),
      ('Early Access', 
       'EARLY_ACCESS', 
       'Early access to new products and sales', 
       'Shop before everyone else',
       true,
       60,
       'early_access',
       'fixed',
       '{"daysEarly": 2}'
      )
  `);

  // Link benefits to plans
  pgm.sql(`
    WITH 
      basic_plan AS (SELECT id FROM membership_plan WHERE code = 'BASIC'),
      premium_plan AS (SELECT id FROM membership_plan WHERE code = 'PREMIUM'),
      annual_plan AS (SELECT id FROM membership_plan WHERE code = 'ANNUAL_PREMIUM'),
      
      discount_benefit AS (SELECT id FROM membership_benefit WHERE code = 'MEMBER_DISCOUNT'),
      shipping_benefit AS (SELECT id FROM membership_benefit WHERE code = 'FREE_SHIPPING'),
      support_benefit AS (SELECT id FROM membership_benefit WHERE code = 'PRIORITY_SUPPORT'),
      points_benefit AS (SELECT id FROM membership_benefit WHERE code = 'DOUBLE_POINTS'),
      content_benefit AS (SELECT id FROM membership_benefit WHERE code = 'EXCLUSIVE_CONTENT'),
      early_benefit AS (SELECT id FROM membership_benefit WHERE code = 'EARLY_ACCESS')
      
    INSERT INTO "membership_plan_benefit" (plan_id, benefit_id, is_active, priority)
    VALUES 
      -- Basic plan benefits
      ((SELECT id FROM basic_plan), (SELECT id FROM discount_benefit), true, 10),
      ((SELECT id FROM basic_plan), (SELECT id FROM shipping_benefit), true, 20),
      
      -- Premium plan benefits
      ((SELECT id FROM premium_plan), (SELECT id FROM discount_benefit), true, 10),
      ((SELECT id FROM premium_plan), (SELECT id FROM shipping_benefit), true, 20),
      ((SELECT id FROM premium_plan), (SELECT id FROM support_benefit), true, 30),
      ((SELECT id FROM premium_plan), (SELECT id FROM points_benefit), true, 40),
      ((SELECT id FROM premium_plan), (SELECT id FROM content_benefit), true, 50),
      
      -- Annual Premium plan benefits
      ((SELECT id FROM annual_plan), (SELECT id FROM discount_benefit), true, 10),
      ((SELECT id FROM annual_plan), (SELECT id FROM shipping_benefit), true, 20),
      ((SELECT id FROM annual_plan), (SELECT id FROM support_benefit), true, 30),
      ((SELECT id FROM annual_plan), (SELECT id FROM points_benefit), true, 40),
      ((SELECT id FROM annual_plan), (SELECT id FROM content_benefit), true, 50),
      ((SELECT id FROM annual_plan), (SELECT id FROM early_benefit), true, 60)
  `);

  // Add discount rules for membership plans
  pgm.sql(`
    WITH 
      basic_plan AS (SELECT id FROM membership_plan WHERE code = 'BASIC'),
      premium_plan AS (SELECT id FROM membership_plan WHERE code = 'PREMIUM'),
      annual_plan AS (SELECT id FROM membership_plan WHERE code = 'ANNUAL_PREMIUM')
      
    INSERT INTO "membership_discount_rule" (
      plan_id, 
      name, 
      description, 
      is_active, 
      priority,
      discount_type,
      discount_value,
      applies_to
    )
    VALUES 
      -- Basic plan discount
      (
        (SELECT id FROM basic_plan), 
        'Basic Member Discount', 
        '10% discount on all orders', 
        true, 
        10,
        'percentage',
        10,
        'entire_order'
      ),
      
      -- Premium plan discount
      (
        (SELECT id FROM premium_plan), 
        'Premium Member Discount', 
        '15% discount on all orders', 
        true, 
        10,
        'percentage',
        15,
        'entire_order'
      ),
      
      -- Annual Premium plan discount
      (
        (SELECT id FROM annual_plan), 
        'Annual Premium Member Discount', 
        '20% discount on all orders', 
        true, 
        10,
        'percentage',
        20,
        'entire_order'
      )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("membership_content_access");
  pgm.dropTable("membership_discount_rule");
  pgm.dropTable("membership_plan_benefit");
  pgm.dropTable("membership_benefit");
  pgm.dropTable("membership_plan");
};
