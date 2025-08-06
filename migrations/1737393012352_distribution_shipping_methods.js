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
  // Create shipping carriers table
  pgm.createTable("shipping_carrier", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true, unique: true }, // Carrier code
    description: { type: "text" },
    website_url: { type: "text" },
    tracking_url: { type: "text" }, // URL pattern for tracking (with placeholder)
    is_active: { type: "boolean", notNull: true, default: true },
    account_number: { type: "varchar(100)" }, // Account number with carrier
    api_credentials: { type: "jsonb" }, // Integration credentials
    supported_regions: { type: "jsonb" }, // Regions where carrier operates
    supported_services: { type: "jsonb" }, // Services offered by carrier
    requires_contract: { type: "boolean", notNull: true, default: false },
    has_api_integration: { type: "boolean", notNull: true, default: false }, // Whether carrier has API integration
    custom_fields: { type: "jsonb" }, // Carrier-specific fields
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for shipping carriers
  pgm.createIndex("shipping_carrier", "code");
  pgm.createIndex("shipping_carrier", "is_active");
  pgm.createIndex("shipping_carrier", "has_api_integration");

  // Create shipping methods table
  pgm.createTable("shipping_method", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    carrier_id: { type: "uuid", references: "shipping_carrier" },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true, unique: true }, // Method code
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_default: { type: "boolean", notNull: true, default: false }, // Is this the default method
    service_code: { type: "varchar(50)" }, // Carrier-specific service code
    domestic_international: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'both', 
      check: "domestic_international IN ('domestic', 'international', 'both')" 
    },
    estimated_delivery_days: { type: "jsonb" }, // Min/max days by region
    handling_days: { type: "integer", default: 1 }, // Days to handle before shipping
    priority: { type: "integer", default: 0 }, // Display order
    display_on_frontend: { type: "boolean", notNull: true, default: true },
    allow_free_shipping: { type: "boolean", notNull: true, default: true }, // Can be used for free shipping
    min_weight: { type: "decimal(10,2)" }, // Minimum allowed weight
    max_weight: { type: "decimal(10,2)" }, // Maximum allowed weight
    min_order_value: { type: "decimal(10,2)" }, // Minimum order value for this method
    max_order_value: { type: "decimal(10,2)" }, // Maximum order value for this method
    dimension_restrictions: { type: "jsonb" }, // Max dimensions allowed
    shipping_class: { type: "varchar(50)" }, // Classification for rule matching
    custom_fields: { type: "jsonb" }, // Method-specific fields
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for shipping methods
  pgm.createIndex("shipping_method", "carrier_id");
  pgm.createIndex("shipping_method", "code");
  pgm.createIndex("shipping_method", "is_active");
  pgm.createIndex("shipping_method", "is_default");
  pgm.createIndex("shipping_method", "domestic_international");
  pgm.createIndex("shipping_method", "display_on_frontend");
  pgm.createIndex("shipping_method", "priority");
  pgm.createIndex("shipping_method", "shipping_class");

  // Only one default shipping method is allowed
  pgm.createIndex("shipping_method", "is_default", { 
    unique: true,
    where: "is_default = true"
  });

  // Create shipping zones table
  pgm.createTable("shipping_zone", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // For resolving zone conflicts
    location_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'country', 
      check: "location_type IN ('country', 'state', 'zipcode', 'region', 'continent')" 
    },
    locations: { type: "jsonb", notNull: true }, // Array of location identifiers
    excluded_locations: { type: "jsonb" }, // Array of excluded locations within the zone
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for shipping zones
  pgm.createIndex("shipping_zone", "name");
  pgm.createIndex("shipping_zone", "is_active");
  pgm.createIndex("shipping_zone", "priority");
  pgm.createIndex("shipping_zone", "location_type");

  // Create shipping rates table
  pgm.createTable("shipping_rate", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    zone_id: { type: "uuid", notNull: true, references: "shipping_zone", onDelete: "CASCADE" },
    method_id: { type: "uuid", notNull: true, references: "shipping_method", onDelete: "CASCADE" },
    name: { type: "varchar(100)" }, // Optional custom name for this rate
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    rate_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "rate_type IN ('flat', 'weight_based', 'price_based', 'item_based', 'dimensional', 'calculated', 'free')" 
    },
    base_rate: { type: "decimal(10,2)", notNull: true }, // Base shipping cost
    per_item_rate: { type: "decimal(10,2)", default: 0 }, // Additional cost per item
    free_threshold: { type: "decimal(10,2)" }, // Order value for free shipping
    rate_matrix: { type: "jsonb" }, // For weight/price based tiers
    min_rate: { type: "decimal(10,2)" }, // Minimum rate regardless of calculation
    max_rate: { type: "decimal(10,2)" }, // Maximum rate regardless of calculation
    currency: { type: "varchar(3)", notNull: true, default: 'USD' }, // Rate currency
    taxable: { type: "boolean", notNull: true, default: true }, // Whether shipping is taxable
    priority: { type: "integer", default: 0 }, // For ordering multiple rates
    valid_from: { type: "timestamp" }, // Optional validity period
    valid_to: { type: "timestamp" }, // Optional validity period
    conditions: { type: "jsonb" }, // Conditional logic for rate availability
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for shipping rates
  pgm.createIndex("shipping_rate", "zone_id");
  pgm.createIndex("shipping_rate", "method_id");
  pgm.createIndex("shipping_rate", "is_active");
  pgm.createIndex("shipping_rate", "rate_type");
  pgm.createIndex("shipping_rate", "priority");
  pgm.createIndex("shipping_rate", "currency");
  pgm.createIndex("shipping_rate", "valid_from");
  pgm.createIndex("shipping_rate", "valid_to");
  pgm.createIndex("shipping_rate", ["zone_id", "method_id"], { unique: true });

  // Create packaging types table
  pgm.createTable("packaging_type", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true, unique: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_default: { type: "boolean", notNull: true, default: false },
    weight: { type: "decimal(10,2)", notNull: true, default: 0 }, // Package weight (kg)
    length: { type: "decimal(10,2)", notNull: true }, // Length (cm)
    width: { type: "decimal(10,2)", notNull: true }, // Width (cm)
    height: { type: "decimal(10,2)", notNull: true }, // Height (cm)
    volume: { type: "decimal(10,2)", notNull: true },
    max_weight: { type: "decimal(10,2)" }, // Maximum content weight
    max_items: { type: "integer" }, // Maximum number of items
    cost: { type: "decimal(10,2)" }, // Cost of packaging
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    recyclable: { type: "boolean", notNull: true, default: false },
    image_url: { type: "text" },
    valid_carriers: { type: "text[]" }, // Compatible carriers
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for packaging types
  pgm.createIndex("packaging_type", "code");
  pgm.createIndex("packaging_type", "is_active");
  pgm.createIndex("packaging_type", "is_default");
  pgm.createIndex("packaging_type", "volume");
  pgm.createIndex("packaging_type", "max_weight");

  // Only one default packaging type is allowed
  pgm.createIndex("packaging_type", "is_default", { 
    unique: true,
    where: "is_default = true"
  });

  // Create distribution shipping methods table
  pgm.createTable("distribution_shipping_method", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    description: { type: "text" },
    carrier: { type: "varchar(50)" }, // Carrier name (e.g., 'UPS', 'FedEx', 'USPS')
    service_code: { type: "varchar(50)" }, // Carrier service code (e.g., '03' for UPS Ground)
    shipping_zone_id: { type: "uuid", references: "shipping_zone" }, // Zone this method applies to
    base_rate: { type: "decimal(15,2)", notNull: true, default: 0 }, // Base shipping rate
    rate_calculation: { type: "jsonb" }, // JSON for complex rate calculations
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for distribution shipping methods
  pgm.createIndex("distribution_shipping_method", "code", { unique: true });
  pgm.createIndex("distribution_shipping_method", "shipping_zone_id");
  pgm.createIndex("distribution_shipping_method", "is_active");

  // Insert default shipping carriers
  pgm.sql(`
    INSERT INTO "shipping_carrier" (name, code, description, tracking_url, is_active)
    VALUES 
      ('UPS', 'UPS', 'United Parcel Service', 'https://www.ups.com/track?tracknum={tracking_number}', true),
      ('FedEx', 'FEDEX', 'Federal Express', 'https://www.fedex.com/apps/fedextrack/?tracknumbers={tracking_number}', true),
      ('USPS', 'USPS', 'United States Postal Service', 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}', true),
      ('DHL', 'DHL', 'DHL Express', 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}', true),
      ('Custom', 'CUSTOM', 'Custom or manual shipping methods', '', true)
  `);

  // Insert default shipping methods
  pgm.sql(`
    INSERT INTO "shipping_method" (name, code, description, is_active, is_default, domestic_international, estimated_delivery_days, priority)
    VALUES 
      ('Standard Shipping', 'STANDARD', 'Standard shipping option (3-5 business days)', true, true, 'both', '{"min": 3, "max": 5}', 10),
      ('Express Shipping', 'EXPRESS', 'Express shipping option (1-2 business days)', true, false, 'both', '{"min": 1, "max": 2}', 20),
      ('Free Shipping', 'FREE', 'Free shipping on qualifying orders', true, false, 'domestic', '{"min": 3, "max": 7}', 5),
      ('In-Store Pickup', 'PICKUP', 'Pickup at store location', true, false, 'domestic', '{"min": 0, "max": 1}', 30),
      ('International Standard', 'INTL_STD', 'International standard shipping (7-14 business days)', true, false, 'international', '{"min": 7, "max": 14}', 40),
      ('International Express', 'INTL_EXP', 'International express shipping (3-5 business days)', true, false, 'international', '{"min": 3, "max": 5}', 50)
  `);

  // Insert default worldwide shipping zone
  pgm.sql(`
    INSERT INTO "shipping_zone" (
      name, 
      description, 
      is_active, 
      priority, 
      location_type,
      locations
    )
    VALUES (
      'Worldwide', 
      'Default shipping zone covering all locations', 
      true,
      0,
      'country',
      '["*"]'
    )
  `);

  // Insert default domestic (US) shipping zone
  pgm.sql(`
    INSERT INTO "shipping_zone" (
      name, 
      description, 
      is_active, 
      priority, 
      location_type,
      locations
    )
    VALUES (
      'United States', 
      'Shipping within the United States', 
      true,
      10,
      'country',
      '["US"]'
    )
  `);

  // Insert default shipping rates for US
  pgm.sql(`
    WITH us_zone AS (SELECT id FROM shipping_zone WHERE name = 'United States'),
         standard_method AS (SELECT id FROM shipping_method WHERE code = 'STANDARD'),
         express_method AS (SELECT id FROM shipping_method WHERE code = 'EXPRESS'),
         free_method AS (SELECT id FROM shipping_method WHERE code = 'FREE')
    INSERT INTO "shipping_rate" (
      zone_id, 
      method_id, 
      is_active, 
      rate_type,
      base_rate,
      per_item_rate,
      free_threshold,
      currency
    )
    VALUES 
      ((SELECT id FROM us_zone), (SELECT id FROM standard_method), true, 'flat', 5.99, 0.99, NULL, 'USD'),
      ((SELECT id FROM us_zone), (SELECT id FROM express_method), true, 'flat', 14.99, 1.99, NULL, 'USD'),
      ((SELECT id FROM us_zone), (SELECT id FROM free_method), true, 'free', 0, 0, 50.00, 'USD')
  `);

  // Insert default packaging types
  pgm.sql(`
    INSERT INTO "packaging_type" (
      name, 
      code, 
      description, 
      is_active, 
      is_default,
      weight,
      length,
      width,
      height,
      volume,
      max_weight,
      recyclable,
      cost,
      currency,
      created_by,
      valid_carriers,
      metadata,
      image_url
    )
    VALUES 
      ('Small Box', 'BOX_S', 'Small shipping box', true, false, 0.2, 20, 15, 10, 3, 2, true, 0.5, 'USD', '00000000-0000-0000-0000-000000000000', '{}', '{}', ''),
      ('Medium Box', 'BOX_M', 'Medium shipping box', true, true, 0.3, 30, 20, 15, 9, 5, true, 1.0, 'USD', '00000000-0000-0000-0000-000000000000', '{}', '{}', ''),
      ('Large Box', 'BOX_L', 'Large shipping box', true, false, 0.4, 40, 30, 20, 24, 10, true, 1.5, 'USD', '00000000-0000-0000-0000-000000000000', '{}', '{}', ''),
      ('Envelope', 'ENVELOPE', 'Shipping envelope for documents', true, false, 0.05, 30, 22, 1, 0.66, 0.5, true, 0.2, 'USD', '00000000-0000-0000-0000-000000000000', '{}', '{}', ''),
      ('Poly Bag', 'POLY', 'Plastic poly bag for soft items', true, false, 0.1, 35, 25, 5, 43.75, 3, false, 0.1, 'USD', '00000000-0000-0000-0000-000000000000', '{}', '{}', '')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("distribution_shipping_method");
  pgm.dropTable("shipping_rate");
  pgm.dropTable("shipping_zone");
  pgm.dropTable("packaging_type");
  pgm.dropTable("shipping_method");
  pgm.dropTable("shipping_carrier");
};
