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
  // Create customer address table
  pgm.createTable("customer_address", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    first_name: { type: "varchar(100)" }, // Can differ from main customer record
    last_name: { type: "varchar(100)" }, // Can differ from main customer record
    company: { type: "varchar(255)" },
    address_line1: { type: "varchar(255)", notNull: true },
    address_line2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)" }, // State/province/region
    postal_code: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    phone: { type: "varchar(30)" },
    email: { type: "varchar(255)" },
    is_default: { type: "boolean", notNull: true, default: false }, // Is this the default address
    is_default_billing: { type: "boolean", notNull: true, default: false }, // Is this the default billing address
    is_default_shipping: { type: "boolean", notNull: true, default: false }, // Is this the default shipping address
    address_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "both", 
      check: "address_type IN ('billing', 'shipping', 'both')" 
    },
    is_verified: { type: "boolean", notNull: true, default: false }, // Has address been verified
    verified_at: { type: "timestamp" }, // When address was verified
    verification_data: { type: "jsonb" }, // Data from verification service
    additional_info: { type: "text" }, // Delivery instructions, etc.
    latitude: { type: "decimal(10,7)" }, // For geolocation
    longitude: { type: "decimal(10,7)" }, // For geolocation
    name: { type: "varchar(100)" }, // Optional nickname for the address (e.g., "Home", "Work")
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer addresses
  pgm.createIndex("customer_address", "customer_id");
  pgm.createIndex("customer_address", "country");
  pgm.createIndex("customer_address", "is_default");
  pgm.createIndex("customer_address", "is_default_billing");
  pgm.createIndex("customer_address", "is_default_shipping");
  pgm.createIndex("customer_address", "address_type");
  pgm.createIndex("customer_address", "is_verified");

  // Create constraints for default addresses (only one default per customer)
  pgm.createIndex("customer_address", ["customer_id", "is_default"], {
    unique: true,
    where: "is_default = true"
  });
  
  pgm.createIndex("customer_address", ["customer_id", "is_default_billing"], {
    unique: true,
    where: "is_default_billing = true"
  });
  
  pgm.createIndex("customer_address", ["customer_id", "is_default_shipping"], {
    unique: true,
    where: "is_default_shipping = true"
  });

  // Create customer contact table for additional contact methods
  pgm.createTable("customer_contact", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "type IN ('email', 'phone', 'mobile', 'fax', 'social', 'other')" 
    },
    value: { type: "varchar(255)", notNull: true }, // Email address, phone number, etc.
    label: { type: "varchar(50)" }, // "Home Phone", "Work Email", etc.
    is_default: { type: "boolean", notNull: true, default: false },
    is_verified: { type: "boolean", notNull: true, default: false },
    verified_at: { type: "timestamp" },
    verification_token: { type: "varchar(255)" },
    social_network: { type: "varchar(50)" }, // For social network contacts
    country_code: { type: "varchar(5)" }, // For phone numbers
    extension: { type: "varchar(20)" }, // For phone numbers
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer contacts
  pgm.createIndex("customer_contact", "customer_id");
  pgm.createIndex("customer_contact", "type");
  pgm.createIndex("customer_contact", "value");
  pgm.createIndex("customer_contact", "is_verified");
  pgm.createIndex("customer_contact", ["customer_id", "type", "value"], { unique: true });
  pgm.createIndex("customer_contact", ["customer_id", "type", "is_default"], {
    unique: true,
    where: "is_default = true"
  });

  // Create address validation history table
  pgm.createTable("address_validation_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    address_id: { type: "uuid", notNull: true, references: "customer_address", onDelete: "CASCADE" },
    service: { type: "varchar(50)", notNull: true }, // Validation service used
    request_data: { type: "jsonb" }, // Data sent to validation service
    response_data: { type: "jsonb" }, // Data received from validation service
    suggested: { type: "jsonb" }, // Suggested corrections
    valid: { type: "boolean" }, // Whether address was determined to be valid
    level: { type: "varchar(20)" }, // Validation level (verified, partial, etc.)
    message: { type: "text" }, // Human-readable validation message
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for address validation history
  pgm.createIndex("address_validation_history", "address_id");
  pgm.createIndex("address_validation_history", "service");
  pgm.createIndex("address_validation_history", "valid");
  pgm.createIndex("address_validation_history", "created_at");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("address_validation_history");
  pgm.dropTable("customer_contact");
  pgm.dropTable("customer_address");
};
