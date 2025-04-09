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
  // Create the customer table - central customer repository
  pgm.createTable("customer", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    email: { type: "varchar(255)", notNull: true },
    firstName: { type: "varchar(100)" },
    lastName: { type: "varchar(100)" },
    password: { type: "varchar(255)", notNull: true }, // Hashed password using bcrypt
    phone: { type: "varchar(30)" },
    dateOfBirth: { type: "date" },
    gender: { type: "varchar(20)" },
    avatarUrl: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    isVerified: { type: "boolean", notNull: true, default: false },
    emailVerified: { type: "boolean", notNull: true, default: false },
    phoneVerified: { type: "boolean", notNull: true, default: false },
    lastLoginAt: { type: "timestamp" },
    failedLoginAttempts: { type: "integer", notNull: true, default: 0 },
    lockedUntil: { type: "timestamp" }, // Account lockout time
    preferredLocaleId: { type: "uuid", references: "locale" },
    preferredCurrencyId: { type: "uuid", references: "currency" },
    timezone: { type: "varchar(50)" },
    referralSource: { type: "varchar(100)" }, // How they found the store
    referralCode: { type: "varchar(50)" }, // Customer's personal referral code
    referredBy: { type: "uuid", references: "customer" }, // Which customer referred them
    acceptsMarketing: { type: "boolean", notNull: true, default: false },
    marketingPreferences: { type: "jsonb" }, // Detailed marketing preferences
    metadata: { type: "jsonb" }, // Custom attributes/fields
    tags: { type: "text[]" }, // For customer categorization
    note: { type: "text" }, // Admin notes about customer
    externalId: { type: "varchar(100)" }, // ID in external system for integrations
    externalSource: { type: "varchar(50)" }, // Source of external ID
    taxExempt: { type: "boolean", notNull: true, default: false },
    taxExemptionCertificate: { type: "varchar(100)" },
    passwordResetToken: { type: "varchar(255)" },
    passwordResetExpires: { type: "timestamp" },
    verificationToken: { type: "varchar(255)" },
    agreeToTerms: { type: "boolean", notNull: true, default: false },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer
  pgm.createIndex("customer", "email", { unique: true });
  pgm.createIndex("customer", "phone");
  pgm.createIndex("customer", "lastLoginAt");
  pgm.createIndex("customer", "isActive");
  pgm.createIndex("customer", "isVerified");
  pgm.createIndex("customer", "emailVerified");
  pgm.createIndex("customer", "tags");
  pgm.createIndex("customer", "externalId");
  pgm.createIndex("customer", "referralCode", { unique: true, where: "referralCode IS NOT NULL" });
  pgm.createIndex("customer", "createdAt");

  // Create customer groups table
  pgm.createTable("customer_group", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    code: { type: "varchar(50)", notNull: true, unique: true },
    isActive: { type: "boolean", notNull: true, default: true },
    isSystem: { type: "boolean", notNull: true, default: false }, // System groups cannot be deleted
    sortOrder: { type: "integer", notNull: true, default: 0 },
    discountPercent: { type: "decimal(5,2)", default: 0 }, // Default discount for this group
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" } // Reference to admin user
  });

  // Create indexes for customer groups
  pgm.createIndex("customer_group", "code");
  pgm.createIndex("customer_group", "isActive");
  pgm.createIndex("customer_group", "isSystem");

  // Create customer-group memberships table
  pgm.createTable("customer_group_membership", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    groupId: { type: "uuid", notNull: true, references: "customer_group", onDelete: "CASCADE" },
    isActive: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    expiresAt: { type: "timestamp" }, // For time-limited group memberships
    addedBy: { type: "uuid" }, // Reference to admin user
    addedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer group memberships
  pgm.createIndex("customer_group_membership", "customerId");
  pgm.createIndex("customer_group_membership", "groupId");
  pgm.createIndex("customer_group_membership", "isActive");
  pgm.createIndex("customer_group_membership", "expiresAt");
  pgm.createIndex("customer_group_membership", ["customerId", "groupId"], { unique: true });

  // Insert default customer groups
  pgm.sql(`
    INSERT INTO "customer_group" (name, description, code, isActive, isSystem, sortOrder)
    VALUES 
      ('General', 'Default customer group', 'general', true, true, 0),
      ('VIP', 'Premium customers', 'vip', true, true, 10),
      ('Wholesale', 'Wholesale customers', 'wholesale', true, true, 20),
      ('Staff', 'Employee discount group', 'staff', true, true, 30),
      ('Newsletter', 'Newsletter subscribers', 'newsletter', true, true, 40)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("customer_group_membership");
  pgm.dropTable("customer_group");
  pgm.dropTable("customer");
};
