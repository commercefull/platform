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
    shortDescription: { type: "text" },
    brandId: { type: "uuid", references: "product_brand" },
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
    salePrice: { type: "decimal(15,2)" },
    costPrice: { type: "decimal(15,2)" },
    compareAtPrice: { type: "decimal(15,2)" },
    taxClass: { type: "varchar(50)", default: 'standard' },
    taxRate: { type: "decimal(5,2)" },
    isTaxable: { type: "boolean", notNull: true, default: true },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    isInventoryManaged: { type: "boolean", notNull: true, default: true }, // Whether to track inventory
    minOrderQuantity: { type: "integer", default: 1 },
    maxOrderQuantity: { type: "integer" },
    orderIncrementQuantity: { type: "integer", default: 1 },
    weight: { type: "decimal(10,2)" }, // Weight in grams
    weightUnit: { type: "varchar(10)", default: 'g' },
    length: { type: "decimal(10,2)" }, // Length in cm
    width: { type: "decimal(10,2)" }, // Width in cm
    height: { type: "decimal(10,2)" }, // Height in cm
    dimensionUnit: { type: "varchar(5)", default: 'cm' },
    metaTitle: { type: "varchar(255)" },
    metaDescription: { type: "text" },
    metaKeywords: { type: "text" },
    hsCode: { type: "varchar(20)" }, // Harmonized System code for international shipping
    countryOfOrigin: { type: "varchar(2)" }, // ISO country code
    isFeatured: { type: "boolean", notNull: true, default: false },
    isNew: { type: "boolean", notNull: true, default: false },
    isBestseller: { type: "boolean", notNull: true, default: false },
    warningThreshold: { type: "integer" }, // Low stock warning level
    preorderEnabled: { type: "boolean", notNull: true, default: false },
    preorderReleaseDate: { type: "timestamp" },
    preorderAllowance: { type: "integer" }, // Amount to allow for preorder
    averageRating: { type: "decimal(3,2)" },
    reviewCount: { type: "integer", default: 0 },
    customFields: { type: "jsonb" }, // Extensible custom fields
    seoData: { type: "jsonb" }, // SEO-related data
    relatedProducts: { type: "uuid[]" }, // IDs of related products
    crossSellProducts: { type: "uuid[]" }, // IDs of cross-sell products
    upSellProducts: { type: "uuid[]" }, // IDs of up-sell products
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedBy: { type: "uuid" }
  });

  // Create indexes for products
  pgm.createIndex("product", "sku");
  pgm.createIndex("product", "name");
  pgm.createIndex("product", "slug");
  pgm.createIndex("product", "brandId");
  pgm.createIndex("product", "type");
  pgm.createIndex("product", "status");
  pgm.createIndex("product", "visibility");
  pgm.createIndex("product", "price");
  pgm.createIndex("product", "salePrice");
  pgm.createIndex("product", "isFeatured");
  pgm.createIndex("product", "isNew");
  pgm.createIndex("product", "isBestseller");
  pgm.createIndex("product", "averageRating");
  pgm.createIndex("product", "createdAt");

  // Create GIN index for searching in name and description
  pgm.sql(`
    CREATE INDEX product_search_idx ON product USING gin(
      to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(short_description, ''))
    );
  `);

  // Create product variant table
  pgm.createTable("product_variant", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    sku: { type: "varchar(100)", notNull: true, unique: true },
    name: { type: "varchar(255)" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'inactive', 'archived', 'discontinued')" 
    },
    price: { type: "decimal(15,2)" }, // Override of main price, NULL means use parent
    salePrice: { type: "decimal(15,2)" },
    costPrice: { type: "decimal(15,2)" },
    compareAtPrice: { type: "decimal(15,2)" },
    isDefault: { type: "boolean", notNull: true, default: false }, // Is default variant
    weight: { type: "decimal(10,2)" }, // Weight in grams
    length: { type: "decimal(10,2)" }, // Length in cm
    width: { type: "decimal(10,2)" }, // Width in cm
    height: { type: "decimal(10,2)" }, // Height in cm
    optionValues: { type: "jsonb", notNull: true }, // Configuration options
    barcode: { type: "varchar(100)" }, // UPC, EAN, etc.
    mpn: { type: "varchar(100)" }, // Manufacturer Part Number
    position: { type: "integer", default: 0 }, // For ordering
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product variants
  pgm.createIndex("product_variant", "productId");
  pgm.createIndex("product_variant", "sku");
  pgm.createIndex("product_variant", "status");
  pgm.createIndex("product_variant", "isDefault");
  pgm.createIndex("product_variant", "barcode");
  pgm.createIndex("product_variant", "mpn");
  pgm.createIndex("product_variant", "position");
  pgm.createIndex("product_variant", "optionValues", { method: "gin" });

  // Add constraint to ensure only one default variant per product
  pgm.createIndex("product_variant", ["productId", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Create product to category mapping table
  pgm.createTable("product_to_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    categoryId: { type: "uuid", notNull: true, references: "product_category", onDelete: "CASCADE" },
    isPrimary: { type: "boolean", notNull: true, default: false }, // Primary category
    position: { type: "integer", default: 0 }, // For ordering within category
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product to category
  pgm.createIndex("product_to_category", "productId");
  pgm.createIndex("product_to_category", "categoryId");
  pgm.createIndex("product_to_category", "isPrimary");
  pgm.createIndex("product_to_category", "position");
  pgm.createIndex("product_to_category", ["productId", "categoryId"], { unique: true });

  // Add constraint to ensure only one primary category per product
  pgm.createIndex("product_to_category", ["productId", "isPrimary"], {
    unique: true,
    where: "isPrimary = true"
  });

  // Create product to tag mapping table
  pgm.createTable("product_to_tag", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    tagId: { type: "uuid", notNull: true, references: "product_tag", onDelete: "CASCADE" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product to tag
  pgm.createIndex("product_to_tag", "productId");
  pgm.createIndex("product_to_tag", "tagId");
  pgm.createIndex("product_to_tag", ["productId", "tagId"], { unique: true });

  // Create product attribute value mapping table
  pgm.createTable("product_attribute_value_map", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    attributeId: { type: "uuid", notNull: true, references: "product_attribute", onDelete: "CASCADE" },
    value: { type: "text", notNull: true }, // Free text or reference to product_attribute_value
    displayValue: { type: "varchar(255)" }, // Formatted display value
    position: { type: "integer", default: 0 }, // For ordering
    isVariantOption: { type: "boolean", notNull: true, default: false }, // Is this a variant-creating option
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product attribute values
  pgm.createIndex("product_attribute_value_map", "productId");
  pgm.createIndex("product_attribute_value_map", "variantId");
  pgm.createIndex("product_attribute_value_map", "attributeId");
  pgm.createIndex("product_attribute_value_map", "value");
  pgm.createIndex("product_attribute_value_map", "isVariantOption");
  // Create a unique constraint for product/variant + attribute
  pgm.createIndex("product_attribute_value_map", ["productId", "variantId", "attributeId"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Create product image table
  pgm.createTable("product_image", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    url: { type: "text", notNull: true },
    alt: { type: "varchar(255)" },
    title: { type: "varchar(255)" },
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'main',
      check: "type IN ('main', 'thumbnail', 'gallery', 'swatch', 'lifestyle', 'detail')" 
    },
    isPrimary: { type: "boolean", notNull: true, default: false }, // Primary image
    sortOrder: { type: "integer", default: 0 }, // For ordering
    width: { type: "integer" },
    height: { type: "integer" },
    size: { type: "integer" }, // File size in bytes
    mimeType: { type: "varchar(50)" },
    metadata: { type: "jsonb" }, // Additional data (EXIF, etc.)
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product images
  pgm.createIndex("product_image", "productId");
  pgm.createIndex("product_image", "variantId");
  pgm.createIndex("product_image", "type");
  pgm.createIndex("product_image", "isPrimary");
  pgm.createIndex("product_image", "sortOrder");

  // Create a unique constraint for primary images
  pgm.createIndex("product_image", ["productId", "isPrimary"], {
    unique: true,
    where: "isPrimary = true AND variantId IS NULL"
  });
  pgm.createIndex("product_image", ["productId", "variantId", "isPrimary"], {
    unique: true,
    where: "isPrimary = true AND variantId IS NOT NULL"
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
      shortDescription,
      brandId,
      type,
      status,
      price,
      weight,
      isInventoryManaged,
      isFeatured
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
      productId,
      categoryId,
      isPrimary
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
