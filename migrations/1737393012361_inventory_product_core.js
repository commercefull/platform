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
  // Create main product table
  pgm.createTable("product", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    sku: { type: "varchar(100)", notNull: true, unique: true }, // Master SKU
    name: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(255)", notNull: true, unique: true },
    description: { type: "text" },
    short_description: { type: "text" },
    brand_id: { type: "uuid", references: "product_brand" },
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'simple',
      check: "type IN ('simple', 'configurable', 'grouped', 'virtual', 'downloadable', 'bundle', 'subscription')" 
    },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'draft',
      check: "status IN ('draft', 'active', 'inactive', 'archived', 'discontinued')" 
    },
    visibility: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'visible',
      check: "visibility IN ('visible', 'not_visible', 'catalog', 'search')" 
    },
    price: { type: "decimal(15,2)", notNull: true },
    sale_price: { type: "decimal(15,2)" },
    cost_price: { type: "decimal(15,2)" },
    compare_at_price: { type: "decimal(15,2)" },
    tax_class: { type: "varchar(50)", default: 'standard' },
    tax_rate: { type: "decimal(5,2)" },
    is_taxable: { type: "boolean", notNull: true, default: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    is_inventory_managed: { type: "boolean", notNull: true, default: true }, // Whether to track inventory
    min_order_quantity: { type: "integer", default: 1 },
    max_order_quantity: { type: "integer" },
    order_increment_quantity: { type: "integer", default: 1 },
    weight: { type: "decimal(10,2)" }, // Weight in grams
    weight_unit: { type: "varchar(10)", default: 'g' },
    length: { type: "decimal(10,2)" }, // Length in cm
    width: { type: "decimal(10,2)" }, // Width in cm
    height: { type: "decimal(10,2)" }, // Height in cm
    dimension_unit: { type: "varchar(5)", default: 'cm' },
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    meta_keywords: { type: "text" },
    hs_code: { type: "varchar(20)" }, // Harmonized System code for international shipping
    country_of_origin: { type: "varchar(2)" }, // ISO country code
    is_featured: { type: "boolean", notNull: true, default: false },
    is_new: { type: "boolean", notNull: true, default: false },
    is_bestseller: { type: "boolean", notNull: true, default: false },
    warning_threshold: { type: "integer" }, // Low stock warning level
    preorder_enabled: { type: "boolean", notNull: true, default: false },
    preorder_release_date: { type: "timestamp" },
    preorder_allowance: { type: "integer" }, // Amount to allow for preorder
    average_rating: { type: "decimal(3,2)" },
    review_count: { type: "integer", default: 0 },
    custom_fields: { type: "jsonb" }, // Extensible custom fields
    seo_data: { type: "jsonb" }, // SEO-related data
    related_products: { type: "uuid[]" }, // IDs of related products
    cross_sell_products: { type: "uuid[]" }, // IDs of cross-sell products
    up_sell_products: { type: "uuid[]" }, // IDs of up-sell products
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_by: { type: "uuid" }
  });

  // Create indexes for products
  pgm.createIndex("product", "sku");
  pgm.createIndex("product", "name");
  pgm.createIndex("product", "slug");
  pgm.createIndex("product", "brand_id");
  pgm.createIndex("product", "type");
  pgm.createIndex("product", "status");
  pgm.createIndex("product", "visibility");
  pgm.createIndex("product", "price");
  pgm.createIndex("product", "sale_price");
  pgm.createIndex("product", "is_featured");
  pgm.createIndex("product", "is_new");
  pgm.createIndex("product", "is_bestseller");
  pgm.createIndex("product", "average_rating");
  pgm.createIndex("product", "created_at");

  // Create GIN index for searching in name and description
  pgm.sql(`
    CREATE INDEX product_search_idx ON product USING gin(
      to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(short_description, ''))
    );
  `);

  // Create product variant table
  pgm.createTable("product_variant", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    sku: { type: "varchar(100)", notNull: true, unique: true },
    name: { type: "varchar(255)" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'inactive', 'archived', 'discontinued')" 
    },
    price: { type: "decimal(15,2)" }, // Override of main price, NULL means use parent
    sale_price: { type: "decimal(15,2)" },
    cost_price: { type: "decimal(15,2)" },
    compare_at_price: { type: "decimal(15,2)" },
    is_default: { type: "boolean", notNull: true, default: false }, // Is default variant
    weight: { type: "decimal(10,2)" }, // Weight in grams
    length: { type: "decimal(10,2)" }, // Length in cm
    width: { type: "decimal(10,2)" }, // Width in cm
    height: { type: "decimal(10,2)" }, // Height in cm
    option_values: { type: "jsonb", notNull: true }, // Configuration options
    barcode: { type: "varchar(100)" }, // UPC, EAN, etc.
    mpn: { type: "varchar(100)" }, // Manufacturer Part Number
    position: { type: "integer", default: 0 }, // For ordering
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product variants
  pgm.createIndex("product_variant", "product_id");
  pgm.createIndex("product_variant", "sku");
  pgm.createIndex("product_variant", "status");
  pgm.createIndex("product_variant", "is_default");
  pgm.createIndex("product_variant", "barcode");
  pgm.createIndex("product_variant", "mpn");
  pgm.createIndex("product_variant", "position");
  pgm.createIndex("product_variant", "option_values", { method: "gin" });

  // Add constraint to ensure only one default variant per product
  pgm.createIndex("product_variant", ["product_id", "is_default"], {
    unique: true,
    where: "is_default = true"
  });

  // Create product to category mapping table
  pgm.createTable("product_to_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    category_id: { type: "uuid", notNull: true, references: "product_category", onDelete: "CASCADE" },
    is_primary: { type: "boolean", notNull: true, default: false }, // Primary category
    position: { type: "integer", default: 0 }, // For ordering within category
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product to category
  pgm.createIndex("product_to_category", "product_id");
  pgm.createIndex("product_to_category", "category_id");
  pgm.createIndex("product_to_category", "is_primary");
  pgm.createIndex("product_to_category", "position");
  pgm.createIndex("product_to_category", ["product_id", "category_id"], { unique: true });

  // Add constraint to ensure only one primary category per product
  pgm.createIndex("product_to_category", ["product_id", "is_primary"], {
    unique: true,
    where: "is_primary = true"
  });

  // Create product to tag mapping table
  pgm.createTable("product_to_tag", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    tag_id: { type: "uuid", notNull: true, references: "product_tag", onDelete: "CASCADE" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product to tag
  pgm.createIndex("product_to_tag", "product_id");
  pgm.createIndex("product_to_tag", "tag_id");
  pgm.createIndex("product_to_tag", ["product_id", "tag_id"], { unique: true });

  // Create product attribute value mapping table
  pgm.createTable("product_attribute_value_map", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    attribute_id: { type: "uuid", notNull: true, references: "product_attribute", onDelete: "CASCADE" },
    value: { type: "text", notNull: true }, // Free text or reference to product_attribute_value
    display_value: { type: "varchar(255)" }, // Formatted display value
    position: { type: "integer", default: 0 }, // For ordering
    is_variant_option: { type: "boolean", notNull: true, default: false }, // Is this a variant-creating option
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product attribute values
  pgm.createIndex("product_attribute_value_map", "product_id");
  pgm.createIndex("product_attribute_value_map", "variant_id");
  pgm.createIndex("product_attribute_value_map", "attribute_id");
  pgm.createIndex("product_attribute_value_map", "value");
  pgm.createIndex("product_attribute_value_map", "is_variant_option");
  // Create a unique constraint for product/variant + attribute
  pgm.createIndex("product_attribute_value_map", ["product_id", "variant_id", "attribute_id"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Create product image table
  pgm.createTable("product_image", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    url: { type: "text", notNull: true },
    alt: { type: "varchar(255)" },
    title: { type: "varchar(255)" },
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'main',
      check: "type IN ('main', 'thumbnail', 'gallery', 'swatch', 'lifestyle', 'detail')" 
    },
    is_primary: { type: "boolean", notNull: true, default: false }, // Primary image
    sort_order: { type: "integer", default: 0 }, // For ordering
    width: { type: "integer" },
    height: { type: "integer" },
    size: { type: "integer" }, // File size in bytes
    mime_type: { type: "varchar(50)" },
    metadata: { type: "jsonb" }, // Additional data (EXIF, etc.)
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product images
  pgm.createIndex("product_image", "product_id");
  pgm.createIndex("product_image", "variant_id");
  pgm.createIndex("product_image", "type");
  pgm.createIndex("product_image", "is_primary");
  pgm.createIndex("product_image", "sort_order");

  // Create a unique constraint for primary images
  pgm.createIndex("product_image", ["product_id", "is_primary"], {
    unique: true,
    where: "is_primary = true AND variant_id IS NULL"
  });
  pgm.createIndex("product_image", ["product_id", "variant_id", "is_primary"], {
    unique: true,
    where: "is_primary = true AND variant_id IS NOT NULL"
  });

  // Insert sample product data
  pgm.sql(`
    WITH 
      generic_brand AS (SELECT id FROM product_brand WHERE slug = 'generic'),
      electronics_category AS (SELECT id FROM product_category WHERE slug = 'electronics')
    INSERT INTO "product" (
      sku, 
      name, 
      slug, 
      description, 
      short_description,
      brand_id,
      type,
      status,
      price,
      weight,
      is_inventory_managed,
      is_featured
    )
    VALUES (
      'SAMPLE-001',
      'Sample Product',
      'sample-product',
      'This is a detailed description of the sample product.',
      'A short description of the sample product.',
      (SELECT id FROM generic_brand),
      'simple',
      'active',
      19.99,
      500,
      true,
      true
    )
  `);

  // Create link between sample product and electronics category
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE sku = 'SAMPLE-001'),
      electronics_category AS (SELECT id FROM product_category WHERE slug = 'electronics')
    INSERT INTO "product_to_category" (
      product_id,
      category_id,
      is_primary
    )
    VALUES (
      (SELECT id FROM sample_product),
      (SELECT id FROM electronics_category),
      true
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("product_image");
  pgm.dropTable("product_attribute_value_map");
  pgm.dropTable("product_to_tag");
  pgm.dropTable("product_to_category");
  pgm.dropTable("product_variant");
  pgm.dropTable("product");
};
