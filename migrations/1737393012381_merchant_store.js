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
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(150)", notNull: true, unique: true },
    description: { type: "text" },
    short_description: { type: "varchar(255)" },
    logo: { type: "text" },
    banner: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_verified: { type: "boolean", notNull: true, default: false },
    is_featured: { type: "boolean", notNull: true, default: false },
    store_url: { type: "varchar(255)" }, // Custom domain
    store_email: { type: "varchar(255)" },
    store_phone: { type: "varchar(30)" },
    theme: { type: "varchar(50)", default: 'default' },
    color_scheme: { type: "jsonb" },
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    meta_keywords: { type: "text" },
    opening_hours: { type: "jsonb" }, // Store hours
    social_links: { type: "jsonb" }, // Social media profiles
    store_policies: { type: "jsonb" }, // Return, shipping, etc. policies
    shipping_methods: { type: "jsonb" }, // Available shipping methods
    payment_methods: { type: "jsonb" }, // Accepted payment methods
    store_rating: { type: "decimal(3,2)" }, // Average rating
    review_count: { type: "integer", default: 0 },
    follower_count: { type: "integer", default: 0 },
    product_count: { type: "integer", default: 0 },
    order_count: { type: "integer", default: 0 },
    featured_products: { type: "uuid[]" }, // Featured product IDs
    store_categories: { type: "jsonb" }, // Store-specific categories
    custom_pages: { type: "jsonb" }, // Custom store pages
    custom_fields: { type: "jsonb" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant stores
  pgm.createIndex("merchant_store", "merchant_id", { unique: true });
  pgm.createIndex("merchant_store", "name");
  pgm.createIndex("merchant_store", "slug");
  pgm.createIndex("merchant_store", "is_active");
  pgm.createIndex("merchant_store", "is_verified");
  pgm.createIndex("merchant_store", "is_featured");
  pgm.createIndex("merchant_store", "store_rating");
  pgm.createIndex("merchant_store", "follower_count");
  pgm.createIndex("merchant_store", "product_count");
  pgm.createIndex("merchant_store", "order_count");
  pgm.createIndex("merchant_store", "featured_products", { method: "gin" });

  // Create merchant product table
  pgm.createTable("merchant_product", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_approved: { type: "boolean", notNull: true, default: false },
    approved_at: { type: "timestamp" },
    approved_by: { type: "uuid" },
    approval_notes: { type: "text" },
    is_featured: { type: "boolean", notNull: true, default: false },
    featured_from: { type: "timestamp" },
    featured_to: { type: "timestamp" },
    merchant_sku: { type: "varchar(100)" }, // Merchant's own SKU
    merchant_price: { type: "decimal(15,2)" }, // Merchant's selling price
    merchant_cost: { type: "decimal(15,2)" }, // Merchant's cost
    merchant_stock: { type: "integer" }, // Merchant's stock level
    commission_rate: { type: "decimal(5,2)" }, // Override commission for this product
    shipping_template: { type: "varchar(50)" }, // Merchant shipping template
    handling_time: { type: "integer" }, // Processing time in days
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant products
  pgm.createIndex("merchant_product", "merchant_id");
  pgm.createIndex("merchant_product", "product_id");
  pgm.createIndex("merchant_product", "is_active");
  pgm.createIndex("merchant_product", "is_approved");
  pgm.createIndex("merchant_product", "is_featured");
  pgm.createIndex("merchant_product", "merchant_sku");
  pgm.createIndex("merchant_product", "merchant_price");
  pgm.createIndex("merchant_product", "merchant_stock");
  pgm.createIndex("merchant_product", "commission_rate");
  pgm.createIndex("merchant_product", "handling_time");
  pgm.createIndex("merchant_product", ["merchant_id", "product_id"], { unique: true });

  // Create merchant product variant mapping
  pgm.createTable("merchant_product_variant", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_product_id: { type: "uuid", notNull: true, references: "merchant_product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", notNull: true, references: "product_variant", onDelete: "CASCADE" },
    is_active: { type: "boolean", notNull: true, default: true },
    merchant_sku: { type: "varchar(100)" }, // Merchant's own SKU for variant
    merchant_price: { type: "decimal(15,2)" }, // Merchant's selling price for variant
    merchant_cost: { type: "decimal(15,2)" }, // Merchant's cost for variant
    merchant_stock: { type: "integer" }, // Merchant's stock level for variant
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant product variants
  pgm.createIndex("merchant_product_variant", "merchant_product_id");
  pgm.createIndex("merchant_product_variant", "variant_id");
  pgm.createIndex("merchant_product_variant", "is_active");
  pgm.createIndex("merchant_product_variant", "merchant_sku");
  pgm.createIndex("merchant_product_variant", "merchant_price");
  pgm.createIndex("merchant_product_variant", "merchant_stock");
  pgm.createIndex("merchant_product_variant", ["merchant_product_id", "variant_id"], { unique: true });

  // Create merchant order table
  pgm.createTable("merchant_order", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    order_item_ids: { type: "uuid[]", notNull: true }, // IDs of order items for this merchant
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
    commission_amount: { type: "decimal(15,2)", notNull: true },
    payout_amount: { type: "decimal(15,2)", notNull: true }, // Total - commission
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    shipping_address: { type: "jsonb" },
    billing_address: { type: "jsonb" },
    shipping_method: { type: "varchar(100)" },
    tracking_number: { type: "varchar(100)" },
    tracking_url: { type: "varchar(255)" },
    carrier_name: { type: "varchar(100)" },
    customer_notes: { type: "text" },
    merchant_notes: { type: "text" },
    admin_notes: { type: "text" },
    is_payout_processed: { type: "boolean", notNull: true, default: false },
    payout_date: { type: "timestamp" },
    payout_transaction_id: { type: "varchar(100)" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant orders
  pgm.createIndex("merchant_order", "merchant_id");
  pgm.createIndex("merchant_order", "order_id");
  pgm.createIndex("merchant_order", "order_item_ids", { method: "gin" });
  pgm.createIndex("merchant_order", "status");
  pgm.createIndex("merchant_order", "total");
  pgm.createIndex("merchant_order", "commission_amount");
  pgm.createIndex("merchant_order", "payout_amount");
  pgm.createIndex("merchant_order", "currency");
  pgm.createIndex("merchant_order", "tracking_number");
  pgm.createIndex("merchant_order", "is_payout_processed");
  pgm.createIndex("merchant_order", "payout_date");
  pgm.createIndex("merchant_order", "payout_transaction_id");
  pgm.createIndex("merchant_order", "created_at");
  pgm.createIndex("merchant_order", ["merchant_id", "order_id"], { unique: true });

  // Create merchant shipping template table
  pgm.createTable("merchant_shipping_template", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    is_default: { type: "boolean", notNull: true, default: false },
    is_active: { type: "boolean", notNull: true, default: true },
    flat_rate: { type: "decimal(10,2)" }, // Flat shipping rate
    free_shipping_threshold: { type: "decimal(10,2)" }, // Order amount for free shipping
    processing_time: { type: "integer", default: 1 }, // Days to process order
    rules_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'flat',
      check: "rules_type IN ('flat', 'weight', 'price', 'distance', 'item', 'complex')" 
    },
    rules: { type: "jsonb" }, // Shipping rules
    shipping_destinations: { type: "jsonb" }, // Where merchant ships to
    restricted_destinations: { type: "jsonb" }, // Where merchant doesn't ship
    supported_carriers: { type: "jsonb" }, // Carriers merchant uses
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant shipping templates
  pgm.createIndex("merchant_shipping_template", "merchant_id");
  pgm.createIndex("merchant_shipping_template", "is_default");
  pgm.createIndex("merchant_shipping_template", "is_active");
  pgm.createIndex("merchant_shipping_template", "flat_rate");
  pgm.createIndex("merchant_shipping_template", "free_shipping_threshold");
  pgm.createIndex("merchant_shipping_template", "rules_type");
  pgm.createIndex("merchant_shipping_template", ["merchant_id", "is_default"], {
    unique: true,
    where: "is_default = true"
  });

  // Create merchant follower table
  pgm.createTable("merchant_follower", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    followed_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    email_notifications: { type: "boolean", notNull: true, default: true },
    push_notifications: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" }
  });

  // Create indexes for merchant followers
  pgm.createIndex("merchant_follower", "merchant_id");
  pgm.createIndex("merchant_follower", "customer_id");
  pgm.createIndex("merchant_follower", "followed_at");
  pgm.createIndex("merchant_follower", ["merchant_id", "customer_id"], { unique: true });

  // Create merchant review table
  pgm.createTable("merchant_review", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    order_id: { type: "uuid", references: "order" }, // Optional reference to order
    rating: { type: "integer", notNull: true, check: "rating BETWEEN 1 AND 5" },
    title: { type: "varchar(255)" },
    content: { type: "text" },
    is_verified_purchase: { type: "boolean", notNull: true, default: false },
    is_approved: { type: "boolean", notNull: true, default: false },
    is_published: { type: "boolean", notNull: true, default: false },
    published_at: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'approved', 'rejected', 'removed')" 
    },
    reviewed_at: { type: "timestamp" },
    reviewed_by: { type: "uuid" },
    review_notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant reviews
  pgm.createIndex("merchant_review", "merchant_id");
  pgm.createIndex("merchant_review", "customer_id");
  pgm.createIndex("merchant_review", "order_id");
  pgm.createIndex("merchant_review", "rating");
  pgm.createIndex("merchant_review", "is_verified_purchase");
  pgm.createIndex("merchant_review", "is_approved");
  pgm.createIndex("merchant_review", "is_published");
  pgm.createIndex("merchant_review", "status");
  pgm.createIndex("merchant_review", "created_at");
  pgm.createIndex("merchant_review", ["merchant_id", "customer_id", "order_id"], { 
    unique: true,
    where: "order_id IS NOT NULL",
    nulls: "not distinct"
  });

  // Insert sample merchant store
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_store" (
      merchant_id,
      name,
      slug,
      description,
      short_description,
      is_active,
      is_verified,
      store_email,
      store_phone
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
      merchant_id,
      name,
      description,
      is_default,
      is_active,
      flat_rate,
      free_shipping_threshold,
      processing_time,
      rules_type
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
