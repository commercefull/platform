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
  // Create membership subscription table
  pgm.createTable("membership_subscription", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    plan_id: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "RESTRICT" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'cancelled', 'expired', 'paused', 'trial', 'pending', 'past_due')" 
    },
    membership_number: { type: "varchar(100)" }, // Unique membership identifier
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    end_date: { type: "timestamp" }, // NULL means indefinite (until cancelled)
    trial_end_date: { type: "timestamp" },
    next_billing_date: { type: "timestamp" },
    last_billing_date: { type: "timestamp" },
    cancelled_at: { type: "timestamp" },
    cancel_reason: { type: "text" },
    is_auto_renew: { type: "boolean", notNull: true, default: true },
    price_override: { type: "decimal(10,2)" }, // Override the plan price if needed
    billing_cycle_override: { type: "varchar(20)" }, // Override the billing cycle if needed
    payment_method_id: { type: "uuid" }, // Link to customer payment method
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for membership subscriptions
  pgm.createIndex("membership_subscription", "customer_id");
  pgm.createIndex("membership_subscription", "plan_id");
  pgm.createIndex("membership_subscription", "status");
  pgm.createIndex("membership_subscription", "membership_number", { unique: true, where: "membership_number IS NOT NULL" });
  pgm.createIndex("membership_subscription", "start_date");
  pgm.createIndex("membership_subscription", "end_date");
  pgm.createIndex("membership_subscription", "trial_end_date");
  pgm.createIndex("membership_subscription", "next_billing_date");
  pgm.createIndex("membership_subscription", "is_auto_renew");
  pgm.createIndex("membership_subscription", "created_at");

  // Create membership payment history table
  pgm.createTable("membership_payment", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscription_id: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    amount: { type: "decimal(10,2)", notNull: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    payment_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')" 
    },
    payment_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "payment_type IN ('subscription', 'setup_fee', 'manual', 'refund')" 
    },
    payment_method: { type: "varchar(50)" }, // Credit card, PayPal, etc.
    transaction_id: { type: "varchar(255)" }, // Payment processor transaction ID
    billing_period_start: { type: "timestamp" },
    billing_period_end: { type: "timestamp" },
    metadata: { type: "jsonb" },
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership payments
  pgm.createIndex("membership_payment", "subscription_id");
  pgm.createIndex("membership_payment", "customer_id");
  pgm.createIndex("membership_payment", "payment_date");
  pgm.createIndex("membership_payment", "status");
  pgm.createIndex("membership_payment", "payment_type");
  pgm.createIndex("membership_payment", "transaction_id");
  pgm.createIndex("membership_payment", "billing_period_start");
  pgm.createIndex("membership_payment", "billing_period_end");

  // Create membership group table (for family/group memberships)
  pgm.createTable("membership_group", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscription_id: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    name: { type: "varchar(100)" },
    primary_member_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    max_members: { type: "integer", default: 5 },
    current_members: { type: "integer", notNull: true, default: 1 },
    is_active: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership groups
  pgm.createIndex("membership_group", "subscription_id");
  pgm.createIndex("membership_group", "primary_member_id");
  pgm.createIndex("membership_group", "is_active");

  // Create membership group member table
  pgm.createTable("membership_group_member", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    group_id: { type: "uuid", notNull: true, references: "membership_group", onDelete: "CASCADE" },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    is_primary: { type: "boolean", notNull: true, default: false },
    membership_number: { type: "varchar(100)" }, // Unique membership identifier for this member
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'inactive', 'pending', 'removed')" 
    },
    joined_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expires_at: { type: "timestamp" },
    invitation_email: { type: "varchar(255)" },
    invitation_status: { 
      type: "varchar(20)", 
      default: 'none',
      check: "invitation_status IN ('none', 'sent', 'accepted', 'declined', 'expired')" 
    },
    invitation_sent_at: { type: "timestamp" },
    invitation_accepted_at: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership group members
  pgm.createIndex("membership_group_member", "group_id");
  pgm.createIndex("membership_group_member", "customer_id");
  pgm.createIndex("membership_group_member", "is_primary");
  pgm.createIndex("membership_group_member", "membership_number", { unique: true, where: "membership_number IS NOT NULL" });
  pgm.createIndex("membership_group_member", "status");
  pgm.createIndex("membership_group_member", "joined_at");
  pgm.createIndex("membership_group_member", "expires_at");
  pgm.createIndex("membership_group_member", "invitation_email");
  pgm.createIndex("membership_group_member", "invitation_status");
  pgm.createIndex("membership_group_member", ["group_id", "customer_id"], { unique: true });

  // Create membership benefit usage table
  pgm.createTable("membership_benefit_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscription_id: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    benefit_id: { type: "uuid", notNull: true, references: "membership_benefit", onDelete: "CASCADE" },
    usage_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    usage_value: { type: "decimal(10,2)", notNull: true, default: 1 }, // Quantity/amount used
    usage_type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "usage_type IN ('discount_applied', 'free_shipping', 'content_access', 'gift_redeemed', 'points_multiplier', 'early_access')" 
    },
    related_entity_type: { type: "varchar(50)" }, // 'order', 'content', etc.
    related_entity_id: { type: "uuid" }, // ID of related entity
    details: { type: "jsonb" }, // Usage details
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership benefit usage
  pgm.createIndex("membership_benefit_usage", "subscription_id");
  pgm.createIndex("membership_benefit_usage", "customer_id");
  pgm.createIndex("membership_benefit_usage", "benefit_id");
  pgm.createIndex("membership_benefit_usage", "usage_date");
  pgm.createIndex("membership_benefit_usage", "usage_type");
  pgm.createIndex("membership_benefit_usage", "related_entity_type");
  pgm.createIndex("membership_benefit_usage", "related_entity_id");

  // Create membership status log table (for tracking subscription status changes)
  pgm.createTable("membership_status_log", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscription_id: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    previous_status: { type: "varchar(20)" },
    new_status: { type: "varchar(20)", notNull: true },
    change_reason: { type: "text" },
    change_source: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'system',
      check: "change_source IN ('system', 'admin', 'customer', 'payment', 'api')" 
    },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for membership status logs
  pgm.createIndex("membership_status_log", "subscription_id");
  pgm.createIndex("membership_status_log", "previous_status");
  pgm.createIndex("membership_status_log", "new_status");
  pgm.createIndex("membership_status_log", "change_source");
  pgm.createIndex("membership_status_log", "created_at");

  // Create membership discount code table
  pgm.createTable("membership_discount_code", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    plan_id: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "CASCADE" },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    discount_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "discount_type IN ('percentage', 'fixed_amount', 'free_period')" 
    },
    discount_value: { type: "decimal(10,2)", notNull: true }, // Amount, percentage, or period
    valid_from: { type: "timestamp" },
    valid_to: { type: "timestamp" },
    max_uses: { type: "integer" }, // Total number of allowed uses
    uses_remaining: { type: "integer" }, // Remaining uses
    uses_per_customer: { type: "integer", default: 1 }, // Max uses per customer
    first_time_only: { type: "boolean", notNull: true, default: false }, // Only for new members
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for membership discount codes
  pgm.createIndex("membership_discount_code", "plan_id");
  pgm.createIndex("membership_discount_code", "code");
  pgm.createIndex("membership_discount_code", "is_active");
  pgm.createIndex("membership_discount_code", "discount_type");
  pgm.createIndex("membership_discount_code", "valid_from");
  pgm.createIndex("membership_discount_code", "valid_to");
  pgm.createIndex("membership_discount_code", "first_time_only");

  // Create membership discount code usage table
  pgm.createTable("membership_discount_code_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    discount_code_id: { type: "uuid", notNull: true, references: "membership_discount_code", onDelete: "CASCADE" },
    subscription_id: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    used_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    discount_amount: { type: "decimal(10,2)", notNull: true }, // Actual discount amount
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership discount code usage
  pgm.createIndex("membership_discount_code_usage", "discount_code_id");
  pgm.createIndex("membership_discount_code_usage", "subscription_id");
  pgm.createIndex("membership_discount_code_usage", "customer_id");
  pgm.createIndex("membership_discount_code_usage", "used_at");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("membership_discount_code_usage");
  pgm.dropTable("membership_discount_code");
  pgm.dropTable("membership_status_log");
  pgm.dropTable("membership_benefit_usage");
  pgm.dropTable("membership_group_member");
  pgm.dropTable("membership_group");
  pgm.dropTable("membership_payment");
  pgm.dropTable("membership_subscription");
};
