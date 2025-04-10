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
  // Create product discount table
  pgm.createTable("product_discount", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    promotionId: { type: "uuid", references: "promotion", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    discountType: { type: "discount_type", notNull: true },
    discountValue: { type: "decimal(15,2)", notNull: true }, // Percentage or fixed amount
    currencyCode: { type: "varchar(3)", default: "USD" },
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" },
    isActive: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", notNull: true, default: 0 }, // Higher number = higher priority
    appliesTo: { 
      type: "varchar(50)", 
      notNull: true,
      check: "appliesTo IN ('specific_products', 'specific_categories', 'specific_brands', 'all_products')",
      default: "'specific_products'"
    },
    minimumQuantity: { type: "integer", default: 1 },
    maximumQuantity: { type: "integer" },
    minimumAmount: { type: "decimal(15,2)" },
    maximumDiscountAmount: { type: "decimal(15,2)" },
    stackable: { type: "boolean", notNull: true, default: false }, // Can be combined with other discounts
    displayOnProductPage: { type: "boolean", notNull: true, default: true },
    displayInListing: { type: "boolean", notNull: true, default: true },
    badgeText: { type: "varchar(100)" }, // Text to display on product (e.g., "Sale!")
    badgeStyle: { type: "jsonb" }, // Styling information for the badge
    merchantId: { type: "uuid", references: "merchant" }, // Owner merchant
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product discounts
  pgm.createIndex("product_discount", "promotionId");
  pgm.createIndex("product_discount", "discountType");
  pgm.createIndex("product_discount", "startDate");
  pgm.createIndex("product_discount", "endDate");
  pgm.createIndex("product_discount", "isActive");
  pgm.createIndex("product_discount", "priority");
  pgm.createIndex("product_discount", "appliesTo");
  pgm.createIndex("product_discount", "merchantId");
  pgm.createIndex("product_discount", "stackable");
  pgm.createIndex("product_discount", "displayOnProductPage");
  pgm.createIndex("product_discount", "displayInListing");

  // Create product discount items table (products this discount applies to)
  pgm.createTable("product_discount_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    discountId: { type: "uuid", notNull: true, references: "product_discount", onDelete: "CASCADE" },
    productId: { type: "uuid", references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    categoryId: { type: "uuid", references: "product_category", onDelete: "CASCADE" },
    brandId: { type: "uuid", references: "product_brand", onDelete: "CASCADE" },
    itemType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "itemType IN ('product', 'variant', 'category', 'brand')"
    },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product discount items
  pgm.createIndex("product_discount_item", "discountId");
  pgm.createIndex("product_discount_item", "productId");
  pgm.createIndex("product_discount_item", "variantId");
  pgm.createIndex("product_discount_item", "categoryId");
  pgm.createIndex("product_discount_item", "brandId");
  pgm.createIndex("product_discount_item", "itemType");
  pgm.createIndex("product_discount_item", ["discountId", "productId"], {
    where: "productId IS NOT NULL"
  });
  pgm.createIndex("product_discount_item", ["discountId", "variantId"], {
    where: "variantId IS NOT NULL"
  });
  pgm.createIndex("product_discount_item", ["discountId", "categoryId"], {
    where: "categoryId IS NOT NULL"
  });
  pgm.createIndex("product_discount_item", ["discountId", "brandId"], {
    where: "brandId IS NOT NULL"
  });

  // Create product discount customer groups table (customer groups this discount applies to)
  pgm.createTable("product_discount_customer_group", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    discountId: { type: "uuid", notNull: true, references: "product_discount", onDelete: "CASCADE" },
    customerGroupId: { type: "uuid", notNull: true }, // Reference to a customer group
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product discount customer groups
  pgm.createIndex("product_discount_customer_group", "discountId");
  pgm.createIndex("product_discount_customer_group", "customerGroupId");
  pgm.createIndex("product_discount_customer_group", ["discountId", "customerGroupId"], { unique: true });

  // Create buy x get y discount table (special type of discount)
  pgm.createTable("buy_x_get_y_discount", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    discountId: { type: "uuid", notNull: true, references: "product_discount", onDelete: "CASCADE", unique: true },
    buyQuantity: { type: "integer", notNull: true, default: 1 },
    getQuantity: { type: "integer", notNull: true, default: 1 },
    getType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "getType IN ('same_product', 'specific_product', 'cheapest', 'most_expensive', 'any')",
      default: "'same_product'"
    },
    getProductId: { type: "uuid", references: "product" }, // For specific product
    getVariantId: { type: "uuid", references: "productVariant" }, // For specific variant
    getCategoryId: { type: "uuid", references: "product_category" }, // For any product in category
    discountPercentage: { type: "decimal(5,2)", notNull: true, default: 100.00 }, // 100% = free
    maxFreeItems: { type: "integer" }, // Maximum number of free/discounted items
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for buy x get y discounts
  pgm.createIndex("buy_x_get_y_discount", "discountId");
  pgm.createIndex("buy_x_get_y_discount", "getType");
  pgm.createIndex("buy_x_get_y_discount", "getProductId");
  pgm.createIndex("buy_x_get_y_discount", "getVariantId");
  pgm.createIndex("buy_x_get_y_discount", "getCategoryId");

  // Create tiered pricing table (quantity breaks)
  pgm.createTable("product_tiered_price", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    customerGroupId: { type: "uuid" }, // Can be specific to a customer group
    quantityMin: { type: "integer", notNull: true },
    quantityMax: { type: "integer" },
    price: { type: "decimal(15,2)", notNull: true },
    discountPercentage: { type: "decimal(5,2)" }, // For display purposes
    discountType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "discountType IN ('fixed_price', 'percentage', 'fixed_amount')",
      default: "'fixed_price'"
    },
    discountValue: { type: "decimal(15,2)" }, // Original amount or percentage off
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" },
    isActive: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", notNull: true, default: 0 },
    merchantId: { type: "uuid", references: "merchant" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for tiered pricing
  pgm.createIndex("product_tiered_price", "productId");
  pgm.createIndex("product_tiered_price", "variantId");
  pgm.createIndex("product_tiered_price", "customerGroupId");
  pgm.createIndex("product_tiered_price", "quantityMin");
  pgm.createIndex("product_tiered_price", "quantityMax");
  pgm.createIndex("product_tiered_price", "discountType");
  pgm.createIndex("product_tiered_price", "startDate");
  pgm.createIndex("product_tiered_price", "endDate");
  pgm.createIndex("product_tiered_price", "isActive");
  pgm.createIndex("product_tiered_price", "merchantId");
  pgm.createIndex("product_tiered_price", ["productId", "variantId", "customerGroupId", "quantityMin"], {
    where: "variantId IS NOT NULL AND customerGroupId IS NOT NULL"
  });
  pgm.createIndex("product_tiered_price", ["productId", "customerGroupId", "quantityMin"], {
    where: "variantId IS NULL AND customerGroupId IS NOT NULL"
  });
  pgm.createIndex("product_tiered_price", ["productId", "variantId", "quantityMin"], {
    where: "variantId IS NOT NULL AND customerGroupId IS NULL"
  });
  pgm.createIndex("product_tiered_price", ["productId", "quantityMin"], {
    where: "variantId IS NULL AND customerGroupId IS NULL"
  });

  // Insert sample product discount
  pgm.sql(`
    -- First, ensure we have the sample product to apply discount to
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1) THEN
        -- Create sample product discount
        WITH 
          sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
          summer_promo AS (SELECT id FROM promotion WHERE name = 'Summer Sale 2025'),
          sample_merchant AS (SELECT id FROM merchant LIMIT 1)
        INSERT INTO product_discount (
          promotionId,
          name,
          description,
          discountType,
          discountValue,
          startDate,
          endDate,
          isActive,
          priority,
          appliesTo,
          displayOnProductPage,
          displayInListing,
          badgeText,
          badgeStyle,
          merchantId
        )
        VALUES (
          (SELECT id FROM summer_promo),
          'Premium Headphones Sale',
          'Special discount on our premium headphones line',
          'percentage',
          20.00, -- 20% off
          '2025-06-01 00:00:00',
          '2025-08-31 23:59:59',
          true,
          10,
          'specific_products',
          true,
          true,
          'SAVE 20%',
          '{"backgroundColor": "#FF0000", "textColor": "#FFFFFF", "borderRadius": "4px"}',
          (SELECT id FROM sample_merchant)
        )
        RETURNING id, name INTO TEMP product_discount_record;
        
        -- Add the product to the discount
        INSERT INTO product_discount_item (
          discountId,
          productId,
          itemType
        )
        VALUES (
          (SELECT id FROM product_discount_record),
          (SELECT id FROM sample_product),
          'product'
        );
      END IF;
    END
    $$;
  `);

  // Insert sample tiered pricing
  pgm.sql(`
    -- First, ensure we have the sample product to apply tiered pricing to
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1) THEN
        -- Create sample tiered pricing
        WITH 
          sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
          sample_merchant AS (SELECT id FROM merchant LIMIT 1)
        INSERT INTO product_tiered_price (
          productId,
          quantityMin,
          quantityMax,
          price,
          discountPercentage,
          discountType,
          discountValue,
          isActive,
          merchantId
        )
        VALUES 
        (
          (SELECT id FROM sample_product),
          3,
          9,
          89.99,
          10.00, -- 10% off
          'percentage',
          10.00,
          true,
          (SELECT id FROM sample_merchant)
        ),
        (
          (SELECT id FROM sample_product),
          10,
          null,
          79.99,
          20.00, -- 20% off
          'percentage',
          20.00,
          true,
          (SELECT id FROM sample_merchant)
        );
      END IF;
    END
    $$;
  `);

  // Insert sample buy x get y discount
  pgm.sql(`
    -- First, check if we already have a sample discount to work with
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM product_discount WHERE name = 'Premium Headphones Sale' LIMIT 1) THEN
        -- Create buy one get one 50% off deal
        WITH discount_record AS (
          SELECT id FROM product_discount WHERE name = 'Premium Headphones Sale' LIMIT 1
        )
        INSERT INTO buy_x_get_y_discount (
          discountId,
          buyQuantity,
          getQuantity,
          getType,
          discountPercentage,
          maxFreeItems
        )
        VALUES (
          (SELECT id FROM discount_record),
          1,
          1,
          'same_product',
          50.00, -- 50% off the second item
          1 -- Max 1 discounted item
        );
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
  pgm.dropTable("product_tiered_price");
  pgm.dropTable("buy_x_get_y_discount");
  pgm.dropTable("product_discount_customer_group");
  pgm.dropTable("product_discount_item");
  pgm.dropTable("product_discount");
};
