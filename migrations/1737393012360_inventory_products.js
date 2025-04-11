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
    parent_id: { type: "uuid", references: "product_category" }, // For hierarchical categories
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(150)", notNull: true, unique: true },
    description: { type: "text" },
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    meta_keywords: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_visible: { type: "boolean", notNull: true, default: true },
    position: { type: "integer", default: 0 }, // For ordering within parent
    level: { type: "integer", notNull: true, default: 0 }, // Hierarchy level
    path: { type: "text" }, // Full path from root to this category
    attributes: { type: "jsonb" }, // Category-specific attributes
    filterable_attributes: { type: "jsonb" }, // Attributes used for filtering
    thumbnail_url: { type: "text" },
    image_url: { type: "text" },
    banner_url: { type: "text" },
    content: { type: "text" }, // Rich content for category page
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for product categories
  pgm.createIndex("product_category", "parent_id");
  pgm.createIndex("product_category", "name");
  pgm.createIndex("product_category", "slug");
  pgm.createIndex("product_category", "is_active");
  pgm.createIndex("product_category", "is_visible");
  pgm.createIndex("product_category", "position");
  pgm.createIndex("product_category", "level");
  pgm.createIndex("product_category", "path", { method: "btree" });

  // Create product brand table
  pgm.createTable("product_brand", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(150)", notNull: true, unique: true },
    description: { type: "text" },
    logo: { type: "text" },
    banner_image: { type: "text" },
    website: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_featured: { type: "boolean", notNull: true, default: false },
    position: { type: "integer", default: 0 }, // For ordering
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    meta_keywords: { type: "text" },
    content: { type: "text" }, // Rich content for brand page
    country_of_origin: { type: "varchar(2)" }, // ISO country code
    founded_year: { type: "integer" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for product brands
  pgm.createIndex("product_brand", "name");
  pgm.createIndex("product_brand", "slug");
  pgm.createIndex("product_brand", "is_active");
  pgm.createIndex("product_brand", "is_featured");
  pgm.createIndex("product_brand", "position");

  // Create product attribute table
  pgm.createTable("product_attribute", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true }, // System name
    description: { type: "text" },
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "type IN ('text', 'number', 'boolean', 'date', 'color', 'select', 'multiselect', 'file')" 
    },
    is_active: { type: "boolean", notNull: true, default: true },
    is_required: { type: "boolean", notNull: true, default: false },
    is_variant: { type: "boolean", notNull: true, default: false }, // Used for variants
    is_searchable: { type: "boolean", notNull: true, default: false },
    is_filterable: { type: "boolean", notNull: true, default: false },
    is_comparable: { type: "boolean", notNull: true, default: false },
    is_visible_on_product: { type: "boolean", notNull: true, default: true },
    position: { type: "integer", default: 0 }, // For ordering
    default_value: { type: "text" },
    validations: { type: "jsonb" }, // Validation rules
    allowed_values: { type: "jsonb" }, // For select/multiselect
    unit: { type: "varchar(20)" }, // For number attributes
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for product attributes
  pgm.createIndex("product_attribute", "code");
  pgm.createIndex("product_attribute", "type");
  pgm.createIndex("product_attribute", "is_active");
  pgm.createIndex("product_attribute", "is_variant");
  pgm.createIndex("product_attribute", "is_searchable");
  pgm.createIndex("product_attribute", "is_filterable");
  pgm.createIndex("product_attribute", "position");

  // Create product attribute value table
  pgm.createTable("product_attribute_value", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    attribute_id: { type: "uuid", notNull: true, references: "product_attribute", onDelete: "CASCADE" },
    value: { type: "text", notNull: true }, // Actual value
    display_value: { type: "varchar(255)" }, // Formatted display value
    position: { type: "integer", default: 0 }, // For ordering
    is_default: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product attribute values
  pgm.createIndex("product_attribute_value", "attribute_id");
  pgm.createIndex("product_attribute_value", "value");
  pgm.createIndex("product_attribute_value", "is_default");
  pgm.createIndex("product_attribute_value", "position");
  pgm.createIndex("product_attribute_value", ["attribute_id", "value"], { unique: true });

  // Create product attribute group table
  pgm.createTable("product_attribute_group", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true }, // System name
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    position: { type: "integer", default: 0 }, // For ordering
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product attribute groups
  pgm.createIndex("product_attribute_group", "code");
  pgm.createIndex("product_attribute_group", "is_active");
  pgm.createIndex("product_attribute_group", "position");

  // Create product attribute to group mapping table
  pgm.createTable("product_attribute_to_group", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    attribute_id: { type: "uuid", notNull: true, references: "product_attribute", onDelete: "CASCADE" },
    group_id: { type: "uuid", notNull: true, references: "product_attribute_group", onDelete: "CASCADE" },
    position: { type: "integer", default: 0 }, // For ordering within group
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product attribute to group mappings
  pgm.createIndex("product_attribute_to_group", "attribute_id");
  pgm.createIndex("product_attribute_to_group", "group_id");
  pgm.createIndex("product_attribute_to_group", "position");
  pgm.createIndex("product_attribute_to_group", ["attribute_id", "group_id"], { unique: true });

  // Create product tag table
  pgm.createTable("product_tag", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(150)", notNull: true, unique: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product tags
  pgm.createIndex("product_tag", "name");
  pgm.createIndex("product_tag", "slug");
  pgm.createIndex("product_tag", "is_active");

  // Insert default product categories
  pgm.sql(`
    INSERT INTO "product_category" (name, slug, description, is_active, is_visible, level, path)
    VALUES 
      ('All Products', 'all-products', 'Root category for all products', true, true, 0, '/'),
      ('Electronics', 'electronics', 'Electronic devices and accessories', true, true, 1, '/electronics'),
      ('Apparel', 'apparel', 'Clothing and accessories', true, true, 1, '/apparel'),
      ('Home & Garden', 'home-garden', 'Home decoration and garden supplies', true, true, 1, '/home-garden')
  `);

  // Insert default brands
  pgm.sql(`
    INSERT INTO "product_brand" (name, slug, description, is_active, is_featured)
    VALUES 
      ('Generic', 'generic', 'Generic/unbranded products', true, false),
      ('Sample Brand', 'sample-brand', 'Sample brand for testing', true, true)
  `);

  // Insert default product attributes
  pgm.sql(`
    INSERT INTO "product_attribute" (
      name, 
      code, 
      description, 
      type, 
      is_active, 
      is_variant, 
      is_searchable, 
      is_filterable, 
      is_visible_on_product, 
      position
    )
    VALUES 
      ('Color', 'color', 'Product color', 'color', true, true, true, true, true, 10),
      ('Size', 'size', 'Product size', 'select', true, true, true, true, true, 20),
      ('Material', 'material', 'Product material', 'text', true, false, true, true, true, 30),
      ('Weight', 'weight', 'Product weight in grams', 'number', true, false, false, true, true, 40)
  `);

  // Insert default attribute group
  pgm.sql(`
    INSERT INTO "product_attribute_group" (name, code, description, is_active, position)
    VALUES 
      ('Basic Attributes', 'basic', 'Basic product attributes', true, 10),
      ('Physical Properties', 'physical', 'Physical properties of the product', true, 20)
  `);

  // Link attributes to groups
  pgm.sql(`
    WITH 
      basic_group AS (SELECT id FROM product_attribute_group WHERE code = 'basic'),
      physical_group AS (SELECT id FROM product_attribute_group WHERE code = 'physical'),
      color_attr AS (SELECT id FROM product_attribute WHERE code = 'color'),
      size_attr AS (SELECT id FROM product_attribute WHERE code = 'size'),
      material_attr AS (SELECT id FROM product_attribute WHERE code = 'material'),
      weight_attr AS (SELECT id FROM product_attribute WHERE code = 'weight')
    INSERT INTO "product_attribute_to_group" (attribute_id, group_id, position)
    VALUES 
      ((SELECT id FROM color_attr), (SELECT id FROM basic_group), 10),
      ((SELECT id FROM size_attr), (SELECT id FROM basic_group), 20),
      ((SELECT id FROM material_attr), (SELECT id FROM physical_group), 10),
      ((SELECT id FROM weight_attr), (SELECT id FROM physical_group), 20)
  `);

  // Insert default attribute values
  pgm.sql(`
    WITH 
      color_attr AS (SELECT id FROM product_attribute WHERE code = 'color'),
      size_attr AS (SELECT id FROM product_attribute WHERE code = 'size')
    INSERT INTO "product_attribute_value" (attribute_id, value, display_value, position)
    VALUES 
      ((SELECT id FROM color_attr), 'red', 'Red', 10),
      ((SELECT id FROM color_attr), 'blue', 'Blue', 20),
      ((SELECT id FROM color_attr), 'black', 'Black', 30),
      ((SELECT id FROM color_attr), 'white', 'White', 40),
      ((SELECT id FROM size_attr), 'xs', 'XS', 10),
      ((SELECT id FROM size_attr), 's', 'S', 20),
      ((SELECT id FROM size_attr), 'm', 'M', 30),
      ((SELECT id FROM size_attr), 'l', 'L', 40),
      ((SELECT id FROM size_attr), 'xl', 'XL', 50)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("product_attribute_to_group");
  pgm.dropTable("product_attribute_value");
  pgm.dropTable("product_attribute_group");
  pgm.dropTable("product_attribute");
  pgm.dropTable("product_tag");
  pgm.dropTable("product_brand");
  pgm.dropTable("product_category");
};
