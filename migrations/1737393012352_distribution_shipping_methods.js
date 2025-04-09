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
    websiteUrl: { type: "text" },
    trackingUrl: { type: "text" }, // URL pattern for tracking (with placeholder)
    isActive: { type: "boolean", notNull: true, default: true },
    accountNumber: { type: "varchar(100)" }, // Account number with carrier
    apiCredentials: { type: "jsonb" }, // Integration credentials
    supportedRegions: { type: "jsonb" }, // Regions where carrier operates
    supportedServices: { type: "jsonb" }, // Services offered by carrier
    requiresContract: { type: "boolean", notNull: true, default: false },
    hasApiIntegration: { type: "boolean", notNull: true, default: false }, // Whether carrier has API integration
    customFields: { type: "jsonb" }, // Carrier-specific fields
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for shipping carriers
  pgm.createIndex("shipping_carrier", "code");
  pgm.createIndex("shipping_carrier", "isActive");
  pgm.createIndex("shipping_carrier", "hasApiIntegration");

  // Create shipping methods table
  pgm.createTable("shipping_method", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    carrierId: { type: "uuid", references: "shipping_carrier" },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true, unique: true }, // Method code
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    isDefault: { type: "boolean", notNull: true, default: false }, // Is this the default method
    serviceCode: { type: "varchar(50)" }, // Carrier-specific service code
    domesticInternational: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'both', 
      check: "domesticInternational IN ('domestic', 'international', 'both')" 
    },
    estimatedDeliveryDays: { type: "jsonb" }, // Min/max days by region
    handlingDays: { type: "integer", default: 1 }, // Days to handle before shipping
    priority: { type: "integer", default: 0 }, // Display order
    displayOnFrontend: { type: "boolean", notNull: true, default: true },
    allowFreeShipping: { type: "boolean", notNull: true, default: true }, // Can be used for free shipping
    minWeight: { type: "decimal(10,2)" }, // Minimum allowed weight
    maxWeight: { type: "decimal(10,2)" }, // Maximum allowed weight
    minOrderValue: { type: "decimal(10,2)" }, // Minimum order value for this method
    maxOrderValue: { type: "decimal(10,2)" }, // Maximum order value for this method
    dimensionRestrictions: { type: "jsonb" }, // Max dimensions allowed
    shippingClass: { type: "varchar(50)" }, // Classification for rule matching
    customFields: { type: "jsonb" }, // Method-specific fields
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for shipping methods
  pgm.createIndex("shipping_method", "carrierId");
  pgm.createIndex("shipping_method", "code");
  pgm.createIndex("shipping_method", "isActive");
  pgm.createIndex("shipping_method", "isDefault");
  pgm.createIndex("shipping_method", "domesticInternational");
  pgm.createIndex("shipping_method", "displayOnFrontend");
  pgm.createIndex("shipping_method", "priority");
  pgm.createIndex("shipping_method", "shippingClass");

  // Only one default shipping method is allowed
  pgm.createIndex("shipping_method", "isDefault", { 
    unique: true,
    where: "isDefault = true"
  });

  // Create shipping zones table
  pgm.createTable("shipping_zone", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    priority: { type: "integer", default: 0 }, // For resolving zone conflicts
    locationType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'country', 
      check: "locationType IN ('country', 'state', 'zipcode', 'region', 'continent')" 
    },
    locations: { type: "jsonb", notNull: true }, // Array of location identifiers
    excludedLocations: { type: "jsonb" }, // Array of excluded locations within the zone
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for shipping zones
  pgm.createIndex("shipping_zone", "name");
  pgm.createIndex("shipping_zone", "isActive");
  pgm.createIndex("shipping_zone", "priority");
  pgm.createIndex("shipping_zone", "locationType");

  // Create shipping rates table
  pgm.createTable("shipping_rate", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    zoneId: { type: "uuid", notNull: true, references: "shipping_zone", onDelete: "CASCADE" },
    methodId: { type: "uuid", notNull: true, references: "shipping_method", onDelete: "CASCADE" },
    name: { type: "varchar(100)" }, // Optional custom name for this rate
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    rateType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "rateType IN ('flat', 'weight_based', 'price_based', 'item_based', 'dimensional', 'calculated', 'free')" 
    },
    baseRate: { type: "decimal(10,2)", notNull: true }, // Base shipping cost
    perItemRate: { type: "decimal(10,2)", default: 0 }, // Additional cost per item
    freeThreshold: { type: "decimal(10,2)" }, // Order value for free shipping
    rateMatrix: { type: "jsonb" }, // For weight/price based tiers
    minRate: { type: "decimal(10,2)" }, // Minimum rate regardless of calculation
    maxRate: { type: "decimal(10,2)" }, // Maximum rate regardless of calculation
    currency: { type: "varchar(3)", notNull: true, default: 'USD' }, // Rate currency
    taxable: { type: "boolean", notNull: true, default: true }, // Whether shipping is taxable
    priority: { type: "integer", default: 0 }, // For ordering multiple rates
    validFrom: { type: "timestamp" }, // Optional validity period
    validTo: { type: "timestamp" }, // Optional validity period
    conditions: { type: "jsonb" }, // Conditional logic for rate availability
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for shipping rates
  pgm.createIndex("shipping_rate", "zoneId");
  pgm.createIndex("shipping_rate", "methodId");
  pgm.createIndex("shipping_rate", "isActive");
  pgm.createIndex("shipping_rate", "rateType");
  pgm.createIndex("shipping_rate", "priority");
  pgm.createIndex("shipping_rate", "currency");
  pgm.createIndex("shipping_rate", "validFrom");
  pgm.createIndex("shipping_rate", "validTo");
  pgm.createIndex("shipping_rate", ["zoneId", "methodId"], { unique: true });

  // Create packaging types table
  pgm.createTable("packaging_type", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true, unique: true },
    description: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    isDefault: { type: "boolean", notNull: true, default: false },
    weight: { type: "decimal(10,2)", notNull: true, default: 0 }, // Package weight (kg)
    length: { type: "decimal(10,2)", notNull: true }, // Length (cm)
    width: { type: "decimal(10,2)", notNull: true }, // Width (cm)
    height: { type: "decimal(10,2)", notNull: true }, // Height (cm)
    volume: { 
      type: "decimal(10,2)", 
      notNull: true,
      check: "volume = length * width * height / 1000" // Volume in liters
    },
    maxWeight: { type: "decimal(10,2)" }, // Maximum content weight
    maxItems: { type: "integer" }, // Maximum number of items
    cost: { type: "decimal(10,2)" }, // Cost of packaging
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    recyclable: { type: "boolean", notNull: true, default: false },
    imageUrl: { type: "text" },
    validCarriers: { type: "text[]" }, // Compatible carriers
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for packaging types
  pgm.createIndex("packaging_type", "code");
  pgm.createIndex("packaging_type", "isActive");
  pgm.createIndex("packaging_type", "isDefault");
  pgm.createIndex("packaging_type", "volume");
  pgm.createIndex("packaging_type", "maxWeight");

  // Only one default packaging type is allowed
  pgm.createIndex("packaging_type", "isDefault", { 
    unique: true,
    where: "isDefault = true"
  });

  // Insert default shipping carriers
  pgm.sql(`
    INSERT INTO "shipping_carrier" (name, code, description, trackingUrl, isActive)
    VALUES 
      ('UPS', 'UPS', 'United Parcel Service', 'https://www.ups.com/track?tracknum={tracking_number}', true),
      ('FedEx', 'FEDEX', 'Federal Express', 'https://www.fedex.com/apps/fedextrack/?tracknumbers={tracking_number}', true),
      ('USPS', 'USPS', 'United States Postal Service', 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}', true),
      ('DHL', 'DHL', 'DHL Express', 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}', true),
      ('Custom', 'CUSTOM', 'Custom or manual shipping methods', '', true)
  `);

  // Insert default shipping methods
  pgm.sql(`
    INSERT INTO "shipping_method" (name, code, description, isActive, isDefault, domesticInternational, estimatedDeliveryDays, priority)
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
      isActive, 
      priority, 
      locationType,
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
      isActive, 
      priority, 
      locationType,
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
      zoneId, 
      methodId, 
      isActive, 
      rateType,
      baseRate,
      perItemRate,
      freeThreshold,
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
      isActive, 
      isDefault,
      weight,
      length,
      width,
      height,
      volume,
      maxWeight,
      recyclable
    )
    VALUES 
      ('Small Box', 'BOX_S', 'Small shipping box', true, false, 0.2, 20, 15, 10, 3, 2, true),
      ('Medium Box', 'BOX_M', 'Medium shipping box', true, true, 0.3, 30, 20, 15, 9, 5, true),
      ('Large Box', 'BOX_L', 'Large shipping box', true, false, 0.4, 40, 30, 20, 24, 10, true),
      ('Envelope', 'ENVELOPE', 'Shipping envelope for documents', true, false, 0.05, 30, 22, 1, 0.66, 0.5, true),
      ('Poly Bag', 'POLY', 'Plastic poly bag for soft items', true, false, 0.1, 35, 25, 5, 4.375, 3, false)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("shipping_rate");
  pgm.dropTable("shipping_zone");
  pgm.dropTable("packaging_type");
  pgm.dropTable("shipping_method");
  pgm.dropTable("shipping_carrier");
};
