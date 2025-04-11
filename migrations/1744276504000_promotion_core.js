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
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    end_date: { type: "timestamp" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_exclusive: { type: "boolean", notNull: true, default: false }, // If true, cannot be combined with other promotions
    max_usage: { type: "integer" }, // Max number of times this promotion can be used in total
    usage_count: { type: "integer", notNull: true, default: 0 },
    max_usage_per_customer: { type: "integer" }, // Max usage per customer
    min_order_amount: { type: "decimal(15,2)" }, // Minimum order amount to be eligible
    max_discount_amount: { type: "decimal(15,2)" }, // Cap on the maximum discount
    merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    is_global: { type: "boolean", notNull: true, default: false },
    eligible_customer_groups: { type: "jsonb" }, // Customer groups eligible for this promotion
    excluded_customer_groups: { type: "jsonb" }, // Customer groups excluded from this promotion
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for promotions
  pgm.createIndex("promotion", "status");
  pgm.createIndex("promotion", "scope");
  pgm.createIndex("promotion", "start_date");
  pgm.createIndex("promotion", "end_date");
  pgm.createIndex("promotion", "is_active");
  pgm.createIndex("promotion", "is_exclusive");
  pgm.createIndex("promotion", "priority");
  pgm.createIndex("promotion", "merchant_id");
  pgm.createIndex("promotion", "is_global");

  // Create promotion rule table (conditions)
  pgm.createTable("promotion_rule", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    promotion_id: { type: "uuid", notNull: true, references: "promotion", onDelete: "CASCADE" },
    name: { type: "varchar(255)" },
    description: { type: "text" },
    condition: { type: "promotion_rule_condition", notNull: true },
    operator: { type: "promotion_rule_operator", notNull: true },
    value: { type: "jsonb", notNull: true }, // The value to compare against
    is_required: { type: "boolean", notNull: true, default: true }, // If false, rule is optional (OR logic)
    rule_group: { type: "varchar(100)", default: "default" }, // Group rules together for OR/AND logic
    sort_order: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for promotion rules
  pgm.createIndex("promotion_rule", "promotion_id");
  pgm.createIndex("promotion_rule", "condition");
  pgm.createIndex("promotion_rule", "operator");
  pgm.createIndex("promotion_rule", "rule_group");
  pgm.createIndex("promotion_rule", "is_required");
  pgm.createIndex("promotion_rule", "sort_order");

  // Create promotion action table (effects)
  pgm.createTable("promotion_action", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    promotion_id: { type: "uuid", notNull: true, references: "promotion", onDelete: "CASCADE" },
    name: { type: "varchar(255)" },
    description: { type: "text" },
    action_type: { type: "promotion_action_type", notNull: true },
    value: { type: "jsonb", notNull: true }, // The discount value or action parameters
    target_type: { type: "varchar(100)" }, // What the action applies to (e.g., "product", "category", "cart")
    target_ids: { type: "jsonb" }, // IDs of specific targets (e.g., product IDs, category IDs)
    sort_order: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for promotion actions
  pgm.createIndex("promotion_action", "promotion_id");
  pgm.createIndex("promotion_action", "action_type");
  pgm.createIndex("promotion_action", "target_type");
  pgm.createIndex("promotion_action", "sort_order");

  // Create promotion usage table
  pgm.createTable("promotion_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    promotion_id: { type: "uuid", notNull: true, references: "promotion", onDelete: "CASCADE" },
    customer_id: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    order_id: { type: "uuid", references: "order", onDelete: "SET NULL" },
    discount_amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    used_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" }
  });

  // Create indexes for promotion usage
  pgm.createIndex("promotion_usage", "promotion_id");
  pgm.createIndex("promotion_usage", "customer_id");
  pgm.createIndex("promotion_usage", "order_id");
  pgm.createIndex("promotion_usage", "used_at");

  // Insert some sample data
  pgm.sql(`
    -- Sample global promotion
    INSERT INTO promotion (
      name,
      description,
      status,
      scope,
      priority,
      start_date,
      end_date,
      is_active,
      is_exclusive,
      max_usage,
      max_usage_per_customer,
      max_discount_amount,
      is_global
    )
    VALUES 
    (
      '10% Off Sitewide',
      'Get 10% off your entire purchase',
      'active',
      'cart',
      100,
      current_timestamp,
      current_timestamp + interval '30 days',
      true,
      false,
      1000,
      1,
      250.00,
      true
    ),
    (
      'Summer Sale',
      '15% off all summer items',
      'active',
      'category',
      90,
      current_timestamp,
      current_timestamp + interval '60 days',
      true,
      false,
      NULL,
      NULL,
      NULL,
      true
    ),
    (
      'First Order Discount',
      'Get $10 off your first order',
      'active',
      'cart',
      80,
      current_timestamp,
      NULL,
      true,
      false,
      NULL,
      1,
      10.00,
      true
    );

    -- Add sample promotion rules
    WITH 
      promo1 AS (SELECT id FROM promotion WHERE name = '10% Off Sitewide' LIMIT 1),
      promo2 AS (SELECT id FROM promotion WHERE name = 'Summer Sale' LIMIT 1),
      promo3 AS (SELECT id FROM promotion WHERE name = 'First Order Discount' LIMIT 1)
    INSERT INTO promotion_rule (
      promotion_id,
      name,
      condition,
      operator,
      value,
      is_required
    )
    SELECT
      promo1.id,
      'Minimum Order Amount',
      'cart_subtotal',
      'gte',
      '{"amount": 50.00}',
      true
    FROM promo1
    UNION ALL
    SELECT
      promo2.id,
      'Summer Category',
      'category_ids',
      'in',
      '{"ids": ["summer-collection"]}',
      true
    FROM promo2
    UNION ALL
    SELECT
      promo3.id,
      'First Order',
      'customer_order_count',
      'eq',
      '{"count": 0}',
      true
    FROM promo3;

    -- Add promotion actions
    WITH 
      promo1 AS (SELECT id FROM promotion WHERE name = '10% Off Sitewide' LIMIT 1),
      promo2 AS (SELECT id FROM promotion WHERE name = 'Summer Sale' LIMIT 1),
      promo3 AS (SELECT id FROM promotion WHERE name = 'First Order Discount' LIMIT 1)
    INSERT INTO promotion_action (
      promotion_id,
      name,
      action_type,
      value,
      target_type
    )
    SELECT
      promo1.id,
      '10% Cart Discount',
      'percentage_discount',
      '{"percentage": 10}',
      'cart'
    FROM promo1
    UNION ALL
    SELECT
      promo2.id,
      '15% Category Discount',
      'percentage_discount',
      '{"percentage": 15}',
      'category'
    FROM promo2
    UNION ALL
    SELECT
      promo3.id,
      '$10 Fixed Discount',
      'fixed_amount_discount',
      '{"amount": 10.00}',
      'cart'
    FROM promo3;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("promotion_usage");
  pgm.dropTable("promotion_action");
  pgm.dropTable("promotion_rule");
  pgm.dropTable("promotion");
  pgm.dropType("promotion_rule_condition");
  pgm.dropType("promotion_action_type");
  pgm.dropType("promotion_rule_operator");
  pgm.dropType("promotion_scope");
  pgm.dropType("discount_type");
  pgm.dropType("promotion_status");
};
