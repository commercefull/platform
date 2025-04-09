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
  // Create merchant store table
  pgm.createTable("merchant_store", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(150)", notNull: true, unique: true },
    description: { type: "text" },
    shortDescription: { type: "varchar(255)" },
    logo: { type: "text" },
    banner: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    isVerified: { type: "boolean", notNull: true, default: false },
    isFeatured: { type: "boolean", notNull: true, default: false },
    storeUrl: { type: "varchar(255)" }, // Custom domain
    storeEmail: { type: "varchar(255)" },
    storePhone: { type: "varchar(30)" },
    theme: { type: "varchar(50)", default: 'default' },
    colorScheme: { type: "jsonb" },
    metaTitle: { type: "varchar(255)" },
    metaDescription: { type: "text" },
    metaKeywords: { type: "text" },
    openingHours: { type: "jsonb" }, // Store hours
    socialLinks: { type: "jsonb" }, // Social media profiles
    storePolicies: { type: "jsonb" }, // Return, shipping, etc. policies
    shippingMethods: { type: "jsonb" }, // Available shipping methods
    paymentMethods: { type: "jsonb" }, // Accepted payment methods
    storeRating: { type: "decimal(3,2)" }, // Average rating
    reviewCount: { type: "integer", default: 0 },
    followerCount: { type: "integer", default: 0 },
    productCount: { type: "integer", default: 0 },
    orderCount: { type: "integer", default: 0 },
    featuredProducts: { type: "uuid[]" }, // Featured product IDs
    storeCategories: { type: "jsonb" }, // Store-specific categories
    customPages: { type: "jsonb" }, // Custom store pages
    customFields: { type: "jsonb" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant stores
  pgm.createIndex("merchant_store", "merchantId", { unique: true });
  pgm.createIndex("merchant_store", "name");
  pgm.createIndex("merchant_store", "slug");
  pgm.createIndex("merchant_store", "isActive");
  pgm.createIndex("merchant_store", "isVerified");
  pgm.createIndex("merchant_store", "isFeatured");
  pgm.createIndex("merchant_store", "storeRating");
  pgm.createIndex("merchant_store", "followerCount");
  pgm.createIndex("merchant_store", "productCount");
  pgm.createIndex("merchant_store", "orderCount");
  pgm.createIndex("merchant_store", "featuredProducts", { method: "gin" });

  // Create merchant product table
  pgm.createTable("merchant_product", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    isActive: { type: "boolean", notNull: true, default: true },
    isApproved: { type: "boolean", notNull: true, default: false },
    approvedAt: { type: "timestamp" },
    approvedBy: { type: "uuid" },
    approvalNotes: { type: "text" },
    isFeatured: { type: "boolean", notNull: true, default: false },
    featuredFrom: { type: "timestamp" },
    featuredTo: { type: "timestamp" },
    merchantSku: { type: "varchar(100)" }, // Merchant's own SKU
    merchantPrice: { type: "decimal(15,2)" }, // Merchant's selling price
    merchantCost: { type: "decimal(15,2)" }, // Merchant's cost
    merchantStock: { type: "integer" }, // Merchant's stock level
    commissionRate: { type: "decimal(5,2)" }, // Override commission for this product
    shippingTemplate: { type: "varchar(50)" }, // Merchant shipping template
    handlingTime: { type: "integer" }, // Processing time in days
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant products
  pgm.createIndex("merchant_product", "merchantId");
  pgm.createIndex("merchant_product", "productId");
  pgm.createIndex("merchant_product", "isActive");
  pgm.createIndex("merchant_product", "isApproved");
  pgm.createIndex("merchant_product", "isFeatured");
  pgm.createIndex("merchant_product", "merchantSku");
  pgm.createIndex("merchant_product", "merchantPrice");
  pgm.createIndex("merchant_product", "merchantStock");
  pgm.createIndex("merchant_product", "commissionRate");
  pgm.createIndex("merchant_product", "handlingTime");
  pgm.createIndex("merchant_product", ["merchantId", "productId"], { unique: true });

  // Create merchant product variant mapping
  pgm.createTable("merchant_product_variant", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantProductId: { type: "uuid", notNull: true, references: "merchant_product", onDelete: "CASCADE" },
    variantId: { type: "uuid", notNull: true, references: "product_variant", onDelete: "CASCADE" },
    isActive: { type: "boolean", notNull: true, default: true },
    merchantSku: { type: "varchar(100)" }, // Merchant's own SKU for variant
    merchantPrice: { type: "decimal(15,2)" }, // Merchant's selling price for variant
    merchantCost: { type: "decimal(15,2)" }, // Merchant's cost for variant
    merchantStock: { type: "integer" }, // Merchant's stock level for variant
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant product variants
  pgm.createIndex("merchant_product_variant", "merchantProductId");
  pgm.createIndex("merchant_product_variant", "variantId");
  pgm.createIndex("merchant_product_variant", "isActive");
  pgm.createIndex("merchant_product_variant", "merchantSku");
  pgm.createIndex("merchant_product_variant", "merchantPrice");
  pgm.createIndex("merchant_product_variant", "merchantStock");
  pgm.createIndex("merchant_product_variant", ["merchantProductId", "variantId"], { unique: true });

  // Create merchant order table
  pgm.createTable("merchant_order", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    orderItemIds: { type: "uuid[]", notNull: true }, // IDs of order items for this merchant
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed')" 
    },
    subtotal: { type: "decimal(15,2)", notNull: true },
    shipping: { type: "decimal(15,2)", notNull: true, default: 0 },
    tax: { type: "decimal(15,2)", notNull: true, default: 0 },
    discount: { type: "decimal(15,2)", notNull: true, default: 0 },
    total: { type: "decimal(15,2)", notNull: true },
    commissionAmount: { type: "decimal(15,2)", notNull: true },
    payoutAmount: { type: "decimal(15,2)", notNull: true }, // Total - commission
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    shippingAddress: { type: "jsonb" },
    billingAddress: { type: "jsonb" },
    shippingMethod: { type: "varchar(100)" },
    trackingNumber: { type: "varchar(100)" },
    trackingUrl: { type: "varchar(255)" },
    carrierName: { type: "varchar(100)" },
    customerNotes: { type: "text" },
    merchantNotes: { type: "text" },
    adminNotes: { type: "text" },
    isPayoutProcessed: { type: "boolean", notNull: true, default: false },
    payoutDate: { type: "timestamp" },
    payoutTransactionId: { type: "varchar(100)" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant orders
  pgm.createIndex("merchant_order", "merchantId");
  pgm.createIndex("merchant_order", "orderId");
  pgm.createIndex("merchant_order", "orderItemIds", { method: "gin" });
  pgm.createIndex("merchant_order", "status");
  pgm.createIndex("merchant_order", "total");
  pgm.createIndex("merchant_order", "commissionAmount");
  pgm.createIndex("merchant_order", "payoutAmount");
  pgm.createIndex("merchant_order", "currency");
  pgm.createIndex("merchant_order", "trackingNumber");
  pgm.createIndex("merchant_order", "isPayoutProcessed");
  pgm.createIndex("merchant_order", "payoutDate");
  pgm.createIndex("merchant_order", "payoutTransactionId");
  pgm.createIndex("merchant_order", "createdAt");
  pgm.createIndex("merchant_order", ["merchantId", "orderId"], { unique: true });

  // Create merchant shipping template table
  pgm.createTable("merchant_shipping_template", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    isDefault: { type: "boolean", notNull: true, default: false },
    isActive: { type: "boolean", notNull: true, default: true },
    flatRate: { type: "decimal(10,2)" }, // Flat shipping rate
    freeShippingThreshold: { type: "decimal(10,2)" }, // Order amount for free shipping
    processingTime: { type: "integer", default: 1 }, // Days to process order
    rulesType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'flat',
      check: "rulesType IN ('flat', 'weight', 'price', 'distance', 'item', 'complex')" 
    },
    rules: { type: "jsonb" }, // Shipping rules
    shippingDestinations: { type: "jsonb" }, // Where merchant ships to
    restrictedDestinations: { type: "jsonb" }, // Where merchant doesn't ship
    supportedCarriers: { type: "jsonb" }, // Carriers merchant uses
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant shipping templates
  pgm.createIndex("merchant_shipping_template", "merchantId");
  pgm.createIndex("merchant_shipping_template", "isDefault");
  pgm.createIndex("merchant_shipping_template", "isActive");
  pgm.createIndex("merchant_shipping_template", "flatRate");
  pgm.createIndex("merchant_shipping_template", "freeShippingThreshold");
  pgm.createIndex("merchant_shipping_template", "rulesType");
  pgm.createIndex("merchant_shipping_template", ["merchantId", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Create merchant follower table
  pgm.createTable("merchant_follower", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    followedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    emailNotifications: { type: "boolean", notNull: true, default: true },
    pushNotifications: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" }
  });

  // Create indexes for merchant followers
  pgm.createIndex("merchant_follower", "merchantId");
  pgm.createIndex("merchant_follower", "customerId");
  pgm.createIndex("merchant_follower", "followedAt");
  pgm.createIndex("merchant_follower", ["merchantId", "customerId"], { unique: true });

  // Create merchant review table
  pgm.createTable("merchant_review", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    orderId: { type: "uuid", references: "order" }, // Optional reference to order
    rating: { type: "integer", notNull: true, check: "rating BETWEEN 1 AND 5" },
    title: { type: "varchar(255)" },
    content: { type: "text" },
    isVerifiedPurchase: { type: "boolean", notNull: true, default: false },
    isApproved: { type: "boolean", notNull: true, default: false },
    isPublished: { type: "boolean", notNull: true, default: false },
    publishedAt: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'approved', 'rejected', 'removed')" 
    },
    reviewedAt: { type: "timestamp" },
    reviewedBy: { type: "uuid" },
    reviewNotes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant reviews
  pgm.createIndex("merchant_review", "merchantId");
  pgm.createIndex("merchant_review", "customerId");
  pgm.createIndex("merchant_review", "orderId");
  pgm.createIndex("merchant_review", "rating");
  pgm.createIndex("merchant_review", "isVerifiedPurchase");
  pgm.createIndex("merchant_review", "isApproved");
  pgm.createIndex("merchant_review", "isPublished");
  pgm.createIndex("merchant_review", "status");
  pgm.createIndex("merchant_review", "createdAt");
  pgm.createIndex("merchant_review", ["merchantId", "customerId", "orderId"], { 
    unique: true,
    where: "orderId IS NOT NULL",
    nulls: "not distinct"
  });

  // Insert sample merchant store
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_store" (
      merchantId,
      name,
      slug,
      description,
      shortDescription,
      isActive,
      isVerified,
      storeEmail,
      storePhone
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      'Sample Merchant Store',
      'sample-merchant-store',
      'This is a sample merchant store for demonstration purposes',
      'Sample store with great products',
      true,
      true,
      'store@example.com',
      '555-123-4567'
    )
  `);

  // Insert sample shipping template
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_shipping_template" (
      merchantId,
      name,
      description,
      isDefault,
      isActive,
      flatRate,
      freeShippingThreshold,
      processingTime,
      rulesType
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      'Standard Shipping',
      'Standard flat rate shipping with free shipping over $50',
      true,
      true,
      5.99,
      50.00,
      2,
      'flat'
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("merchant_review");
  pgm.dropTable("merchant_follower");
  pgm.dropTable("merchant_shipping_template");
  pgm.dropTable("merchant_order");
  pgm.dropTable("merchant_product_variant");
  pgm.dropTable("merchant_product");
  pgm.dropTable("merchant_store");
};
