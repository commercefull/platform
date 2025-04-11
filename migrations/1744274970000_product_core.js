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
  // Create product status enum
  pgm.createType("product_status", [
    "draft",
    "pending_review",
    "active",
    "inactive",
    "discontinued",
    "archived"
  ]);

  // Create product visibility enum
  pgm.createType("product_visibility", [
    "visible",
    "hidden",
    "catalog_only",
    "search_only",
    "featured"
  ]);

  // Alter existing product table to add more fields
  pgm.alterTable("product", {
    add: {
      sku: { type: "varchar(100)" },
      status: { type: "product_status", notNull: true, default: "draft" },
      visibility: { type: "product_visibility", notNull: true, default: "hidden" },
      short_description: { type: "text" },
      meta_title: { type: "varchar(255)" },
      meta_description: { type: "text" },
      meta_keywords: { type: "varchar(255)" },
      slug: { type: "varchar(255)", unique: true },
      is_featured: { type: "boolean", notNull: true, default: false },
      is_virtual: { type: "boolean", notNull: true, default: false },
      is_downloadable: { type: "boolean", notNull: true, default: false },
      is_subscription: { type: "boolean", notNull: true, default: false },
      is_taxable: { type: "boolean", notNull: true, default: true },
      tax_class: { type: "varchar(100)", default: "standard" },
      weight: { type: "decimal(10,2)" },
      weight_unit: { type: "varchar(10)", default: "kg" },
      length: { type: "decimal(10,2)" },
      width: { type: "decimal(10,2)" },
      height: { type: "decimal(10,2)" },
      dimension_unit: { type: "varchar(10)", default: "cm" },
      base_price: { type: "decimal(15,2)" },
      sale_price: { type: "decimal(15,2)" },
      cost: { type: "decimal(15,2)" },
      currency_code: { type: "varchar(3)", default: "USD" },
      primary_image_id: { type: "uuid" },
      published_at: { type: "timestamp" },
      deleted_at: { type: "timestamp" },
      user_id: { type: "uuid" }, // User who created the product
      merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant
      brand_id: { type: "uuid" },
      min_order_quantity: { type: "integer", default: 1 },
      max_order_quantity: { type: "integer" },
      return_policy: { type: "text" },
      warranty: { type: "text" },
      external_id: { type: "varchar(255)" }, // For integration with external systems
      has_variants: { type: "boolean", notNull: true, default: false },
      variant_attributes: { type: "jsonb" }, // Attributes used for creating variants
      metadata: { type: "jsonb" },
    }
  });

  // Create additional indexes for product table
  pgm.createIndex("product", "slug");
  pgm.createIndex("product", "sku");
  pgm.createIndex("product", "status");
  pgm.createIndex("product", "visibility");
  pgm.createIndex("product", "is_featured");
  pgm.createIndex("product", "base_price");
  pgm.createIndex("product", "sale_price");
  pgm.createIndex("product", "merchant_id");
  pgm.createIndex("product", "brand_id");
  pgm.createIndex("product", "has_variants");
  pgm.createIndex("product", "published_at");
  pgm.createIndex("product", "deleted_at");
  pgm.createIndex("product", "user_id");
  pgm.createIndex("product", "external_id");

  // Create product media table
  pgm.createTable("product_media", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('image', 'video', 'document', '3d_model', 'audio')" 
    },
    url: { type: "text", notNull: true },
    filename: { type: "varchar(255)" },
    filesize: { type: "integer" },
    mime_type: { type: "varchar(100)" },
    alt_text: { type: "varchar(255)" },
    title: { type: "varchar(255)" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    is_primary: { type: "boolean", notNull: true, default: false },
    width: { type: "integer" },
    height: { type: "integer" },
    duration: { type: "integer" }, // For video/audio in seconds
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for product media
  pgm.createIndex("product_media", "product_id");
  pgm.createIndex("product_media", "variant_id");
  pgm.createIndex("product_media", "type");
  pgm.createIndex("product_media", "sort_order");
  pgm.createIndex("product_media", "is_primary");
  pgm.createIndex("product_media", "deleted_at");
  pgm.createIndex("product_media", ["product_id", "is_primary"], {
    unique: true,
    where: "is_primary = true AND variant_id IS NULL"
  });
  pgm.createIndex("product_media", ["variant_id", "is_primary"], {
    unique: true,
    where: "is_primary = true AND variant_id IS NOT NULL"
  });

  // Create product SEO table
  pgm.createTable("product_seo", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE", unique: true },
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    meta_keywords: { type: "varchar(255)" },
    og_title: { type: "varchar(255)" },
    og_description: { type: "text" },
    og_image: { type: "text" },
    twitter_card: { type: "varchar(50)", default: "summary_large_image" },
    twitter_title: { type: "varchar(255)" },
    twitter_description: { type: "text" },
    twitter_image: { type: "text" },
    canonical_url: { type: "text" },
    robots: { type: "varchar(100)", default: "index, follow" },
    structured_data: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create index for product SEO
  pgm.createIndex("product_seo", "product_id");
  pgm.createIndex("product_seo", "deleted_at");

  // Enhance product type table with more fields
  pgm.alterTable("product_type", {
    add: {
      slug: { type: "varchar(255)", unique: true },
      is_active: { type: "boolean", notNull: true, default: true },
      icon: { type: "varchar(255)" },
      meta_title: { type: "varchar(255)" },
      meta_description: { type: "text" },
      sort_order: { type: "integer", notNull: true, default: 0 },
      attribute_template: { type: "jsonb" }, // Default attributes for this product type
      merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant if not global
      is_global: { type: "boolean", notNull: true, default: true },
      metadata: { type: "jsonb" },
      deleted_at: { type: "timestamp" }
    }
  });

  // Create additional indexes for product type
  pgm.createIndex("product_type", "slug");
  pgm.createIndex("product_type", "is_active");
  pgm.createIndex("product_type", "sort_order");
  pgm.createIndex("product_type", "merchant_id");
  pgm.createIndex("product_type", "is_global");
  pgm.createIndex("product_type", "deleted_at");

  // Create product brand table
  pgm.createTable("product_brand", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(255)", unique: true },
    description: { type: "text" },
    logo_url: { type: "text" },
    website_url: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_featured: { type: "boolean", notNull: true, default: false },
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    meta_keywords: { type: "varchar(255)" },
    merchant_id: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    is_global: { type: "boolean", notNull: true, default: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for product brand
  pgm.createIndex("product_brand", "slug");
  pgm.createIndex("product_brand", "is_active");
  pgm.createIndex("product_brand", "is_featured");
  pgm.createIndex("product_brand", "merchant_id");
  pgm.createIndex("product_brand", "is_global");
  pgm.createIndex("product_brand", "deleted_at");

  // Update product table to reference brand table
  pgm.sql(`
    ALTER TABLE product
    ADD CONSTRAINT fk_product_brand
    FOREIGN KEY (brand_id)
    REFERENCES product_brand(id)
    ON DELETE SET NULL;
  `);

  // Create product downloadable asset table (for digital products)
  pgm.createTable("product_download", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    file_url: { type: "text", notNull: true },
    file_path: { type: "text" },
    file_size: { type: "integer" },
    mime_type: { type: "varchar(100)" },
    max_downloads: { type: "integer" }, // Limit number of downloads per purchase
    days_valid: { type: "integer" }, // Expiration in days after purchase
    is_active: { type: "boolean", notNull: true, default: true },
    sample_url: { type: "text" }, // Preview download URL
    sort_order: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product downloads
  pgm.createIndex("product_download", "product_id");
  pgm.createIndex("product_download", "variant_id");
  pgm.createIndex("product_download", "is_active");
  pgm.createIndex("product_download", "sort_order");

  // Insert sample brand data
  pgm.sql(`
    INSERT INTO product_brand (
      name, 
      slug, 
      description,
      logo_url,
      is_active,
      is_featured,
      is_global
    )
    VALUES 
    (
      'Acme Corporation',
      'acme-corporation',
      'Quality products for every need',
      'https://example.com/brands/acme-logo.png',
      true,
      true,
      true
    ),
    (
      'TechGear',
      'techgear',
      'Innovative technology solutions',
      'https://example.com/brands/techgear-logo.png',
      true,
      true,
      true
    ),
    (
      'Fashionista',
      'fashionista',
      'Trendy fashion for all seasons',
      'https://example.com/brands/fashionista-logo.png',
      true,
      false,
      true
    );
  `);

  // Insert sample product types
  pgm.sql(`
    UPDATE product_type
    SET 
      slug = 'electronics',
      is_active = true,
      icon = 'laptop',
      meta_title = 'Electronics - High Quality Electronic Products',
      meta_description = 'Shop our wide range of electronic products including smartphones, laptops, and accessories.',
      sort_order = 1,
      attribute_template = '{"attributes": ["color", "size", "weight", "material"]}',
      is_global = true
    WHERE name = 'Electronics';
    
    INSERT INTO product_type (
      name,
      slug,
      description,
      is_active,
      icon,
      meta_title,
      meta_description,
      sort_order,
      attribute_template,
      is_global
    )
    VALUES 
    (
      'Clothing',
      'clothing',
      'Clothing items including shirts, pants, dresses, and accessories',
      true,
      'tshirt',
      'Clothing - Fashion Products',
      'Shop our collection of trendy clothing items for men, women, and kids.',
      2,
      '{"attributes": ["color", "size", "material", "style"]}',
      true
    ),
    (
      'Home Goods',
      'home-goods',
      'Products for your home including furniture, decor, and kitchen items',
      true,
      'home',
      'Home Goods - Products for Your Home',
      'Find everything you need for your home, from furniture to kitchen appliances.',
      3,
      '{"attributes": ["color", "size", "material", "style", "room"]}',
      true
    ),
    (
      'Digital Downloads',
      'digital-downloads',
      'Digital products including software, e-books, and music',
      true,
      'download',
      'Digital Downloads - Software, E-books, and More',
      'Download digital products instantly after purchase.',
      4,
      '{"attributes": ["format", "fileSize", "length", "requirements"]}',
      true
    );
  `);

  // Update product variants table with more fields
  pgm.alterTable("product_variant", {
    add: {
      name: { type: "varchar(255)" },
      barcode: { type: "varchar(100)" },
      is_default: { type: "boolean", notNull: true, default: false },
      is_active: { type: "boolean", notNull: true, default: true },
      stock_quantity: { type: "integer" },
      low_stock_threshold: { type: "integer" },
      backorder_status: { type: "varchar(50)", default: "no" }, // yes, no, notify
      weight: { type: "decimal(10,2)" },
      dimensions: { type: "jsonb" }, // {length, width, height, unit}
      cost: { type: "decimal(15,2)" },
      sale_price: { type: "decimal(15,2)" },
      sale_start_date: { type: "timestamp" },
      sale_end_date: { type: "timestamp" },
      min_order_quantity: { type: "integer", default: 1 },
      max_order_quantity: { type: "integer" },
      metadata: { type: "jsonb" },
      attributes: { type: "jsonb" }, // Specific attributes of this variant
      image_url: { type: "text" }, // Main image URL
      position: { type: "integer", default: 0 }, // Sort order among variants
      external_id: { type: "varchar(255)" } // For integration with external systems
    }
  });

  // Create additional indexes for product variants
  pgm.createIndex("product_variant", "barcode");
  pgm.createIndex("product_variant", "is_default");
  pgm.createIndex("product_variant", "is_active");
  pgm.createIndex("product_variant", "stock_quantity");
  pgm.createIndex("product_variant", "sale_price");
  pgm.createIndex("product_variant", "external_id");
  pgm.createIndex("product_variant", ["product_id", "is_default"], {
    unique: true,
    where: "is_default = true"
  });

  // Insert sample product
  pgm.sql(`
    WITH 
      sample_type AS (SELECT id FROM product_type WHERE slug = 'electronics' LIMIT 1),
      sample_brand AS (SELECT id FROM product_brand WHERE slug = 'techgear' LIMIT 1),
      sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO product (
      name,
      product_type_id,
      description,
      sku,
      status,
      visibility,
      short_description,
      meta_title,
      meta_description,
      slug,
      is_featured,
      is_virtual,
      base_price,
      sale_price,
      currency_code,
      published_at,
      merchant_id,
      brand_id,
      has_variants
    )
    VALUES (
      'Premium Bluetooth Headphones',
      (SELECT id FROM sample_type),
      'Experience premium sound quality with our latest Bluetooth headphones. Featuring noise cancellation technology, comfortable ear cups, and long battery life.',
      'TG-BH-001',
      'active',
      'visible',
      'Premium wireless headphones with noise cancellation',
      'Premium Bluetooth Headphones - TechGear',
      'Experience premium sound quality with our latest Bluetooth headphones featuring noise cancellation.',
      'premium-bluetooth-headphones',
      true,
      false,
      129.99,
      99.99,
      'USD',
      CURRENT_TIMESTAMP,
      (SELECT id FROM sample_merchant),
      (SELECT id FROM sample_brand),
      true
    )
    RETURNING id;
  `);

  // Insert sample variants for the product
  pgm.sql(`
    WITH sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1)
    INSERT INTO product_variant (
      product_id,
      sku,
      price,
      name,
      barcode,
      is_default,
      is_active,
      stock_quantity,
      low_stock_threshold,
      sale_price,
      attributes,
      position
    )
    VALUES 
    (
      (SELECT id FROM sample_product),
      'TG-BH-001-BLK',
      129.99,
      'Premium Bluetooth Headphones - Black',
      '123456789012',
      true,
      true,
      50,
      10,
      99.99,
      '{"color": "Black"}',
      1
    ),
    (
      (SELECT id FROM sample_product),
      'TG-BH-001-WHT',
      129.99,
      'Premium Bluetooth Headphones - White',
      '123456789013',
      false,
      true,
      35,
      10,
      99.99,
      '{"color": "White"}',
      2
    ),
    (
      (SELECT id FROM sample_product),
      'TG-BH-001-RED',
      139.99,
      'Premium Bluetooth Headphones - Red (Limited Edition)',
      '123456789014',
      false,
      true,
      15,
      5,
      109.99,
      '{"color": "Red", "limited": true}',
      3
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop the sample data (not required, but cleaner)
  pgm.sql(`DELETE FROM product WHERE slug = 'premium-bluetooth-headphones';`);
  pgm.sql(`DELETE FROM product_brand WHERE slug IN ('acme-corporation', 'techgear', 'fashionista');`);
  pgm.sql(`DELETE FROM product_type WHERE slug IN ('clothing', 'home-goods', 'digital-downloads');`);

  // Drop tables in reverse order
  pgm.dropTable("product_download");
  pgm.dropTable("product_seo");
  pgm.dropTable("product_media");
  pgm.dropTable("product_brand");

  // Remove added columns from existing tables
  pgm.alterTable("product_variant", {
    drop: {
      columns: [
        "name", "barcode", "is_default", "is_active", "stock_quantity", "low_stock_threshold",
        "backorder_status", "weight", "dimensions", "cost", "sale_price", "sale_start_date",
        "sale_end_date", "min_order_quantity", "max_order_quantity", "metadata", "attributes",
        "image_url", "position", "external_id"
      ]
    }
  });

  pgm.alterTable("product_type", {
    drop: {
      columns: [
        "slug", "is_active", "icon", "meta_title", "meta_description", "sort_order",
        "attribute_template", "merchant_id", "is_global", "metadata", "deleted_at"
      ]
    }
  });

  pgm.alterTable("product", {
    drop: {
      columns: [
        "sku", "status", "visibility", "short_description", "meta_title", "meta_description", 
        "meta_keywords", "slug", "is_featured", "is_virtual", "is_downloadable", "is_subscription", 
        "is_taxable", "tax_class", "weight", "weight_unit", "length", "width", "height", 
        "dimension_unit", "base_price", "sale_price", "cost", "currency_code", "primary_image_id", 
        "published_at", "deleted_at", "user_id", "merchant_id", "brand_id", "min_order_quantity", 
        "max_order_quantity", "return_policy", "warranty", "external_id", "has_variants", 
        "variant_attributes", "metadata"
      ]
    }
  });

  // Drop enums
  pgm.dropType("product_visibility");
  pgm.dropType("product_status");
};
