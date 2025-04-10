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
    promotionId: { type: "uuid", references: "promotion", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    type: { type: "coupon_type", notNull: true },
    discountAmount: { type: "decimal(15,2)" }, // Percentage or fixed amount value
    currencyCode: { type: "varchar(3)", default: "USD" },
    minOrderAmount: { type: "decimal(15,2)" }, // Minimum order amount to apply coupon
    maxDiscountAmount: { type: "decimal(15,2)" }, // Maximum discount the coupon can give
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" },
    isActive: { type: "boolean", notNull: true, default: true },
    isOneTimeUse: { type: "boolean", notNull: true, default: false }, // One-time use per customer
    maxUsage: { type: "integer" }, // Total number of times the coupon can be used
    usageCount: { type: "integer", notNull: true, default: 0 },
    maxUsagePerCustomer: { type: "integer", default: 1 }, // Max usage per customer
    generationMethod: { type: "coupon_generation_method", notNull: true, default: "manual" },
    isReferral: { type: "boolean", notNull: true, default: false }, // Indicates if this is a referral coupon
    referrerId: { type: "uuid", references: "customer" }, // The customer who referred
    isPublic: { type: "boolean", notNull: true, default: false }, // Whether this coupon is visible in public listings
    merchantId: { type: "uuid", references: "merchant" }, // Owner merchant
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for coupons
  pgm.createIndex("coupon", "code");
  pgm.createIndex("coupon", "promotionId");
  pgm.createIndex("coupon", "type");
  pgm.createIndex("coupon", "startDate");
  pgm.createIndex("coupon", "endDate");
  pgm.createIndex("coupon", "isActive");
  pgm.createIndex("coupon", "isOneTimeUse");
  pgm.createIndex("coupon", "usageCount");
  pgm.createIndex("coupon", "generationMethod");
  pgm.createIndex("coupon", "isReferral");
  pgm.createIndex("coupon", "referrerId");
  pgm.createIndex("coupon", "isPublic");
  pgm.createIndex("coupon", "merchantId");

  // Create coupon usage table
  pgm.createTable("coupon_usage", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    couponId: { type: "uuid", notNull: true, references: "coupon", onDelete: "CASCADE" },
    orderId: { type: "uuid", references: "order", onDelete: "SET NULL" },
    customerId: { type: "uuid", references: "customer", onDelete: "SET NULL" },
    discountAmount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    usedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" }
  });

  // Create indexes for coupon usage
  pgm.createIndex("coupon_usage", "couponId");
  pgm.createIndex("coupon_usage", "orderId");
  pgm.createIndex("coupon_usage", "customerId");
  pgm.createIndex("coupon_usage", "usedAt");
  pgm.createIndex("coupon_usage", ["couponId", "customerId"], {
    where: "customerId IS NOT NULL" 
  });

  // Create coupon restriction table
  pgm.createTable("coupon_restriction", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    couponId: { type: "uuid", notNull: true, references: "coupon", onDelete: "CASCADE" },
    restrictionType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "restrictionType IN ('product_ids', 'category_ids', 'customer_groups', 'payment_methods', 'shipping_methods', 'countries', 'excluded_product_ids', 'excluded_category_ids', 'minimum_quantity', 'maximum_quantity')"
    },
    restrictionValue: { type: "jsonb", notNull: true }, // Array of IDs or values
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for coupon restrictions
  pgm.createIndex("coupon_restriction", "couponId");
  pgm.createIndex("coupon_restriction", "restrictionType");

  // Create coupon code batch table (for bulk coupon generation)
  pgm.createTable("coupon_batch", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    prefix: { type: "varchar(50)" }, 
    suffix: { type: "varchar(50)" },
    codePattern: { type: "varchar(100)" }, // Pattern for generated codes
    codeLength: { type: "integer", notNull: true, default: 8 },
    quantity: { type: "integer", notNull: true, default: 1 },
    generatedCount: { type: "integer", notNull: true, default: 0 },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('draft', 'pending', 'completed', 'failed', 'cancelled')",
      default: "'pending'"
    },
    expiryDate: { type: "timestamp" }, // Expiry date for all coupons in batch
    merchantId: { type: "uuid", references: "merchant" }, // Owner merchant
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for coupon batches
  pgm.createIndex("coupon_batch", "status");
  pgm.createIndex("coupon_batch", "merchantId");
  pgm.createIndex("coupon_batch", "expiryDate");
  pgm.createIndex("coupon_batch", "createdAt");

  // Insert sample coupon
  pgm.sql(`
    WITH 
      summer_promo AS (SELECT id FROM promotion WHERE name = 'Summer Sale 2025'),
      sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO coupon (
      code,
      promotionId,
      name,
      description,
      type,
      discountAmount,
      currencyCode,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      isActive,
      maxUsage,
      maxUsagePerCustomer,
      isPublic,
      merchantId
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
      couponId,
      restrictionType,
      restrictionValue
    )
    VALUES 
    (
      (SELECT id FROM sample_coupon),
      'minimum_quantity',
      '{"quantity": 2}'
    ),
    (
      (SELECT id FROM sample_coupon),
      'customer_groups',
      '{"groups": ["regular", "vip"]}'
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
