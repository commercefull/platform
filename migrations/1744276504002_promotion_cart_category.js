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
  // Create cart promotion table
  pgm.createTable("cart_promotion", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    cartId: { type: "uuid", notNull: true, references: "basket", onDelete: "CASCADE" },
    promotionId: { type: "uuid", notNull: true, references: "promotion", onDelete: "CASCADE" },
    couponId: { type: "uuid", references: "coupon", onDelete: "SET NULL" },
    couponCode: { type: "varchar(100)" },
    discountAmount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    isAutoApplied: { type: "boolean", notNull: true, default: false },
    isCustomerInitiated: { type: "boolean", notNull: true, default: true },
    appliedBy: { type: "uuid" }, // Reference to user who applied it (if admin)
    appliedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    status: { 
      type: "varchar(50)", 
      notNull: true,
      check: "status IN ('active', 'removed', 'expired', 'invalid')",
      default: "'active'"
    },
    validUntil: { type: "timestamp" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for cart promotions
  pgm.createIndex("cart_promotion", "cartId");
  pgm.createIndex("cart_promotion", "promotionId");
  pgm.createIndex("cart_promotion", "couponId");
  pgm.createIndex("cart_promotion", "couponCode");
  pgm.createIndex("cart_promotion", "isAutoApplied");
  pgm.createIndex("cart_promotion", "isCustomerInitiated");
  pgm.createIndex("cart_promotion", "appliedBy");
  pgm.createIndex("cart_promotion", "status");
  pgm.createIndex("cart_promotion", "validUntil");
  pgm.createIndex("cart_promotion", "createdAt");

  // Create cart promotion item table (for promotions applied to specific items)
  pgm.createTable("cart_promotion_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    cartPromotionId: { type: "uuid", notNull: true, references: "cart_promotion", onDelete: "CASCADE" },
    cartItemId: { type: "uuid", notNull: true, references: "basket_item", onDelete: "CASCADE" },
    discountAmount: { type: "decimal(15,2)", notNull: true },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    discountPercentage: { type: "decimal(5,2)" },
    originalPrice: { type: "decimal(15,2)", notNull: true },
    finalPrice: { type: "decimal(15,2)", notNull: true },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for cart promotion items
  pgm.createIndex("cart_promotion_item", "cartPromotionId");
  pgm.createIndex("cart_promotion_item", "cartItemId");
  pgm.createIndex("cart_promotion_item", ["cartPromotionId", "cartItemId"], { unique: true });

  // Create category promotion table
  pgm.createTable("category_promotion", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    categoryId: { type: "uuid", notNull: true, references: "product_category", onDelete: "CASCADE" },
    promotionId: { type: "uuid", notNull: true, references: "promotion", onDelete: "CASCADE" },
    displayOrder: { type: "integer", notNull: true, default: 0 },
    bannerText: { type: "varchar(255)" },
    bannerColor: { type: "varchar(50)" },
    bannerBackgroundColor: { type: "varchar(50)" },
    bannerImageUrl: { type: "text" },
    isDisplayedOnCategoryPage: { type: "boolean", notNull: true, default: true },
    isDisplayedOnProductPage: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for category promotions
  pgm.createIndex("category_promotion", "categoryId");
  pgm.createIndex("category_promotion", "promotionId");
  pgm.createIndex("category_promotion", "displayOrder");
  pgm.createIndex("category_promotion", "isDisplayedOnCategoryPage");
  pgm.createIndex("category_promotion", "isDisplayedOnProductPage");
  pgm.createIndex("category_promotion", ["categoryId", "promotionId"], { unique: true });

  // Create category promotion product table (for specific products in category)
  pgm.createTable("category_promotion_product", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    categoryPromotionId: { type: "uuid", notNull: true, references: "category_promotion", onDelete: "CASCADE" },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    isFeatured: { type: "boolean", notNull: true, default: false },
    displayOrder: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for category promotion products
  pgm.createIndex("category_promotion_product", "categoryPromotionId");
  pgm.createIndex("category_promotion_product", "productId");
  pgm.createIndex("category_promotion_product", "isFeatured");
  pgm.createIndex("category_promotion_product", "displayOrder");
  pgm.createIndex("category_promotion_product", ["categoryPromotionId", "productId"], { unique: true });

  // Insert sample category promotion
  pgm.sql(`
    -- First, ensure we have a sample category to work with
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM product_category WHERE slug = 'electronics' LIMIT 1) THEN
        -- Create sample promotion for electronics category
        WITH 
          elec_category AS (SELECT id FROM product_category WHERE slug = 'electronics' LIMIT 1),
          summer_promo AS (SELECT id FROM promotion WHERE name = 'Summer Sale 2025')
        INSERT INTO category_promotion (
          categoryId,
          promotionId,
          bannerText,
          bannerColor,
          bannerBackgroundColor,
          isDisplayedOnCategoryPage,
          isDisplayedOnProductPage
        )
        SELECT
          elec_category.id,
          summer_promo.id,
          'Summer Electronics Sale - 15% OFF!',
          '#FFFFFF',
          '#FF6600',
          true,
          true
        FROM elec_category, summer_promo;
      END IF;
    END
    $$;
  `);

  // Insert sample cart promotion
  pgm.sql(`
    -- First, ensure we have a sample cart/basket to work with
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM basket LIMIT 1) THEN
        -- Create sample cart promotion
        WITH 
          sample_basket AS (SELECT id FROM basket LIMIT 1),
          summer_promo AS (SELECT id FROM promotion WHERE name = 'Summer Sale 2025'),
          summer_coupon AS (SELECT id, code FROM coupon WHERE code = 'SUMMER25')
        INSERT INTO cart_promotion (
          cartId,
          promotionId,
          couponId,
          couponCode,
          discountAmount,
          isAutoApplied,
          isCustomerInitiated,
          status
        )
        SELECT
          sample_basket.id,
          summer_promo.id,
          summer_coupon.id,
          summer_coupon.code,
          25.00,
          false,
          true,
          'active'
        FROM sample_basket, summer_promo, summer_coupon;
      END IF;
    END
    $$;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable("category_promotion_product");
  pgm.dropTable("category_promotion");
  pgm.dropTable("cart_promotion_item");
  pgm.dropTable("cart_promotion");
};
