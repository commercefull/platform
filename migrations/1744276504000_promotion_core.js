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
  // Create promotion status enum
  pgm.createType("promotion_status", [
    "active",
    "scheduled",
    "expired",
    "disabled",
    "pending_approval"
  ]);

  // Create discount type enum
  pgm.createType("discount_type", [
    "percentage",
    "fixed_amount",
    "buy_x_get_y",
    "fixed_price",
    "free_shipping",
    "free_item"
  ]);

  // Create promotion scope enum
  pgm.createType("promotion_scope", [
    "cart",
    "product",
    "category",
    "merchant",
    "shipping",
    "global"
  ]);

  // Create promotion rule operators enum
  pgm.createType("promotion_rule_operator", [
    "eq", // equal
    "neq", // not equal
    "gt", // greater than
    "lt", // less than
    "gte", // greater than or equal
    "lte", // less than or equal
    "in", // in array
    "nin", // not in array
    "contains", // contains string/item
    "not_contains", // does not contain string/item
    "starts_with", // starts with string
    "ends_with", // ends with string
    "between", // between two values
    "not_between" // not between two values
  ]);

  // Create promotion action type enum
  pgm.createType("promotion_action_type", [
    "percentage_discount",
    "fixed_amount_discount",
    "fixed_price",
    "buy_x_get_y_free",
    "buy_x_get_y_discount",
    "free_shipping",
    "free_item",
    "additional_points"
  ]);

  // Create promotion rule condition type enum
  pgm.createType("promotion_rule_condition", [
    "cart_subtotal",
    "cart_total",
    "cart_items_quantity",
    "cart_weight",
    "product_ids",
    "product_skus",
    "product_attributes",
    "category_ids",
    "brand_ids",
    "customer_group",
    "customer_tags",
    "customer_order_count",
    "customer_order_total",
    "shipping_country",
    "shipping_region",
    "shipping_method",
    "payment_method",
    "coupon_code",
    "date_range",
    "day_of_week",
    "time_of_day"
  ]);

  // Create base promotion table
  pgm.createTable("promotion", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    status: { type: "promotion_status", notNull: true, default: "active" },
    scope: { type: "promotion_scope", notNull: true },
    priority: { type: "integer", notNull: true, default: 0 }, // Higher number = higher priority
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" },
    isActive: { type: "boolean", notNull: true, default: true },
    isExclusive: { type: "boolean", notNull: true, default: false }, // If true, cannot be combined with other promotions
    maxUsage: { type: "integer" }, // Max number of times this promotion can be used in total
    usageCount: { type: "integer", notNull: true, default: 0 },
    maxUsagePerCustomer: { type: "integer" }, // Max usage per customer
    minOrderAmount: { type: "decimal(15,2)" }, // Minimum order amount to be eligible
    maxDiscountAmount: { type: "decimal(15,2)" }, // Cap on the maximum discount
    merchantId: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    isGlobal: { type: "boolean", notNull: true, default: false },
    eligibleCustomerGroups: { type: "jsonb" }, // Customer groups eligible for this promotion
    excludedCustomerGroups: { type: "jsonb" }, // Customer groups excluded from this promotion
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for promotions
  pgm.createIndex("promotion", "status");
  pgm.createIndex("promotion", "scope");
  pgm.createIndex("promotion", "startDate");
  pgm.createIndex("promotion", "endDate");
  pgm.createIndex("promotion", "isActive");
  pgm.createIndex("promotion", "isExclusive");
  pgm.createIndex("promotion", "priority");
  pgm.createIndex("promotion", "merchantId");
  pgm.createIndex("promotion", "isGlobal");

  // Create promotion rule table (conditions)
  pgm.createTable("promotion_rule", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    promotionId: { type: "uuid", notNull: true, references: "promotion", onDelete: "CASCADE" },
    name: { type: "varchar(255)" },
    description: { type: "text" },
    condition: { type: "promotion_rule_condition", notNull: true },
    operator: { type: "promotion_rule_operator", notNull: true },
    value: { type: "jsonb", notNull: true }, // The value to compare against
    isRequired: { type: "boolean", notNull: true, default: true }, // If false, rule is optional (OR logic)
    ruleGroup: { type: "varchar(100)", default: "default" }, // Group rules together for OR/AND logic
    sortOrder: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for promotion rules
  pgm.createIndex("promotion_rule", "promotionId");
  pgm.createIndex("promotion_rule", "condition");
  pgm.createIndex("promotion_rule", "operator");
  pgm.createIndex("promotion_rule", "ruleGroup");
  pgm.createIndex("promotion_rule", "isRequired");
  pgm.createIndex("promotion_rule", "sortOrder");

  // Create promotion action table (effects)
  pgm.createTable("promotion_action", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    promotionId: { type: "uuid", notNull: true, references: "promotion", onDelete: "CASCADE" },
    name: { type: "varchar(255)" },
    description: { type: "text" },
    actionType: { type: "promotion_action_type", notNull: true },
    value: { type: "jsonb", notNull: true }, // The discount value or action parameters
    targetType: { type: "varchar(100)" }, // What the action applies to (e.g., "product", "category", "cart")
    targetIds: { type: "jsonb" }, // IDs of specific targets (e.g., product IDs, category IDs)
    sortOrder: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for promotion actions
  pgm.createIndex("promotion_action", "promotionId");
  pgm.createIndex("promotion_action", "actionType");
  pgm.createIndex("promotion_action", "targetType");
  pgm.createIndex("promotion_action", "sortOrder");

  // Create promotion usage table
  pgm.createTable("promotion_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    promotionId: { type: "uuid", notNull: true, references: "promotion", onDelete: "CASCADE" },
    customerId: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    orderId: { type: "uuid", references: "order", onDelete: "SET NULL" },
    discountAmount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    usedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" }
  });

  // Create indexes for promotion usage
  pgm.createIndex("promotion_usage", "promotionId");
  pgm.createIndex("promotion_usage", "customerId");
  pgm.createIndex("promotion_usage", "orderId");
  pgm.createIndex("promotion_usage", "usedAt");

  // Insert some sample data
  pgm.sql(`
    -- Sample global promotion
    INSERT INTO promotion (
      name,
      description,
      status,
      scope,
      priority,
      startDate,
      endDate,
      isActive,
      isExclusive,
      maxUsage,
      maxUsagePerCustomer,
      minOrderAmount,
      maxDiscountAmount,
      isGlobal
    )
    VALUES (
      'Summer Sale 2025',
      'Get 15% off your entire order during our summer sale',
      'active',
      'cart',
      10,
      '2025-06-01 00:00:00',
      '2025-08-31 23:59:59',
      true,
      false,
      1000,
      1,
      50.00,
      200.00,
      true
    );
  `);

  // Insert sample rule for the promotion
  pgm.sql(`
    WITH summer_promo AS (SELECT id FROM promotion WHERE name = 'Summer Sale 2025')
    INSERT INTO promotion_rule (
      promotionId,
      name,
      condition,
      operator,
      value,
      isRequired
    )
    VALUES (
      (SELECT id FROM summer_promo),
      'Minimum Order Amount',
      'cart_subtotal',
      'gte',
      '{"amount": 50.00, "currency": "USD"}',
      true
    );
  `);

  // Insert sample action for the promotion
  pgm.sql(`
    WITH summer_promo AS (SELECT id FROM promotion WHERE name = 'Summer Sale 2025')
    INSERT INTO promotion_action (
      promotionId,
      name,
      actionType,
      value,
      targetType
    )
    VALUES (
      (SELECT id FROM summer_promo),
      '15% Off Entire Order',
      'percentage_discount',
      '{"percentage": 15}',
      'cart'
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable("promotion_usage");
  pgm.dropTable("promotion_action");
  pgm.dropTable("promotion_rule");
  pgm.dropTable("promotion");

  // Drop enum types
  pgm.dropType("promotion_rule_condition");
  pgm.dropType("promotion_action_type");
  pgm.dropType("promotion_rule_operator");
  pgm.dropType("promotion_scope");
  pgm.dropType("discount_type");
  pgm.dropType("promotion_status");
};
