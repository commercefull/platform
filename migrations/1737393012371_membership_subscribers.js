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
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    planId: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "RESTRICT" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'cancelled', 'expired', 'paused', 'trial', 'pending', 'past_due')" 
    },
    membershipNumber: { type: "varchar(100)" }, // Unique membership identifier
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" }, // NULL means indefinite (until cancelled)
    trialEndDate: { type: "timestamp" },
    nextBillingDate: { type: "timestamp" },
    lastBillingDate: { type: "timestamp" },
    cancelledAt: { type: "timestamp" },
    cancelReason: { type: "text" },
    isAutoRenew: { type: "boolean", notNull: true, default: true },
    priceOverride: { type: "decimal(10,2)" }, // Override the plan price if needed
    billingCycleOverride: { type: "varchar(20)" }, // Override the billing cycle if needed
    paymentMethodId: { type: "uuid" }, // Link to customer payment method
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for membership subscriptions
  pgm.createIndex("membership_subscription", "customerId");
  pgm.createIndex("membership_subscription", "planId");
  pgm.createIndex("membership_subscription", "status");
  pgm.createIndex("membership_subscription", "membershipNumber", { unique: true, where: "membershipNumber IS NOT NULL" });
  pgm.createIndex("membership_subscription", "startDate");
  pgm.createIndex("membership_subscription", "endDate");
  pgm.createIndex("membership_subscription", "trialEndDate");
  pgm.createIndex("membership_subscription", "nextBillingDate");
  pgm.createIndex("membership_subscription", "isAutoRenew");
  pgm.createIndex("membership_subscription", "createdAt");

  // Create membership payment history table
  pgm.createTable("membership_payment", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscriptionId: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    amount: { type: "decimal(10,2)", notNull: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    paymentDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')" 
    },
    paymentType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "paymentType IN ('subscription', 'setup_fee', 'manual', 'refund')" 
    },
    paymentMethod: { type: "varchar(50)" }, // Credit card, PayPal, etc.
    transactionId: { type: "varchar(255)" }, // Payment processor transaction ID
    billingPeriodStart: { type: "timestamp" },
    billingPeriodEnd: { type: "timestamp" },
    metadata: { type: "jsonb" },
    notes: { type: "text" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership payments
  pgm.createIndex("membership_payment", "subscriptionId");
  pgm.createIndex("membership_payment", "customerId");
  pgm.createIndex("membership_payment", "paymentDate");
  pgm.createIndex("membership_payment", "status");
  pgm.createIndex("membership_payment", "paymentType");
  pgm.createIndex("membership_payment", "transactionId");
  pgm.createIndex("membership_payment", "billingPeriodStart");
  pgm.createIndex("membership_payment", "billingPeriodEnd");

  // Create membership group table (for family/group memberships)
  pgm.createTable("membership_group", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscriptionId: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    name: { type: "varchar(100)" },
    primaryMemberId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    maxMembers: { type: "integer", default: 5 },
    currentMembers: { type: "integer", notNull: true, default: 1 },
    isActive: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership groups
  pgm.createIndex("membership_group", "subscriptionId");
  pgm.createIndex("membership_group", "primaryMemberId");
  pgm.createIndex("membership_group", "isActive");

  // Create membership group member table
  pgm.createTable("membership_group_member", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    groupId: { type: "uuid", notNull: true, references: "membership_group", onDelete: "CASCADE" },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    isPrimary: { type: "boolean", notNull: true, default: false },
    membershipNumber: { type: "varchar(100)" }, // Unique membership identifier for this member
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'inactive', 'pending', 'removed')" 
    },
    joinedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expiresAt: { type: "timestamp" },
    invitationEmail: { type: "varchar(255)" },
    invitationStatus: { 
      type: "varchar(20)", 
      default: 'none',
      check: "invitationStatus IN ('none', 'sent', 'accepted', 'declined', 'expired')" 
    },
    invitationSentAt: { type: "timestamp" },
    invitationAcceptedAt: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership group members
  pgm.createIndex("membership_group_member", "groupId");
  pgm.createIndex("membership_group_member", "customerId");
  pgm.createIndex("membership_group_member", "isPrimary");
  pgm.createIndex("membership_group_member", "membershipNumber", { unique: true, where: "membershipNumber IS NOT NULL" });
  pgm.createIndex("membership_group_member", "status");
  pgm.createIndex("membership_group_member", "joinedAt");
  pgm.createIndex("membership_group_member", "expiresAt");
  pgm.createIndex("membership_group_member", "invitationEmail");
  pgm.createIndex("membership_group_member", "invitationStatus");
  pgm.createIndex("membership_group_member", ["groupId", "customerId"], { unique: true });

  // Create membership benefit usage table
  pgm.createTable("membership_benefit_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscriptionId: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    benefitId: { type: "uuid", notNull: true, references: "membership_benefit", onDelete: "CASCADE" },
    usageDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    usageValue: { type: "decimal(10,2)", notNull: true, default: 1 }, // Quantity/amount used
    usageType: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "usageType IN ('discount_applied', 'free_shipping', 'content_access', 'gift_redeemed', 'points_multiplier', 'early_access')" 
    },
    relatedEntityType: { type: "varchar(50)" }, // 'order', 'content', etc.
    relatedEntityId: { type: "uuid" }, // ID of related entity
    details: { type: "jsonb" }, // Usage details
    notes: { type: "text" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership benefit usage
  pgm.createIndex("membership_benefit_usage", "subscriptionId");
  pgm.createIndex("membership_benefit_usage", "customerId");
  pgm.createIndex("membership_benefit_usage", "benefitId");
  pgm.createIndex("membership_benefit_usage", "usageDate");
  pgm.createIndex("membership_benefit_usage", "usageType");
  pgm.createIndex("membership_benefit_usage", "relatedEntityType");
  pgm.createIndex("membership_benefit_usage", "relatedEntityId");

  // Create membership status log table (for tracking subscription status changes)
  pgm.createTable("membership_status_log", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    subscriptionId: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    previousStatus: { type: "varchar(20)" },
    newStatus: { type: "varchar(20)", notNull: true },
    changeReason: { type: "text" },
    changeSource: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'system',
      check: "changeSource IN ('system', 'admin', 'customer', 'payment', 'api')" 
    },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for membership status logs
  pgm.createIndex("membership_status_log", "subscriptionId");
  pgm.createIndex("membership_status_log", "previousStatus");
  pgm.createIndex("membership_status_log", "newStatus");
  pgm.createIndex("membership_status_log", "changeSource");
  pgm.createIndex("membership_status_log", "createdAt");

  // Create membership discount code table
  pgm.createTable("membership_discount_code", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    planId: { type: "uuid", notNull: true, references: "membership_plan", onDelete: "CASCADE" },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    discountType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "discountType IN ('percentage', 'fixed_amount', 'free_period')" 
    },
    discountValue: { type: "decimal(10,2)", notNull: true }, // Amount, percentage, or period
    validFrom: { type: "timestamp" },
    validTo: { type: "timestamp" },
    maxUses: { type: "integer" }, // Total number of allowed uses
    usesRemaining: { type: "integer" }, // Remaining uses
    usesPerCustomer: { type: "integer", default: 1 }, // Max uses per customer
    firstTimeOnly: { type: "boolean", notNull: true, default: false }, // Only for new members
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for membership discount codes
  pgm.createIndex("membership_discount_code", "planId");
  pgm.createIndex("membership_discount_code", "code");
  pgm.createIndex("membership_discount_code", "isActive");
  pgm.createIndex("membership_discount_code", "discountType");
  pgm.createIndex("membership_discount_code", "validFrom");
  pgm.createIndex("membership_discount_code", "validTo");
  pgm.createIndex("membership_discount_code", "firstTimeOnly");

  // Create membership discount code usage table
  pgm.createTable("membership_discount_code_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    discountCodeId: { type: "uuid", notNull: true, references: "membership_discount_code", onDelete: "CASCADE" },
    subscriptionId: { type: "uuid", notNull: true, references: "membership_subscription", onDelete: "CASCADE" },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    usedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    discountAmount: { type: "decimal(10,2)", notNull: true }, // Actual discount amount
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for membership discount code usage
  pgm.createIndex("membership_discount_code_usage", "discountCodeId");
  pgm.createIndex("membership_discount_code_usage", "subscriptionId");
  pgm.createIndex("membership_discount_code_usage", "customerId");
  pgm.createIndex("membership_discount_code_usage", "usedAt");
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
