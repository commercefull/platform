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
      shortDescription: { type: "text" },
      metaTitle: { type: "varchar(255)" },
      metaDescription: { type: "text" },
      metaKeywords: { type: "varchar(255)" },
      slug: { type: "varchar(255)", unique: true },
      isFeatured: { type: "boolean", notNull: true, default: false },
      isVirtual: { type: "boolean", notNull: true, default: false },
      isDownloadable: { type: "boolean", notNull: true, default: false },
      isSubscription: { type: "boolean", notNull: true, default: false },
      isTaxable: { type: "boolean", notNull: true, default: true },
      taxClass: { type: "varchar(100)", default: "standard" },
      weight: { type: "decimal(10,2)" },
      weightUnit: { type: "varchar(10)", default: "kg" },
      length: { type: "decimal(10,2)" },
      width: { type: "decimal(10,2)" },
      height: { type: "decimal(10,2)" },
      dimensionUnit: { type: "varchar(10)", default: "cm" },
      basePrice: { type: "decimal(15,2)" },
      salePrice: { type: "decimal(15,2)" },
      cost: { type: "decimal(15,2)" },
      currencyCode: { type: "varchar(3)", default: "USD" },
      primaryImageId: { type: "uuid" },
      publishedAt: { type: "timestamp" },
      deletedAt: { type: "timestamp" },
      userId: { type: "uuid" }, // User who created the product
      merchantId: { type: "uuid", references: "merchant" }, // Owner merchant
      brandId: { type: "uuid" },
      minOrderQuantity: { type: "integer", default: 1 },
      maxOrderQuantity: { type: "integer" },
      returnPolicy: { type: "text" },
      warranty: { type: "text" },
      externalId: { type: "varchar(255)" }, // For integration with external systems
      hasVariants: { type: "boolean", notNull: true, default: false },
      variantAttributes: { type: "jsonb" }, // Attributes used for creating variants
      metadata: { type: "jsonb" },
    }
  });

  // Create additional indexes for product table
  pgm.createIndex("product", "slug");
  pgm.createIndex("product", "sku");
  pgm.createIndex("product", "status");
  pgm.createIndex("product", "visibility");
  pgm.createIndex("product", "isFeatured");
  pgm.createIndex("product", "basePrice");
  pgm.createIndex("product", "salePrice");
  pgm.createIndex("product", "merchantId");
  pgm.createIndex("product", "brandId");
  pgm.createIndex("product", "hasVariants");
  pgm.createIndex("product", "publishedAt");
  pgm.createIndex("product", "deletedAt");
  pgm.createIndex("product", "userId");
  pgm.createIndex("product", "externalId");

  // Create product media table
  pgm.createTable("product_media", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('image', 'video', 'document', '3d_model', 'audio')" 
    },
    url: { type: "text", notNull: true },
    filename: { type: "varchar(255)" },
    filesize: { type: "integer" },
    mimeType: { type: "varchar(100)" },
    altText: { type: "varchar(255)" },
    title: { type: "varchar(255)" },
    sortOrder: { type: "integer", notNull: true, default: 0 },
    isPrimary: { type: "boolean", notNull: true, default: false },
    width: { type: "integer" },
    height: { type: "integer" },
    duration: { type: "integer" }, // For video/audio in seconds
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product media
  pgm.createIndex("product_media", "productId");
  pgm.createIndex("product_media", "variantId");
  pgm.createIndex("product_media", "type");
  pgm.createIndex("product_media", "sortOrder");
  pgm.createIndex("product_media", "isPrimary");
  pgm.createIndex("product_media", ["productId", "isPrimary"], {
    unique: true,
    where: "isPrimary = true AND variantId IS NULL"
  });
  pgm.createIndex("product_media", ["variantId", "isPrimary"], {
    unique: true,
    where: "isPrimary = true AND variantId IS NOT NULL"
  });

  // Create product SEO table
  pgm.createTable("product_seo", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE", unique: true },
    metaTitle: { type: "varchar(255)" },
    metaDescription: { type: "text" },
    metaKeywords: { type: "varchar(255)" },
    ogTitle: { type: "varchar(255)" },
    ogDescription: { type: "text" },
    ogImage: { type: "text" },
    twitterCard: { type: "varchar(50)", default: "summary_large_image" },
    twitterTitle: { type: "varchar(255)" },
    twitterDescription: { type: "text" },
    twitterImage: { type: "text" },
    canonicalUrl: { type: "text" },
    robots: { type: "varchar(100)", default: "index, follow" },
    structuredData: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create index for product SEO
  pgm.createIndex("product_seo", "productId");

  // Enhance product type table with more fields
  pgm.alterTable("productType", {
    add: {
      slug: { type: "varchar(255)", unique: true },
      isActive: { type: "boolean", notNull: true, default: true },
      icon: { type: "varchar(255)" },
      metaTitle: { type: "varchar(255)" },
      metaDescription: { type: "text" },
      sortOrder: { type: "integer", notNull: true, default: 0 },
      attributeTemplate: { type: "jsonb" }, // Default attributes for this product type
      merchantId: { type: "uuid", references: "merchant" }, // Owner merchant if not global
      isGlobal: { type: "boolean", notNull: true, default: true },
      metadata: { type: "jsonb" }
    }
  });

  // Create additional indexes for product type
  pgm.createIndex("productType", "slug");
  pgm.createIndex("productType", "isActive");
  pgm.createIndex("productType", "sortOrder");
  pgm.createIndex("productType", "merchantId");
  pgm.createIndex("productType", "isGlobal");

  // Create product brand table
  pgm.createTable("product_brand", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(255)", unique: true },
    description: { type: "text" },
    logoUrl: { type: "text" },
    websiteUrl: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    isFeatured: { type: "boolean", notNull: true, default: false },
    metaTitle: { type: "varchar(255)" },
    metaDescription: { type: "text" },
    metaKeywords: { type: "varchar(255)" },
    merchantId: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    isGlobal: { type: "boolean", notNull: true, default: true },
    sortOrder: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product brand
  pgm.createIndex("product_brand", "slug");
  pgm.createIndex("product_brand", "isActive");
  pgm.createIndex("product_brand", "isFeatured");
  pgm.createIndex("product_brand", "merchantId");
  pgm.createIndex("product_brand", "isGlobal");
  pgm.createIndex("product_brand", "sortOrder");

  // Update product table to reference brand table
  pgm.sql(`
    ALTER TABLE product
    ADD CONSTRAINT fk_product_brand
    FOREIGN KEY (brandId)
    REFERENCES product_brand(id)
    ON DELETE SET NULL;
  `);

  // Create product downloadable asset table (for digital products)
  pgm.createTable("product_download", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    name: { type: "varchar(255)", notNull: true },
    fileUrl: { type: "text", notNull: true },
    filePath: { type: "text" },
    fileSize: { type: "integer" },
    mimeType: { type: "varchar(100)" },
    maxDownloads: { type: "integer" }, // Limit number of downloads per purchase
    daysValid: { type: "integer" }, // Expiration in days after purchase
    isActive: { type: "boolean", notNull: true, default: true },
    sampleUrl: { type: "text" }, // Preview download URL
    sortOrder: { type: "integer", notNull: true, default: 0 },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product downloads
  pgm.createIndex("product_download", "productId");
  pgm.createIndex("product_download", "variantId");
  pgm.createIndex("product_download", "isActive");
  pgm.createIndex("product_download", "sortOrder");

  // Insert sample brand data
  pgm.sql(`
    INSERT INTO product_brand (
      name, 
      slug, 
      description,
      logoUrl,
      isActive,
      isFeatured,
      isGlobal
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
    UPDATE "productType"
    SET 
      slug = 'electronics',
      isActive = true,
      icon = 'laptop',
      metaTitle = 'Electronics - High Quality Electronic Products',
      metaDescription = 'Shop our wide range of electronic products including smartphones, laptops, and accessories.',
      sortOrder = 1,
      attributeTemplate = '{"attributes": ["color", "size", "weight", "material"]}',
      isGlobal = true
    WHERE name = 'Electronics';
    
    INSERT INTO "productType" (
      name,
      slug,
      description,
      isActive,
      icon,
      metaTitle,
      metaDescription,
      sortOrder,
      attributeTemplate,
      isGlobal
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
  pgm.alterTable("productVariant", {
    add: {
      name: { type: "varchar(255)" },
      barcode: { type: "varchar(100)" },
      isDefault: { type: "boolean", notNull: true, default: false },
      isActive: { type: "boolean", notNull: true, default: true },
      stockQuantity: { type: "integer" },
      lowStockThreshold: { type: "integer" },
      backorderStatus: { type: "varchar(50)", default: "no" }, // yes, no, notify
      weight: { type: "decimal(10,2)" },
      dimensions: { type: "jsonb" }, // {length, width, height, unit}
      cost: { type: "decimal(15,2)" },
      salePrice: { type: "decimal(15,2)" },
      saleStartDate: { type: "timestamp" },
      saleEndDate: { type: "timestamp" },
      minOrderQuantity: { type: "integer", default: 1 },
      maxOrderQuantity: { type: "integer" },
      metadata: { type: "jsonb" },
      attributes: { type: "jsonb" }, // Specific attributes of this variant
      imageUrl: { type: "text" }, // Main image URL
      position: { type: "integer", default: 0 }, // Sort order among variants
      externalId: { type: "varchar(255)" } // For integration with external systems
    }
  });

  // Create additional indexes for product variants
  pgm.createIndex("productVariant", "barcode");
  pgm.createIndex("productVariant", "isDefault");
  pgm.createIndex("productVariant", "isActive");
  pgm.createIndex("productVariant", "stockQuantity");
  pgm.createIndex("productVariant", "salePrice");
  pgm.createIndex("productVariant", "externalId");
  pgm.createIndex("productVariant", ["productId", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Insert sample product
  pgm.sql(`
    WITH 
      sample_type AS (SELECT id FROM "productType" WHERE slug = 'electronics' LIMIT 1),
      sample_brand AS (SELECT id FROM product_brand WHERE slug = 'techgear' LIMIT 1),
      sample_merchant AS (SELECT id FROM merchant LIMIT 1)
    INSERT INTO product (
      name,
      productTypeId,
      description,
      sku,
      status,
      visibility,
      shortDescription,
      metaTitle,
      metaDescription,
      slug,
      isFeatured,
      isVirtual,
      basePrice,
      salePrice,
      currencyCode,
      publishedAt,
      merchantId,
      brandId,
      hasVariants
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
    INSERT INTO "productVariant" (
      productId,
      sku,
      price,
      name,
      barcode,
      isDefault,
      isActive,
      stockQuantity,
      lowStockThreshold,
      salePrice,
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
  pgm.sql(`DELETE FROM "productType" WHERE slug IN ('clothing', 'home-goods', 'digital-downloads');`);

  // Drop tables in reverse order
  pgm.dropTable("product_download");
  pgm.dropTable("product_seo");
  pgm.dropTable("product_media");
  pgm.dropTable("product_brand");

  // Remove added columns from existing tables
  pgm.alterTable("productVariant", {
    drop: {
      columns: [
        "name", "barcode", "isDefault", "isActive", "stockQuantity", "lowStockThreshold",
        "backorderStatus", "weight", "dimensions", "cost", "salePrice", "saleStartDate",
        "saleEndDate", "minOrderQuantity", "maxOrderQuantity", "metadata", "attributes",
        "imageUrl", "position", "externalId"
      ]
    }
  });

  pgm.alterTable("productType", {
    drop: {
      columns: [
        "slug", "isActive", "icon", "metaTitle", "metaDescription", "sortOrder",
        "attributeTemplate", "merchantId", "isGlobal", "metadata"
      ]
    }
  });

  pgm.alterTable("product", {
    drop: {
      columns: [
        "sku", "status", "visibility", "shortDescription", "metaTitle", "metaDescription", 
        "metaKeywords", "slug", "isFeatured", "isVirtual", "isDownloadable", "isSubscription", 
        "isTaxable", "taxClass", "weight", "weightUnit", "length", "width", "height", 
        "dimensionUnit", "basePrice", "salePrice", "cost", "currencyCode", "primaryImageId", 
        "publishedAt", "deletedAt", "userId", "merchantId", "brandId", "minOrderQuantity", 
        "maxOrderQuantity", "returnPolicy", "warranty", "externalId", "hasVariants", 
        "variantAttributes", "metadata"
      ]
    }
  });

  // Drop enums
  pgm.dropType("product_visibility");
  pgm.dropType("product_status");
};
