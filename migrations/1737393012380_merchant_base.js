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
  // Create merchant table
  pgm.createTable("merchant", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    slug: { type: "varchar(150)", notNull: true, unique: true },
    description: { type: "text" },
    email: { type: "varchar(255)", notNull: true },
    phone: { type: "varchar(30)" },
    password: { type: "varchar(255)", notNull: true }, // Hashed password
    website: { type: "varchar(255)" },
    logo: { type: "text" },
    banner_image: { type: "text" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'active', 'suspended', 'inactive', 'rejected')" 
    },
    verification_status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'unverified',
      check: "verification_status IN ('unverified', 'in_progress', 'verified', 'rejected')" 
    },
    verified_at: { type: "timestamp" },
    verified_by: { type: "uuid" },
    verification_notes: { type: "text" },
    business_type: { 
      type: "varchar(50)", 
      check: "business_type IN ('individual', 'sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit')" 
    },
    year_established: { type: "integer" },
    employee_count: { type: "integer" },
    tax_id_number: { type: "varchar(50)" }, // Business tax ID (encrypted)
    legal_name: { type: "varchar(100)" }, // Legal business name
    social_links: { type: "jsonb" }, // Social media links
    meta_title: { type: "varchar(255)" },
    meta_description: { type: "text" },
    meta_keywords: { type: "text" },
    commission_rate: { type: "decimal(5,2)" }, // Platform commission percentage
    commission_type: { 
      type: "varchar(20)", 
      default: 'percentage',
      check: "commission_type IN ('percentage', 'flat', 'tiered')" 
    },
    commission_tiers: { type: "jsonb" }, // For tiered commission structure
    minimum_payout_amount: { type: "decimal(10,2)", default: 50.00 },
    payout_schedule: { 
      type: "varchar(20)", 
      default: 'monthly',
      check: "payout_schedule IN ('weekly', 'biweekly', 'monthly', 'quarterly')" 
    },
    auto_approve_products: { type: "boolean", notNull: true, default: false },
    auto_approve_reviews: { type: "boolean", notNull: true, default: false },
    seller_rating: { type: "decimal(3,2)" }, // Average rating
    featured_merchant: { type: "boolean", notNull: true, default: false },
    store_policies: { type: "jsonb" }, // Return policy, shipping policy, etc.
    notification_preferences: { type: "jsonb" },
    allowed_categories: { type: "uuid[]" }, // Categories merchant can sell in
    notes: { type: "text" }, // Internal admin notes
    custom_fields: { type: "jsonb" },
    metadata: { type: "jsonb" },
    last_login_at: { type: "timestamp" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_by: { type: "uuid" }
  });

  // Create indexes for merchants
  pgm.createIndex("merchant", "name");
  pgm.createIndex("merchant", "slug");
  pgm.createIndex("merchant", "email", { unique: true });
  pgm.createIndex("merchant", "status");
  pgm.createIndex("merchant", "verification_status");
  pgm.createIndex("merchant", "business_type");
  pgm.createIndex("merchant", "commission_rate");
  pgm.createIndex("merchant", "featured_merchant");
  pgm.createIndex("merchant", "seller_rating");
  pgm.createIndex("merchant", "last_login_at");
  pgm.createIndex("merchant", "created_at");
  pgm.createIndex("merchant", "allowed_categories", { method: "gin" });

  // Create merchant address table
  pgm.createTable("merchant_address", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    address_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "address_type IN ('billing', 'shipping', 'business', 'warehouse', 'returns')" 
    },
    is_default: { type: "boolean", notNull: true, default: false },
    first_name: { type: "varchar(100)" },
    last_name: { type: "varchar(100)" },
    company: { type: "varchar(100)" },
    address_line1: { type: "varchar(255)", notNull: true },
    address_line2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)", notNull: true },
    postal_code: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    phone: { type: "varchar(30)" },
    email: { type: "varchar(255)" },
    is_verified: { type: "boolean", notNull: true, default: false },
    verified_at: { type: "timestamp" },
    latitude: { type: "decimal(10,7)" },
    longitude: { type: "decimal(10,7)" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant addresses
  pgm.createIndex("merchant_address", "merchant_id");
  pgm.createIndex("merchant_address", "address_type");
  pgm.createIndex("merchant_address", "is_default");
  pgm.createIndex("merchant_address", "city");
  pgm.createIndex("merchant_address", "state");
  pgm.createIndex("merchant_address", "postal_code");
  pgm.createIndex("merchant_address", "country");
  pgm.createIndex("merchant_address", "is_verified");
  pgm.createIndex("merchant_address", ["merchant_id", "address_type", "is_default"], {
    unique: true,
    where: "is_default = true"
  });

  // Create merchant contacts table
  pgm.createTable("merchant_contact", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    first_name: { type: "varchar(100)", notNull: true },
    last_name: { type: "varchar(100)", notNull: true },
    email: { type: "varchar(255)", notNull: true },
    phone: { type: "varchar(30)" },
    job_title: { type: "varchar(100)" },
    is_primary: { type: "boolean", notNull: true, default: false },
    department: { 
      type: "varchar(50)", 
      default: 'general',
      check: "department IN ('general', 'sales', 'support', 'billing', 'technical', 'logistics', 'returns')" 
    },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant contacts
  pgm.createIndex("merchant_contact", "merchant_id");
  pgm.createIndex("merchant_contact", "email");
  pgm.createIndex("merchant_contact", "is_primary");
  pgm.createIndex("merchant_contact", "department");
  pgm.createIndex("merchant_contact", ["merchant_id", "is_primary"], {
    unique: true,
    where: "is_primary = true"
  });

  // Create merchant payment info table
  pgm.createTable("merchant_payment_info", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    payment_type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "payment_type IN ('bank_account', 'paypal', 'stripe', 'venmo', 'other')" 
    },
    is_default: { type: "boolean", notNull: true, default: false },
    account_holder_name: { type: "varchar(100)" },
    bank_name: { type: "varchar(100)" },
    account_number: { type: "varchar(255)" }, // Encrypted
    routing_number: { type: "varchar(255)" }, // Encrypted
    account_type: { type: "varchar(20)" }, // Checking, savings, etc.
    paypal_email: { type: "varchar(255)" },
    provider_id: { type: "varchar(255)" }, // ID with external payment provider
    provider_data: { type: "jsonb" }, // Additional data from provider
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    is_verified: { type: "boolean", notNull: true, default: false },
    verified_at: { type: "timestamp" },
    last_payout_date: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for merchant payment info
  pgm.createIndex("merchant_payment_info", "merchant_id");
  pgm.createIndex("merchant_payment_info", "payment_type");
  pgm.createIndex("merchant_payment_info", "is_default");
  pgm.createIndex("merchant_payment_info", "is_verified");
  pgm.createIndex("merchant_payment_info", "provider_id");
  pgm.createIndex("merchant_payment_info", "last_payout_date");
  pgm.createIndex("merchant_payment_info", ["merchant_id", "is_default"], {
    unique: true,
    where: "is_default = true"
  });

  // Create merchant verification document table
  pgm.createTable("merchant_verification_document", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchant_id: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    document_type: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "document_type IN ('business_license', 'tax_id', 'id_proof', 'address_proof', 'bank_statement', 'other')" 
    },
    document_name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    file_url: { type: "text", notNull: true },
    file_type: { type: "varchar(50)" }, // MIME type
    file_size: { type: "integer" }, // File size in bytes
    uploaded_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expiry_date: { type: "timestamp" },
    verification_status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "verification_status IN ('pending', 'approved', 'rejected', 'expired')" 
    },
    reviewed_at: { type: "timestamp" },
    reviewed_by: { type: "uuid" },
    review_notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant verification documents
  pgm.createIndex("merchant_verification_document", "merchant_id");
  pgm.createIndex("merchant_verification_document", "document_type");
  pgm.createIndex("merchant_verification_document", "uploaded_at");
  pgm.createIndex("merchant_verification_document", "expiry_date");
  pgm.createIndex("merchant_verification_document", "verification_status");
  pgm.createIndex("merchant_verification_document", "reviewed_at");

  // Insert demo merchant record
  pgm.sql(`
    INSERT INTO "merchant" (
      name,
      slug,
      description,
      email,
      phone,
      password,
      website,
      status,
      verification_status,
      business_type,
      commission_rate,
      payout_schedule
    )
    VALUES (
      'Sample Merchant',
      'sample-merchant',
      'This is a sample merchant for demonstration purposes',
      'merchant@example.com',
      '555-123-4567',
      '$2a$10$Rnq.K1xbkBJ9JJ5L2FTK9.HXcT5gn97JOH6yEMBFMfRK.Mz9dUDty', -- "password123" hashed with bcrypt
      'https://example.com',
      'active',
      'verified',
      'llc',
      10.00,
      'monthly'
    )
  `);

  // Insert sample merchant address
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_address" (
      merchant_id,
      address_type,
      is_default,
      first_name,
      last_name,
      company,
      address_line1,
      city,
      state,
      postal_code,
      country,
      phone,
      is_verified
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      'business',
      true,
      'John',
      'Doe',
      'Sample Merchant LLC',
      '123 Business St',
      'Anytown',
      'CA',
      '12345',
      'US',
      '555-123-4567',
      true
    )
  `);

  // Insert sample merchant contact
  pgm.sql(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_contact" (
      merchant_id,
      first_name,
      last_name,
      email,
      phone,
      job_title,
      is_primary,
      department
    )
    VALUES (
      (SELECT id FROM sample_merchant),
      'John',
      'Doe',
      'john.doe@example.com',
      '555-123-4567',
      'Owner',
      true,
      'general'
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("merchant_verification_document");
  pgm.dropTable("merchant_payment_info");
  pgm.dropTable("merchant_contact");
  pgm.dropTable("merchant_address");
  pgm.dropTable("merchant");
};
