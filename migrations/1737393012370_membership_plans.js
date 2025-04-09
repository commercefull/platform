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
    shortDescription: { type: "varchar(255)" },
    isActive: { type: "boolean", notNull: true, default: true },
    isPublic: { type: "boolean", notNull: true, default: true }, // Whether visible to public
    isDefault: { type: "boolean", notNull: true, default: false }, // Default for new members
    priority: { type: "integer", default: 0 }, // Display order
    level: { type: "integer", default: 1 }, // Membership tier level (1, 2, 3, etc.)
    trialDays: { type: "integer", default: 0 }, // Free trial period in days
    price: { type: "decimal(10,2)", notNull: true }, // Regular price
    salePrice: { type: "decimal(10,2)" }, // Discounted price
    setupFee: { type: "decimal(10,2)", default: 0 }, // One-time setup fee
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    billingCycle: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'monthly',
      check: "billingCycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'biannual', 'annual', 'lifetime')" 
    },
    billingPeriod: { type: "integer", default: 1 }, // Number of billing cycle units
    maxMembers: { type: "integer" }, // Maximum allowed members (for group plans)
    autoRenew: { type: "boolean", notNull: true, default: true }, // Whether to auto-renew
    duration: { type: "integer" }, // Total duration in days (NULL = unlimited)
    gracePeriodsAllowed: { type: "integer", default: 0 }, // Number of payment grace periods
    gracePeriodDays: { type: "integer", default: 0 }, // Days in each grace period
    membershipImage: { type: "text" }, // Badge or icon for membership
    publicDetails: { type: "jsonb" }, // Publicly visible details
    privateMeta: { type: "jsonb" }, // Admin-only metadata
    visibilityRules: { type: "jsonb" }, // Rules for when plan is visible
    availabilityRules: { type: "jsonb" }, // Rules for when plan is available
    customFields: { type: "jsonb" }, // Custom fields for the plan
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for membership plans
  pgm.createIndex("membership_plan", "code");
  pgm.createIndex("membership_plan", "isActive");
  pgm.createIndex("membership_plan", "isPublic");
  pgm.createIndex("membership_plan", "isDefault");
  pgm.createIndex("membership_plan", "priority");
  pgm.createIndex("membership_plan", "level");
  pgm.createIndex("membership_plan", "price");
  pgm.createIndex("membership_plan", "billingCycle");

  // Only one default plan allowed
  pgm.createIndex("membership_plan", "isDefault", { 
    unique: true,
    where: "isDefault = true"
  });

  // Create membership benefit table
  pgm.createTable("membership_benefit", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    shortDescription: { type: "varchar(255)" },
    isActive: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // Display order
    benefitType: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "benefitType IN ('discount', 'free_shipping', 'content_access', 'priority_support', 'reward_points', 'gift', 'early_access', 'custom')" 
    },
    valueType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'fixed',
      check: "valueType IN ('fixed', 'percentage', 'boolean', 'text', 'json')" 
    },
    value: { type: "jsonb" }, // Configuration of the benefit
    icon: { type: "text" }, // Icon URL for the benefit
    rules: { type: "jsonb" }, // Rules for applying the benefit
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for membership benefits
  pgm.createIndex("membership_benefit", "code");
  pgm.createIndex("membership_benefit", "isActive");
  pgm.createIndex("membership_benefit", "priority");
  pgm.createIndex("membership_benefit", "benefitType");
  pgm.createIndex("membership_benefit", "valueType");

  // Create plan benefit mapping table
  pgm.createTable("membership_plan_benefit", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    planId: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "CASCADE" },
    benefitId: { type: "uuid", notNull: true, references: "membership_benefit", onDelete: "CASCADE" },
    isActive: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // Display order
    valueOverride: { type: "jsonb" }, // Override default benefit value
    rulesOverride: { type: "jsonb" }, // Override default benefit rules
    notes: { type: "text" }, // Internal notes
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for plan-benefit mappings
  pgm.createIndex("membership_plan_benefit", "planId");
  pgm.createIndex("membership_plan_benefit", "benefitId");
  pgm.createIndex("membership_plan_benefit", "isActive");
  pgm.createIndex("membership_plan_benefit", "priority");
  pgm.createIndex("membership_plan_benefit", ["planId", "benefitId"], { unique: true });

  // Create membership discount rule table
  pgm.createTable("membership_discount_rule", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    planId: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // For determining which rule applies
    discountType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "discountType IN ('percentage', 'fixed_amount', 'free_item', 'buy_x_get_y')" 
    },
    discountValue: { type: "decimal(10,2)", notNull: true }, // Amount or percentage
    maxDiscountAmount: { type: "decimal(10,2)" }, // Cap on discount
    minOrderValue: { type: "decimal(10,2)" }, // Minimum purchase for discount
    maxUses: { type: "integer" }, // Maximum times discount can be used
    usesPerCustomer: { type: "integer" }, // Maximum uses per customer
    appliesTo: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'entire_order',
      check: "appliesTo IN ('entire_order', 'categories', 'products', 'shipping')" 
    },
    applicableIds: { type: "uuid[]" }, // IDs of applicable products/categories
    excludedIds: { type: "uuid[]" }, // IDs of excluded products/categories
    startDate: { type: "timestamp" }, // Optional start date
    endDate: { type: "timestamp" }, // Optional end date
    conditions: { type: "jsonb" }, // Additional conditions
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for membership discount rules
  pgm.createIndex("membership_discount_rule", "planId");
  pgm.createIndex("membership_discount_rule", "isActive");
  pgm.createIndex("membership_discount_rule", "priority");
  pgm.createIndex("membership_discount_rule", "discountType");
  pgm.createIndex("membership_discount_rule", "discountValue");
  pgm.createIndex("membership_discount_rule", "appliesTo");
  pgm.createIndex("membership_discount_rule", "startDate");
  pgm.createIndex("membership_discount_rule", "endDate");
  pgm.createIndex("membership_discount_rule", "applicableIds", { method: "gin" });
  pgm.createIndex("membership_discount_rule", "excludedIds", { method: "gin" });

  // Create membership content access table
  pgm.createTable("membership_content_access", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    planId: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    accessType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "accessType IN ('content_page', 'category', 'product', 'media', 'download', 'feature')" 
    },
    accessibleIds: { type: "uuid[]" }, // IDs of accessible content
    conditions: { type: "jsonb" }, // Conditions for access
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for membership content access
  pgm.createIndex("membership_content_access", "planId");
  pgm.createIndex("membership_content_access", "isActive");
  pgm.createIndex("membership_content_access", "accessType");
  pgm.createIndex("membership_content_access", "accessibleIds", { method: "gin" });

  // Insert default membership plans
  pgm.sql(`
    INSERT INTO "membership_plan" (
      name, 
      code, 
      description, 
      shortDescription,
      isActive, 
      isPublic,
      isDefault,
      priority,
      level,
      price,
      billingCycle
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
      shortDescription,
      isActive,
      priority,
      benefitType,
      valueType,
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
      
    INSERT INTO "membership_plan_benefit" (planId, benefitId, isActive, priority)
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
      planId, 
      name, 
      description, 
      isActive, 
      priority,
      discountType,
      discountValue,
      appliesTo
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
