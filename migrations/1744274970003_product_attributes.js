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
  // Create product attribute group table
  pgm.createTable("product_attribute_group", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    position: { type: "integer", notNull: true, default: 0 },
    isVisible: { type: "boolean", notNull: true, default: true },
    isComparable: { type: "boolean", notNull: true, default: true }, // Used in product comparison
    merchantId: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    isGlobal: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for attribute groups
  pgm.createIndex("product_attribute_group", "code");
  pgm.createIndex("product_attribute_group", "position");
  pgm.createIndex("product_attribute_group", "isVisible");
  pgm.createIndex("product_attribute_group", "isComparable");
  pgm.createIndex("product_attribute_group", "merchantId");
  pgm.createIndex("product_attribute_group", "isGlobal");

  // Create product attribute table
  pgm.createTable("product_attribute", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    groupId: { type: "uuid", references: "product_attribute_group" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('text', 'textarea', 'boolean', 'select', 'multiselect', 'date', 'datetime', 'price', 'media', 'color', 'number')",
      default: "'text'"
    },
    inputType: { 
      type: "varchar(50)", 
      check: "inputType IN ('text', 'textarea', 'boolean', 'select', 'multiselect', 'radio', 'checkbox', 'date', 'price', 'media', 'color', 'number')",
      default: "'text'"
    },
    isRequired: { type: "boolean", notNull: true, default: false },
    isUnique: { type: "boolean", notNull: true, default: false },
    isSystem: { type: "boolean", notNull: true, default: false }, // System-defined attribute
    isSearchable: { type: "boolean", notNull: true, default: true },
    isFilterable: { type: "boolean", notNull: true, default: true },
    isComparable: { type: "boolean", notNull: true, default: true },
    isVisibleOnFront: { type: "boolean", notNull: true, default: true },
    isUsedInProductListing: { type: "boolean", notNull: true, default: false },
    useForVariants: { type: "boolean", notNull: true, default: false }, // Can be used for creating variants
    useForConfigurations: { type: "boolean", notNull: true, default: false }, // Used in configurable products
    position: { type: "integer", notNull: true, default: 0 },
    defaultValue: { type: "text" },
    validationRules: { type: "jsonb" }, // JSON with validation rules
    options: { type: "jsonb" }, // For select/multiselect types
    merchantId: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    isGlobal: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product attributes
  pgm.createIndex("product_attribute", "code");
  pgm.createIndex("product_attribute", "groupId");
  pgm.createIndex("product_attribute", "type");
  pgm.createIndex("product_attribute", "isRequired");
  pgm.createIndex("product_attribute", "isSystem");
  pgm.createIndex("product_attribute", "isSearchable");
  pgm.createIndex("product_attribute", "isFilterable");
  pgm.createIndex("product_attribute", "isVisibleOnFront");
  pgm.createIndex("product_attribute", "useForVariants");
  pgm.createIndex("product_attribute", "useForConfigurations");
  pgm.createIndex("product_attribute", "position");
  pgm.createIndex("product_attribute", "merchantId");
  pgm.createIndex("product_attribute", "isGlobal");

  // Create product attribute set table (templates for product types)
  pgm.createTable("product_attribute_set", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    productTypeId: { type: "uuid", references: "productType" },
    isActive: { type: "boolean", notNull: true, default: true },
    merchantId: { type: "uuid", references: "merchant" }, // Owner merchant if not global
    isGlobal: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for attribute sets
  pgm.createIndex("product_attribute_set", "code");
  pgm.createIndex("product_attribute_set", "productTypeId");
  pgm.createIndex("product_attribute_set", "isActive");
  pgm.createIndex("product_attribute_set", "merchantId");
  pgm.createIndex("product_attribute_set", "isGlobal");

  // Create product attribute set mapping table (maps attributes to attribute sets with additional configuration)
  pgm.createTable("product_attribute_set_mapping", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    attributeSetId: { type: "uuid", notNull: true, references: "product_attribute_set", onDelete: "CASCADE" },
    attributeId: { type: "uuid", notNull: true, references: "product_attribute", onDelete: "CASCADE" },
    position: { type: "integer", notNull: true, default: 0 },
    isRequired: { type: "boolean" }, // Override attribute required setting
    defaultValue: { type: "text" }, // Override attribute default value
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for attribute set mapping
  pgm.createIndex("product_attribute_set_mapping", "attributeSetId");
  pgm.createIndex("product_attribute_set_mapping", "attributeId");
  pgm.createIndex("product_attribute_set_mapping", "position");
  pgm.createIndex("product_attribute_set_mapping", ["attributeSetId", "attributeId"], { unique: true });

  // Create product attribute value table (for product-specific attribute values)
  pgm.createTable("product_attribute_value", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    attributeId: { type: "uuid", notNull: true, references: "product_attribute", onDelete: "CASCADE" },
    value: { type: "text" },
    valueText: { type: "text" }, // For searchable text representation
    valueNumeric: { type: "decimal(15,6)" }, // For numeric values and sorting
    valueBoolean: { type: "boolean" }, // For boolean values
    valueJson: { type: "jsonb" }, // For complex values
    valueDate: { type: "timestamp" }, // For date values
    isSystem: { type: "boolean", notNull: true, default: false }, // System-defined value
    language: { type: "varchar(10)", default: 'en' }, // Language code for localized values
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for attribute values
  pgm.createIndex("product_attribute_value", "productId");
  pgm.createIndex("product_attribute_value", "variantId");
  pgm.createIndex("product_attribute_value", "attributeId");
  pgm.createIndex("product_attribute_value", "value");
  pgm.createIndex("product_attribute_value", "valueText");
  pgm.createIndex("product_attribute_value", "valueNumeric");
  pgm.createIndex("product_attribute_value", "valueBoolean");
  pgm.createIndex("product_attribute_value", "valueDate");
  pgm.createIndex("product_attribute_value", "isSystem");
  pgm.createIndex("product_attribute_value", "language");
  pgm.createIndex("product_attribute_value", ["productId", "attributeId", "language"], {
    where: "variantId IS NULL"
  });
  pgm.createIndex("product_attribute_value", ["variantId", "attributeId", "language"], {
    where: "variantId IS NOT NULL"
  });

  // Create product attribute option table (predefined values for select attributes)
  pgm.createTable("product_attribute_option", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    attributeId: { type: "uuid", notNull: true, references: "product_attribute", onDelete: "CASCADE" },
    value: { type: "varchar(255)", notNull: true },
    label: { type: "varchar(255)", notNull: true },
    position: { type: "integer", notNull: true, default: 0 },
    isDefault: { type: "boolean", notNull: true, default: false },
    metadata: { type: "jsonb" }, // Additional data like color hex code for color attributes
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for attribute options
  pgm.createIndex("product_attribute_option", "attributeId");
  pgm.createIndex("product_attribute_option", "value");
  pgm.createIndex("product_attribute_option", "position");
  pgm.createIndex("product_attribute_option", "isDefault");
  pgm.createIndex("product_attribute_option", ["attributeId", "value"], { unique: true });

  // Insert sample attribute groups
  pgm.sql(`
    INSERT INTO product_attribute_group (
      name,
      code,
      description,
      position,
      isComparable,
      isGlobal
    )
    VALUES 
    (
      'General',
      'general',
      'General product attributes',
      1,
      true,
      true
    ),
    (
      'Technical',
      'technical',
      'Technical specifications',
      2,
      true,
      true
    ),
    (
      'Physical',
      'physical',
      'Physical characteristics like size, weight',
      3,
      true,
      true
    ),
    (
      'Visual',
      'visual',
      'Visual properties like color',
      4,
      true,
      true
    );
  `);

  // Insert sample attributes
  pgm.sql(`
    WITH 
      general_group AS (SELECT id FROM product_attribute_group WHERE code = 'general'),
      tech_group AS (SELECT id FROM product_attribute_group WHERE code = 'technical'),
      physical_group AS (SELECT id FROM product_attribute_group WHERE code = 'physical'),
      visual_group AS (SELECT id FROM product_attribute_group WHERE code = 'visual')
    INSERT INTO product_attribute (
      name,
      code,
      description,
      groupId,
      type,
      inputType,
      isRequired,
      isSearchable,
      isFilterable,
      isVisibleOnFront,
      useForVariants,
      position
    )
    VALUES 
    (
      'Color',
      'color',
      'Product color',
      (SELECT id FROM visual_group),
      'select',
      'select',
      false,
      true,
      true,
      true,
      true,
      1
    ),
    (
      'Size',
      'size',
      'Product size',
      (SELECT id FROM physical_group),
      'select',
      'select',
      false,
      true,
      true,
      true,
      true,
      2
    ),
    (
      'Material',
      'material',
      'Primary material',
      (SELECT id FROM physical_group),
      'select',
      'select',
      false,
      true,
      true,
      true,
      false,
      3
    ),
    (
      'Year',
      'year',
      'Year of manufacture',
      (SELECT id FROM general_group),
      'text',
      'text',
      false,
      true,
      true,
      true,
      false,
      4
    ),
    (
      'Specifications',
      'specifications',
      'Detailed technical specifications',
      (SELECT id FROM tech_group),
      'textarea',
      'textarea',
      false,
      true,
      false,
      true,
      false,
      5
    ),
    (
      'Features',
      'features',
      'Key product features',
      (SELECT id FROM general_group),
      'textarea',
      'textarea',
      false,
      true,
      false,
      true,
      false,
      6
    ),
    (
      'Battery Life',
      'battery_life',
      'Battery life in hours',
      (SELECT id FROM tech_group),
      'number',
      'number',
      false,
      true,
      true,
      true,
      false,
      7
    ),
    (
      'Warranty',
      'warranty',
      'Warranty period in months',
      (SELECT id FROM general_group),
      'number',
      'number',
      false,
      true,
      true,
      true,
      false,
      8
    );
  `);

  // Insert sample attribute options
  pgm.sql(`
    WITH 
      color_attr AS (SELECT id FROM product_attribute WHERE code = 'color'),
      size_attr AS (SELECT id FROM product_attribute WHERE code = 'size'),
      material_attr AS (SELECT id FROM product_attribute WHERE code = 'material')
    INSERT INTO product_attribute_option (
      attributeId,
      value,
      label,
      position,
      isDefault,
      metadata
    )
    VALUES 
    -- Color options
    (
      (SELECT id FROM color_attr),
      'black',
      'Black',
      1,
      true,
      '{"hex": "#000000"}'
    ),
    (
      (SELECT id FROM color_attr),
      'white',
      'White',
      2,
      false,
      '{"hex": "#FFFFFF"}'
    ),
    (
      (SELECT id FROM color_attr),
      'red',
      'Red',
      3,
      false,
      '{"hex": "#FF0000"}'
    ),
    (
      (SELECT id FROM color_attr),
      'blue',
      'Blue',
      4,
      false,
      '{"hex": "#0000FF"}'
    ),
    (
      (SELECT id FROM color_attr),
      'green',
      'Green',
      5,
      false,
      '{"hex": "#00FF00"}'
    ),
    
    -- Size options
    (
      (SELECT id FROM size_attr),
      'xs',
      'XS',
      1,
      false,
      NULL
    ),
    (
      (SELECT id FROM size_attr),
      's',
      'S',
      2,
      false,
      NULL
    ),
    (
      (SELECT id FROM size_attr),
      'm',
      'M',
      3,
      true,
      NULL
    ),
    (
      (SELECT id FROM size_attr),
      'l',
      'L',
      4,
      false,
      NULL
    ),
    (
      (SELECT id FROM size_attr),
      'xl',
      'XL',
      5,
      false,
      NULL
    ),
    
    -- Material options
    (
      (SELECT id FROM material_attr),
      'leather',
      'Leather',
      1,
      false,
      NULL
    ),
    (
      (SELECT id FROM material_attr),
      'plastic',
      'Plastic',
      2,
      true,
      NULL
    ),
    (
      (SELECT id FROM material_attr),
      'metal',
      'Metal',
      3,
      false,
      NULL
    ),
    (
      (SELECT id FROM material_attr),
      'wood',
      'Wood',
      4,
      false,
      NULL
    ),
    (
      (SELECT id FROM material_attr),
      'fabric',
      'Fabric',
      5,
      false,
      NULL
    );
  `);

  // Insert sample attribute set
  pgm.sql(`
    WITH 
      electronics_type AS (SELECT id FROM "productType" WHERE slug = 'electronics')
    INSERT INTO product_attribute_set (
      name,
      code,
      description,
      productTypeId,
      isActive,
      isGlobal
    )
    VALUES (
      'Electronics Base',
      'electronics_base',
      'Base attribute set for electronic products',
      (SELECT id FROM electronics_type),
      true,
      true
    );
  `);

  // Insert sample attribute set mappings
  pgm.sql(`
    WITH 
      elec_set AS (SELECT id FROM product_attribute_set WHERE code = 'electronics_base'),
      color_attr AS (SELECT id FROM product_attribute WHERE code = 'color'),
      specs_attr AS (SELECT id FROM product_attribute WHERE code = 'specifications'),
      features_attr AS (SELECT id FROM product_attribute WHERE code = 'features'),
      warranty_attr AS (SELECT id FROM product_attribute WHERE code = 'warranty'),
      battery_attr AS (SELECT id FROM product_attribute WHERE code = 'battery_life')
    INSERT INTO product_attribute_set_mapping (
      attributeSetId,
      attributeId,
      position,
      isRequired
    )
    VALUES 
    (
      (SELECT id FROM elec_set),
      (SELECT id FROM color_attr),
      1,
      true
    ),
    (
      (SELECT id FROM elec_set),
      (SELECT id FROM specs_attr),
      2,
      true
    ),
    (
      (SELECT id FROM elec_set),
      (SELECT id FROM features_attr),
      3,
      true
    ),
    (
      (SELECT id FROM elec_set),
      (SELECT id FROM warranty_attr),
      4,
      false
    ),
    (
      (SELECT id FROM elec_set),
      (SELECT id FROM battery_attr),
      5,
      false
    );
  `);

  // Add attribute values to sample product
  pgm.sql(`
    WITH 
      sample_product AS (SELECT id FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1),
      color_attr AS (SELECT id FROM product_attribute WHERE code = 'color'),
      features_attr AS (SELECT id FROM product_attribute WHERE code = 'features'),
      battery_attr AS (SELECT id FROM product_attribute WHERE code = 'battery_life'),
      warranty_attr AS (SELECT id FROM product_attribute WHERE code = 'warranty'),
      specs_attr AS (SELECT id FROM product_attribute WHERE code = 'specifications')
    INSERT INTO product_attribute_value (
      productId,
      attributeId,
      value,
      valueText
    )
    VALUES 
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM features_attr),
      'Active Noise Cancellation, Bluetooth 5.2, Voice Assistant, Touch Controls, Ambient Mode',
      'Active Noise Cancellation, Bluetooth 5.2, Voice Assistant, Touch Controls, Ambient Mode'
    ),
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM battery_attr),
      '30',
      '30 hours'
    ),
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM warranty_attr),
      '24',
      '24 months'
    ),
    (
      (SELECT id FROM sample_product),
      (SELECT id FROM specs_attr),
      'Driver size: 40mm\nFrequency response: 20Hz - 20kHz\nBluetooth version: 5.2\nWater resistance: IPX4\nWeight: 250g',
      'Driver size: 40mm\nFrequency response: 20Hz - 20kHz\nBluetooth version: 5.2\nWater resistance: IPX4\nWeight: 250g'
    );
  `);

  // Add attribute values to sample product variants
  pgm.sql(`
    WITH 
      black_variant AS (SELECT id FROM "productVariant" WHERE sku = 'TG-BH-001-BLK' LIMIT 1),
      white_variant AS (SELECT id FROM "productVariant" WHERE sku = 'TG-BH-001-WHT' LIMIT 1),
      red_variant AS (SELECT id FROM "productVariant" WHERE sku = 'TG-BH-001-RED' LIMIT 1),
      color_attr AS (SELECT id FROM product_attribute WHERE code = 'color')
    INSERT INTO product_attribute_value (
      variantId,
      attributeId,
      value,
      valueText
    )
    VALUES 
    (
      (SELECT id FROM black_variant),
      (SELECT id FROM color_attr),
      'black',
      'Black'
    ),
    (
      (SELECT id FROM white_variant),
      (SELECT id FROM color_attr),
      'white',
      'White'
    ),
    (
      (SELECT id FROM red_variant),
      (SELECT id FROM color_attr),
      'red',
      'Red'
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable("product_attribute_value");
  pgm.dropTable("product_attribute_option");
  pgm.dropTable("product_attribute_set_mapping");
  pgm.dropTable("product_attribute_set");
  pgm.dropTable("product_attribute");
  pgm.dropTable("product_attribute_group");
};
