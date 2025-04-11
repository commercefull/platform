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
  // Create product category table
  pgm.createTable("product_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(255)", unique: true },
    description: { type: "text" },
    parent_id: { type: "uuid", references: "product_category" },
    path: { type: "text" }, // Materialized path (e.g., "1/2/3")
    depth: { type: "integer", notNull: true, default: 0 },
    position: { type: "integer", notNull: true, default: 0 },
    is_active: { type: "boolean", notNull: true, default: true },
    is_featured: { type: "boolean", notNull: true, default: false },
    image_url: { type: "text" },
    banner_url: { type: "text" },
    icon_url: { type: "text" },
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    meta_keywords: { type: "varchar(255)" },
    include_in_menu: { type: "boolean", notNull: true, default: true },
    product_count: { type: "integer", notNull: true, default: 0 },
    merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    is_global: { type: "boolean", notNull: true, default: true },
    custom_layout: { type: "text" }, // Reference to custom template
    display_settings: { type: "jsonb" }, // Settings for category display
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product categories
  pgm.createIndex("product_category", "slug");
  pgm.createIndex("product_category", "parent_id");
  pgm.createIndex("product_category", "path");
  pgm.createIndex("product_category", "depth");
  pgm.createIndex("product_category", "position");
  pgm.createIndex("product_category", "is_active");
  pgm.createIndex("product_category", "is_featured");
  pgm.createIndex("product_category", "include_in_menu");
  pgm.createIndex("product_category", "merchant_id");
  pgm.createIndex("product_category", "is_global");

  // Create product-to-category mapping table
  pgm.createTable("product_category_map", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    category_id: { type: "uuid", notNull: true, references: "product_category", onDelete: "CASCADE" },
    position: { type: "integer", notNull: true, default: 0 },
    is_primary: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product-to-category mapping
  pgm.createIndex("product_category_map", "product_id");
  pgm.createIndex("product_category_map", "category_id");
  pgm.createIndex("product_category_map", "position");
  pgm.createIndex("product_category_map", "is_primary");
  pgm.createIndex("product_category_map", ["product_id", "category_id"], { unique: true });
  pgm.createIndex("product_category_map", ["product_id", "is_primary"], {
    unique: true,
    where: "is_primary = true"
  });

  // Create product tag table
  pgm.createTable("product_tag", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(100)", unique: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    is_global: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product tags
  pgm.createIndex("product_tag", "slug");
  pgm.createIndex("product_tag", "is_active");
  pgm.createIndex("product_tag", "merchant_id");
  pgm.createIndex("product_tag", "is_global");

  // Create product-to-tag mapping table
  pgm.createTable("product_tag_map", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    tag_id: { type: "uuid", notNull: true, references: "product_tag", onDelete: "CASCADE" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product-to-tag mapping
  pgm.createIndex("product_tag_map", "product_id");
  pgm.createIndex("product_tag_map", "tag_id");
  pgm.createIndex("product_tag_map", ["product_id", "tag_id"], { unique: true });

  // Create product collection table
  pgm.createTable("product_collection", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(255)", unique: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_automated: { type: "boolean", notNull: true, default: false },
    is_featured: { type: "boolean", notNull: true, default: false },
    image_url: { type: "text" },
    banner_url: { type: "text" },
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    conditions: { type: "jsonb" }, // For automated collections
    sort_order: { type: "varchar(50)", default: "manual" }, // manual, price-asc, price-desc, etc.
    merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product collections
  pgm.createIndex("product_collection", "slug");
  pgm.createIndex("product_collection", "is_active");
  pgm.createIndex("product_collection", "is_automated");
  pgm.createIndex("product_collection", "is_featured");
  pgm.createIndex("product_collection", "merchant_id");

  // Create product-to-collection mapping table
  pgm.createTable("product_collection_map", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    collection_id: { type: "uuid", notNull: true, references: "product_collection", onDelete: "CASCADE" },
    position: { type: "integer", notNull: true, default: 0 },
    added_manually: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product-to-collection mapping
  pgm.createIndex("product_collection_map", "product_id");
  pgm.createIndex("product_collection_map", "collection_id");
  pgm.createIndex("product_collection_map", "position");
  pgm.createIndex("product_collection_map", "added_manually");
  pgm.createIndex("product_collection_map", ["product_id", "collection_id"], { unique: true });

  // Insert sample categories
  pgm.sql(`
    INSERT INTO product_category (
      name,
      slug,
      description,
      is_active,
      is_featured,
      include_in_menu,
      path,
      depth,
      position,
      is_global
    )
    VALUES 
    (
      'Electronics',
      'electronics',
      'Shop our wide range of electronic products including smartphones, laptops, and accessories.',
      true,
      true,
      true,
      'electronics',
      0,
      1,
      true
    ),
    (
      'Smartphones',
      'smartphones',
      'Find the latest smartphones from top brands.',
      true,
      false,
      true,
      'electronics/smartphones',
      1,
      1,
      true
    ),
    (
      'Laptops',
      'laptops',
      'Shop laptops for work, gaming, and more.',
      true,
      false,
      true,
      'electronics/laptops',
      1,
      2,
      true
    ),
    (
      'Audio',
      'audio',
      'High-quality audio equipment including headphones, speakers, and more.',
      true,
      false,
      true,
      'electronics/audio',
      1,
      3,
      true
    ),
    (
      'Clothing',
      'clothing',
      'Shop our collection of trendy clothing items for men, women, and kids.',
      true,
      true,
      true,
      'clothing',
      0,
      2,
      true
    ),
    (
      'Men',
      'men',
      'Clothing for men including shirts, pants, and accessories.',
      true,
      false,
      true,
      'clothing/men',
      1,
      1,
      true
    ),
    (
      'Women',
      'women',
      'Clothing for women including dresses, tops, and accessories.',
      true,
      false,
      true,
      'clothing/women',
      1,
      2,
      true
    );
  `);

  // Insert sample tags
  pgm.sql(`
    INSERT INTO product_tag (
      name,
      slug,
      is_active,
      is_global
    )
    VALUES 
    (
      'New Arrival',
      'new-arrival',
      true,
      true
    ),
    (
      'Best Seller',
      'best-seller',
      true,
      true
    ),
    (
      'Sale',
      'sale',
      true,
      true
    ),
    (
      'Limited Edition',
      'limited-edition',
      true,
      true
    ),
    (
      'Eco-Friendly',
      'eco-friendly',
      true,
      true
    );
  `);

  // Insert sample collections
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO product_collection (
      name,
      slug,
      description,
      is_active,
      is_featured,
      merchant_id
    )
    VALUES 
    (
      'Summer Sale',
      'summer-sale',
      'Hot deals for the summer season.',
      true,
      true,
      (SELECT id FROM sample_merchant)
    ),
    (
      'Back to School',
      'back-to-school',
      'Everything you need for the new school year.',
      true,
      true,
      (SELECT id FROM sample_merchant)
    ),
    (
      'Staff Picks',
      'staff-picks',
      'Favorite products selected by our staff.',
      true,
      false,
      (SELECT id FROM sample_merchant)
    );
  `);

  // Add sample product to categories
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
      audio_category AS (SELECT id FROM product_category WHERE slug = 'audio' LIMIT 1),
      electronics_category AS (SELECT id FROM product_category WHERE slug = 'electronics' LIMIT 1)
    INSERT INTO product_category_map (
      product_id,
      category_id,
      is_primary
    )
    VALUES 
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM audio_category),
      true
    ),
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM electronics_category),
      false
    );
  `);

  // Add sample product to tags
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
      new_arrival_tag AS (SELECT id FROM product_tag WHERE slug = 'new-arrival' LIMIT 1),
      best_seller_tag AS (SELECT id FROM product_tag WHERE slug = 'best-seller' LIMIT 1)
    INSERT INTO product_tag_map (
      product_id,
      tag_id
    )
    VALUES 
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM new_arrival_tag)
    ),
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM best_seller_tag)
    );
  `);

  // Add sample product to collection
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
      staff_picks_collection AS (SELECT id FROM product_collection WHERE slug = 'staff-picks' LIMIT 1)
    INSERT INTO product_collection_map (
      product_id,
      collection_id,
      position
    )
    VALUES 
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM staff_picks_collection),
      1
    );
  `);

  // Update category parent IDs and paths
  pgm.sql(`
    WITH 
      electronics AS (SELECT id FROM product_category WHERE slug = 'electronics'),
      clothing AS (SELECT id FROM product_category WHERE slug = 'clothing')
    UPDATE product_category
    SET parent_id = (SELECT id FROM electronics)
    WHERE slug IN ('smartphones', 'laptops', 'audio');
    
    UPDATE product_category
    SET parent_id = (SELECT id FROM clothing)
    WHERE slug IN ('men', 'women');
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable("product_collection_map");
  pgm.dropTable("product_collection");
  pgm.dropTable("product_tag_map");
  pgm.dropTable("product_tag");
  pgm.dropTable("product_category_map");
  pgm.dropTable("product_category");
};
