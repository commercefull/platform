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
    bannerImage: { type: "text" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'active', 'suspended', 'inactive', 'rejected')" 
    },
    verificationStatus: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'unverified',
      check: "verificationStatus IN ('unverified', 'in_progress', 'verified', 'rejected')" 
    },
    verifiedAt: { type: "timestamp" },
    verifiedBy: { type: "uuid" },
    verificationNotes: { type: "text" },
    businessType: { 
      type: "varchar(50)", 
      check: "businessType IN ('individual', 'sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit')" 
    },
    yearEstablished: { type: "integer" },
    employeeCount: { type: "integer" },
    taxIdNumber: { type: "varchar(50)" }, // Business tax ID (encrypted)
    legalName: { type: "varchar(100)" }, // Legal business name
    socialLinks: { type: "jsonb" }, // Social media links
    metaTitle: { type: "varchar(255)" },
    metaDescription: { type: "text" },
    metaKeywords: { type: "text" },
    commissionRate: { type: "decimal(5,2)" }, // Platform commission percentage
    commissionType: { 
      type: "varchar(20)", 
      default: 'percentage',
      check: "commissionType IN ('percentage', 'flat', 'tiered')" 
    },
    commissionTiers: { type: "jsonb" }, // For tiered commission structure
    minimumPayoutAmount: { type: "decimal(10,2)", default: 50.00 },
    payoutSchedule: { 
      type: "varchar(20)", 
      default: 'monthly',
      check: "payoutSchedule IN ('weekly', 'biweekly', 'monthly', 'quarterly')" 
    },
    autoApproveProducts: { type: "boolean", notNull: true, default: false },
    autoApproveReviews: { type: "boolean", notNull: true, default: false },
    sellerRating: { type: "decimal(3,2)" }, // Average rating
    featuredMerchant: { type: "boolean", notNull: true, default: false },
    storePolicies: { type: "jsonb" }, // Return policy, shipping policy, etc.
    notificationPreferences: { type: "jsonb" },
    allowedCategories: { type: "uuid[]" }, // Categories merchant can sell in
    notes: { type: "text" }, // Internal admin notes
    customFields: { type: "jsonb" },
    metadata: { type: "jsonb" },
    lastLoginAt: { type: "timestamp" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedBy: { type: "uuid" }
  });

  // Create indexes for merchants
  pgm.createIndex("merchant", "name");
  pgm.createIndex("merchant", "slug");
  pgm.createIndex("merchant", "email", { unique: true });
  pgm.createIndex("merchant", "status");
  pgm.createIndex("merchant", "verificationStatus");
  pgm.createIndex("merchant", "businessType");
  pgm.createIndex("merchant", "commissionRate");
  pgm.createIndex("merchant", "featuredMerchant");
  pgm.createIndex("merchant", "sellerRating");
  pgm.createIndex("merchant", "lastLoginAt");
  pgm.createIndex("merchant", "createdAt");
  pgm.createIndex("merchant", "allowedCategories", { method: "gin" });

  // Create merchant address table
  pgm.createTable("merchant_address", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    addressType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "addressType IN ('billing', 'shipping', 'business', 'warehouse', 'returns')" 
    },
    isDefault: { type: "boolean", notNull: true, default: false },
    firstName: { type: "varchar(100)" },
    lastName: { type: "varchar(100)" },
    company: { type: "varchar(100)" },
    addressLine1: { type: "varchar(255)", notNull: true },
    addressLine2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)", notNull: true },
    postalCode: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    phone: { type: "varchar(30)" },
    email: { type: "varchar(255)" },
    isVerified: { type: "boolean", notNull: true, default: false },
    verifiedAt: { type: "timestamp" },
    latitude: { type: "decimal(10,7)" },
    longitude: { type: "decimal(10,7)" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant addresses
  pgm.createIndex("merchant_address", "merchantId");
  pgm.createIndex("merchant_address", "addressType");
  pgm.createIndex("merchant_address", "isDefault");
  pgm.createIndex("merchant_address", "city");
  pgm.createIndex("merchant_address", "state");
  pgm.createIndex("merchant_address", "postalCode");
  pgm.createIndex("merchant_address", "country");
  pgm.createIndex("merchant_address", "isVerified");
  pgm.createIndex("merchant_address", ["merchantId", "addressType", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Create merchant contacts table
  pgm.createTable("merchant_contact", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    firstName: { type: "varchar(100)", notNull: true },
    lastName: { type: "varchar(100)", notNull: true },
    email: { type: "varchar(255)", notNull: true },
    phone: { type: "varchar(30)" },
    jobTitle: { type: "varchar(100)" },
    isPrimary: { type: "boolean", notNull: true, default: false },
    department: { 
      type: "varchar(50)", 
      default: 'general',
      check: "department IN ('general', 'sales', 'support', 'billing', 'technical', 'logistics', 'returns')" 
    },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant contacts
  pgm.createIndex("merchant_contact", "merchantId");
  pgm.createIndex("merchant_contact", "email");
  pgm.createIndex("merchant_contact", "isPrimary");
  pgm.createIndex("merchant_contact", "department");
  pgm.createIndex("merchant_contact", ["merchantId", "isPrimary"], {
    unique: true,
    where: "isPrimary = true"
  });

  // Create merchant payment info table
  pgm.createTable("merchant_payment_info", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    paymentType: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "paymentType IN ('bank_account', 'paypal', 'stripe', 'venmo', 'other')" 
    },
    isDefault: { type: "boolean", notNull: true, default: false },
    accountHolderName: { type: "varchar(100)" },
    bankName: { type: "varchar(100)" },
    accountNumber: { type: "varchar(255)" }, // Encrypted
    routingNumber: { type: "varchar(255)" }, // Encrypted
    accountType: { type: "varchar(20)" }, // Checking, savings, etc.
    paypalEmail: { type: "varchar(255)" },
    providerId: { type: "varchar(255)" }, // ID with external payment provider
    providerData: { type: "jsonb" }, // Additional data from provider
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    isVerified: { type: "boolean", notNull: true, default: false },
    verifiedAt: { type: "timestamp" },
    lastPayoutDate: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for merchant payment info
  pgm.createIndex("merchant_payment_info", "merchantId");
  pgm.createIndex("merchant_payment_info", "paymentType");
  pgm.createIndex("merchant_payment_info", "isDefault");
  pgm.createIndex("merchant_payment_info", "isVerified");
  pgm.createIndex("merchant_payment_info", "providerId");
  pgm.createIndex("merchant_payment_info", "lastPayoutDate");
  pgm.createIndex("merchant_payment_info", ["merchantId", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Create merchant verification document table
  pgm.createTable("merchant_verification_document", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    merchantId: { type: "uuid", notNull: true, references: "merchant", onDelete: "CASCADE" },
    documentType: { 
      type: "varchar(50)", 
      notNull: true, 
      check: "documentType IN ('business_license', 'tax_id', 'id_proof', 'address_proof', 'bank_statement', 'other')" 
    },
    documentName: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    fileUrl: { type: "text", notNull: true },
    fileType: { type: "varchar(50)" }, // MIME type
    fileSize: { type: "integer" }, // File size in bytes
    uploadedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expiryDate: { type: "timestamp" },
    verificationStatus: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "verificationStatus IN ('pending', 'approved', 'rejected', 'expired')" 
    },
    reviewedAt: { type: "timestamp" },
    reviewedBy: { type: "uuid" },
    reviewNotes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for merchant verification documents
  pgm.createIndex("merchant_verification_document", "merchantId");
  pgm.createIndex("merchant_verification_document", "documentType");
  pgm.createIndex("merchant_verification_document", "uploadedAt");
  pgm.createIndex("merchant_verification_document", "expiryDate");
  pgm.createIndex("merchant_verification_document", "verificationStatus");
  pgm.createIndex("merchant_verification_document", "reviewedAt");

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
      verificationStatus,
      businessType,
      commissionRate,
      payoutSchedule
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
      merchantId,
      addressType,
      isDefault,
      firstName,
      lastName,
      company,
      addressLine1,
      city,
      state,
      postalCode,
      country,
      phone,
      isVerified
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
      merchantId,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      isPrimary,
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
