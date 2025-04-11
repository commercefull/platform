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
  // Create coupon type enum
  pgm.createType("coupon_type", [
    "percentage",
    "fixed_amount",
    "free_shipping",
    "buy_x_get_y",
    "first_order",
    "gift_card"
  ]);

  // Create coupon generation method enum
  pgm.createType("coupon_generation_method", [
    "manual",
    "automatic",
    "pattern",
    "imported"
  ]);

  // Create coupon table
  pgm.createTable("coupon", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    code: { type: "varchar(100)", notNull: true, unique: true },
    promotion_id: { type: "uuid", references: "promotion", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    type: { type: "coupon_type", notNull: true },
    discount_amount: { type: "decimal(15,2)" }, // Percentage or fixed amount value
    currency_code: { type: "varchar(3)", default: "USD" },
    min_order_amount: { type: "decimal(15,2)" }, // Minimum order amount to apply coupon
    max_discount_amount: { type: "decimal(15,2)" }, // Maximum discount the coupon can give
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    end_date: { type: "timestamp" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_one_time_use: { type: "boolean", notNull: true, default: false }, // One-time use per customer
    max_usage: { type: "integer" }, // Total number of times the coupon can be used
    usage_count: { type: "integer", notNull: true, default: 0 },
    max_usage_per_customer: { type: "integer", default: 1 }, // Max usage per customer
    generation_method: { type: "coupon_generation_method", notNull: true, default: "manual" },
    is_referral: { type: "boolean", notNull: true, default: false }, // Indicates if this is a referral coupon
    referrer_id: { type: "uuid", references: "customer" }, // The customer who referred
    is_public: { type: "boolean", notNull: true, default: false }, // Whether this coupon is visible in public listings
    merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for coupons
  pgm.createIndex("coupon", "code");
  pgm.createIndex("coupon", "promotion_id");
  pgm.createIndex("coupon", "type");
  pgm.createIndex("coupon", "start_date");
  pgm.createIndex("coupon", "end_date");
  pgm.createIndex("coupon", "is_active");
  pgm.createIndex("coupon", "is_one_time_use");
  pgm.createIndex("coupon", "usage_count");
  pgm.createIndex("coupon", "generation_method");
  pgm.createIndex("coupon", "is_referral");
  pgm.createIndex("coupon", "referrer_id");
  pgm.createIndex("coupon", "is_public");
  pgm.createIndex("coupon", "merchant_id");

  // Create coupon usage table
  pgm.createTable("coupon_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    coupon_id: { type: "uuid", notNull: true, references: "coupon", onDelete: "CASCADE" },
    order_id: { type: "uuid", references: "order", onDelete: "SET NULL" },
    customer_id: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    discount_amount: { type: "decimal(15,2)", notNull: true },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    used_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" }
  });

  // Create indexes for coupon usage
  pgm.createIndex("coupon_usage", "coupon_id");
  pgm.createIndex("coupon_usage", "order_id");
  pgm.createIndex("coupon_usage", "customer_id");
  pgm.createIndex("coupon_usage", "used_at");
  pgm.createIndex("coupon_usage", ["coupon_id", "customer_id"], {
    where: "customer_id IS NOT NULL" 
  });

  // Create coupon restriction table
  pgm.createTable("coupon_restriction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    coupon_id: { type: "uuid", notNull: true, references: "coupon", onDelete: "CASCADE" },
    restriction_type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "restriction_type IN ('product_ids', 'category_ids', 'customer_groups', 'payment_methods', 'shipping_methods', 'countries', 'excluded_product_ids', 'excluded_category_ids', 'minimum_quantity', 'maximum_quantity')"
    },
    restriction_value: { type: "jsonb", notNull: true }, // Array of IDs or values
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for coupon restrictions
  pgm.createIndex("coupon_restriction", "coupon_id");
  pgm.createIndex("coupon_restriction", "restriction_type");

  // Create coupon code batch table (for bulk coupon generation)
  pgm.createTable("coupon_batch", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    prefix: { type: "varchar(50)" }, 
    suffix: { type: "varchar(50)" },
    code_pattern: { type: "varchar(100)" }, // Pattern for generated codes
    code_length: { type: "integer", notNull: true, default: 8 },
    quantity: { type: "integer", notNull: true, default: 1 },
    generated_count: { type: "integer", notNull: true, default: 0 },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('draft', 'pending', 'completed', 'failed', 'cancelled')",
      default: "'pending'"
    },
    expiry_date: { type: "timestamp" }, // Expiry date for all coupons in batch
    merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for coupon batches
  pgm.createIndex("coupon_batch", "status");
  pgm.createIndex("coupon_batch", "merchant_id");
  pgm.createIndex("coupon_batch", "expiry_date");
  pgm.createIndex("coupon_batch", "created_at");

  // Insert sample coupon
  pgm.sql(`
    WITH 
      summer_promo AS (SELECT id FROM promotion WHERE name = 'Summer Sale 2025'),
      sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO coupon (
      code,
      promotion_id,
      name,
      description,
      type,
      discount_amount,
      currency_code,
      min_order_amount,
      max_discount_amount,
      start_date,
      end_date,
      is_active,
      max_usage,
      max_usage_per_customer,
      is_public,
      merchant_id
    )
    VALUES (
      'SUMMER25',
      (SELECT id FROM summer_promo),
      'Summer 2025 Discount',
      '25% off your order with a minimum purchase of $100',
      'percentage',
      25.00,
      'USD',
      100.00,
      250.00,
      '2025-06-01 00:00:00',
      '2025-08-31 23:59:59',
      true,
      500,
      1,
      true,
      (SELECT id FROM sample_merchant)
    );
  `);

  // Add sample coupon restrictions
  pgm.sql(`
    WITH sample_coupon AS (SELECT id FROM coupon WHERE code = 'SUMMER25')
    INSERT INTO coupon_restriction (
      coupon_id,
      restriction_type,
      restriction_value
    )
    VALUES 
    (
      (SELECT id FROM sample_coupon),
      'minimum_quantity',
      '{"quantity": 2}'
    ),
    (
      (SELECT id FROM sample_coupon),
      'category_ids',
      '["summer-collection", "new-arrivals"]'
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
  pgm.dropTable("coupon_batch");
  pgm.dropTable("coupon_restriction");
  pgm.dropTable("coupon_usage");
  pgm.dropTable("coupon");

  // Drop enum types
  pgm.dropType("coupon_generation_method");
  pgm.dropType("coupon_type");
};
