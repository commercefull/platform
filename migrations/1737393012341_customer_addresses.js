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
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    firstName: { type: "varchar(100)" }, // Can differ from main customer record
    lastName: { type: "varchar(100)" }, // Can differ from main customer record
    company: { type: "varchar(255)" },
    addressLine1: { type: "varchar(255)", notNull: true },
    addressLine2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)" }, // State/province/region
    postalCode: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    phone: { type: "varchar(30)" },
    email: { type: "varchar(255)" },
    isDefault: { type: "boolean", notNull: true, default: false }, // Is this the default address
    isDefaultBilling: { type: "boolean", notNull: true, default: false }, // Is this the default billing address
    isDefaultShipping: { type: "boolean", notNull: true, default: false }, // Is this the default shipping address
    addressType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: "both", 
      check: "addressType IN ('billing', 'shipping', 'both')" 
    },
    isVerified: { type: "boolean", notNull: true, default: false }, // Has address been verified
    verifiedAt: { type: "timestamp" }, // When address was verified
    verificationData: { type: "jsonb" }, // Data from verification service
    additionalInfo: { type: "text" }, // Delivery instructions, etc.
    latitude: { type: "decimal(10,7)" }, // For geolocation
    longitude: { type: "decimal(10,7)" }, // For geolocation
    name: { type: "varchar(100)" }, // Optional nickname for the address (e.g., "Home", "Work")
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer addresses
  pgm.createIndex("customer_address", "customerId");
  pgm.createIndex("customer_address", "country");
  pgm.createIndex("customer_address", "isDefault");
  pgm.createIndex("customer_address", "isDefaultBilling");
  pgm.createIndex("customer_address", "isDefaultShipping");
  pgm.createIndex("customer_address", "addressType");
  pgm.createIndex("customer_address", "isVerified");

  // Create constraints for default addresses (only one default per customer)
  pgm.createIndex("customer_address", ["customerId", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });
  
  pgm.createIndex("customer_address", ["customerId", "isDefaultBilling"], {
    unique: true,
    where: "isDefaultBilling = true"
  });
  
  pgm.createIndex("customer_address", ["customerId", "isDefaultShipping"], {
    unique: true,
    where: "isDefaultShipping = true"
  });

  // Create customer contact table for additional contact methods
  pgm.createTable("customer_contact", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "type IN ('email', 'phone', 'mobile', 'fax', 'social', 'other')" 
    },
    value: { type: "varchar(255)", notNull: true }, // Email address, phone number, etc.
    label: { type: "varchar(50)" }, // "Home Phone", "Work Email", etc.
    isDefault: { type: "boolean", notNull: true, default: false },
    isVerified: { type: "boolean", notNull: true, default: false },
    verifiedAt: { type: "timestamp" },
    verificationToken: { type: "varchar(255)" },
    socialNetwork: { type: "varchar(50)" }, // For social network contacts
    countryCode: { type: "varchar(5)" }, // For phone numbers
    extension: { type: "varchar(20)" }, // For phone numbers
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer contacts
  pgm.createIndex("customer_contact", "customerId");
  pgm.createIndex("customer_contact", "type");
  pgm.createIndex("customer_contact", "value");
  pgm.createIndex("customer_contact", "isVerified");
  pgm.createIndex("customer_contact", ["customerId", "type", "value"], { unique: true });
  pgm.createIndex("customer_contact", ["customerId", "type", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Create address validation history table
  pgm.createTable("address_validation_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    addressId: { type: "uuid", notNull: true, references: "customer_address", onDelete: "CASCADE" },
    service: { type: "varchar(50)", notNull: true }, // Validation service used
    requestData: { type: "jsonb" }, // Data sent to validation service
    responseData: { type: "jsonb" }, // Data received from validation service
    suggested: { type: "jsonb" }, // Suggested corrections
    valid: { type: "boolean" }, // Whether address was determined to be valid
    level: { type: "varchar(20)" }, // Validation level (verified, partial, etc.)
    message: { type: "text" }, // Human-readable validation message
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for address validation history
  pgm.createIndex("address_validation_history", "addressId");
  pgm.createIndex("address_validation_history", "service");
  pgm.createIndex("address_validation_history", "valid");
  pgm.createIndex("address_validation_history", "createdAt");
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
