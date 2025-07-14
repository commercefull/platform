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
    first_name: { type: "varchar(100)" },
    last_name: { type: "varchar(100)" },
    password: { type: "varchar(255)", notNull: true }, // Hashed password using bcrypt
    phone: { type: "varchar(30)" },
    date_of_birth: { type: "date" },
    gender: { type: "varchar(20)" },
    avatar_url: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_verified: { type: "boolean", notNull: true, default: false },
    email_verified: { type: "boolean", notNull: true, default: false },
    phone_verified: { type: "boolean", notNull: true, default: false },
    last_login_at: { type: "timestamp" },
    failed_login_attempts: { type: "integer", notNull: true, default: 0 },
    locked_until: { type: "timestamp" }, // Account lockout time
    preferred_locale_id: { type: "uuid", references: "locale" },
    preferred_currency_id: { type: "uuid", references: "currency" },
    timezone: { type: "varchar(50)" },
    referral_source: { type: "varchar(100)" }, // How they found the store
    referral_code: { type: "varchar(50)" }, // Customer's personal referral code
    referred_by: { type: "uuid", references: "customer" }, // Which customer referred them
    accepts_marketing: { type: "boolean", notNull: true, default: false },
    marketing_preferences: { type: "jsonb" }, // Detailed marketing preferences
    metadata: { type: "jsonb" }, // Custom attributes/fields
    tags: { type: "text[]" }, // For customer categorization
    note: { type: "text" }, // Admin notes about customer
    external_id: { type: "varchar(100)" }, // ID in external system for integrations
    external_source: { type: "varchar(50)" }, // Source of external ID
    tax_exempt: { type: "boolean", notNull: true, default: false },
    tax_exemption_certificate: { type: "varchar(100)" },
    password_reset_token: { type: "varchar(255)" },
    password_reset_expires: { type: "timestamp" },
    verification_token: { type: "varchar(255)" },
    agree_to_terms: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for customer
  pgm.createIndex("customer", "email", { unique: true });
  pgm.createIndex("customer", "phone");
  pgm.createIndex("customer", "last_login_at");
  pgm.createIndex("customer", "is_active");
  pgm.createIndex("customer", "is_verified");
  pgm.createIndex("customer", "email_verified");
  pgm.createIndex("customer", "tags");
  pgm.createIndex("customer", "external_id");
  pgm.createIndex("customer", "referral_code", { unique: true, where: "referral_code IS NOT NULL" });
  pgm.createIndex("customer", "created_at");
  pgm.createIndex("customer", "deleted_at");

  // Create customer groups table
  pgm.createTable("customer_group", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    code: { type: "varchar(50)", notNull: true, unique: true },
    is_active: { type: "boolean", notNull: true, default: true },
    is_system: { type: "boolean", notNull: true, default: false }, // System groups cannot be deleted
    sort_order: { type: "integer", notNull: true, default: 0 },
    discount_percent: { type: "decimal(5,2)", default: 0 }, // Default discount for this group
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }, // Reference to admin user
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for customer groups
  pgm.createIndex("customer_group", "code");
  pgm.createIndex("customer_group", "is_active");
  pgm.createIndex("customer_group", "is_system");
  pgm.createIndex("customer_group", "deleted_at");

  // Create customer-group memberships table
  pgm.createTable("customer_group_membership", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    group_id: { type: "uuid", notNull: true, references: "customer_group", onDelete: "CASCADE" },
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    expires_at: { type: "timestamp" }, // For time-limited group memberships
    added_by: { type: "uuid" }, // Reference to admin user
    added_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    deleted_at: { type: "timestamp" }
  });

  // Create indexes for customer group memberships
  pgm.createIndex("customer_group_membership", "customer_id");
  pgm.createIndex("customer_group_membership", "group_id");
  pgm.createIndex("customer_group_membership", "is_active");
  pgm.createIndex("customer_group_membership", "expires_at");
  pgm.createIndex("customer_group_membership", "deleted_at");
  pgm.createConstraint("customer_group_membership", "customer_group_unique", {
    unique: ["customer_id", "group_id"]
  });

  // Create customer sessions table for tracking logged in sessions
  pgm.createTable("customer_session", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    token: { type: "varchar(255)", notNull: true },
    ip_address: { type: "varchar(45)" },
    user_agent: { type: "text" },
    device_info: { type: "jsonb" },
    expires_at: { type: "timestamp", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer sessions
  pgm.createIndex("customer_session", "customer_id");
  pgm.createIndex("customer_session", "token", { unique: true });
  pgm.createIndex("customer_session", "expires_at");
  pgm.createIndex("customer_session", "is_active");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("customer_session", { cascade: true });
  pgm.dropTable("customer_group_membership", { cascade: true });
  pgm.dropTable("customer_group", { cascade: true });
  pgm.dropTable("customer", { cascade: true });
};
