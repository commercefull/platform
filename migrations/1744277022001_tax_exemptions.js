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
  // Create tax exemption status enum
  pgm.createType("tax_exemption_status", [
    "pending",     // Exemption is pending verification
    "active",      // Exemption is active
    "expired",     // Exemption has expired
    "revoked",     // Exemption has been revoked
    "rejected"     // Exemption application was rejected
  ]);

  // Create tax exemption type enum
  pgm.createType("tax_exemption_type", [
    "business",    // Business exemption
    "government",  // Government entity
    "nonprofit",   // Non-profit organization
    "educational", // Educational institution
    "reseller",    // Reseller certificate
    "diplomatic",  // Diplomatic exemption
    "other"        // Other types of exemptions
  ]);

  // Create customer tax exemption table
  pgm.createTable("customer_tax_exemption", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    taxZoneId: { type: "uuid", references: "tax_zone", onDelete: "SET NULL" },
    type: { type: "tax_exemption_type", notNull: true },
    status: { type: "tax_exemption_status", notNull: true, default: "pending" },
    name: { type: "varchar(100)", notNull: true },
    exemptionNumber: { type: "varchar(100)", notNull: true },
    businessName: { type: "varchar(255)" },
    exemptionReason: { type: "text" },
    documentUrl: { type: "text" }, // Path to stored exemption certificate
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expiryDate: { type: "timestamp" },
    isVerified: { type: "boolean", notNull: true, default: false },
    verifiedBy: { type: "uuid", references: "admin_user" },
    verifiedAt: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer tax exemptions
  pgm.createIndex("customer_tax_exemption", "customerId");
  pgm.createIndex("customer_tax_exemption", "taxZoneId");
  pgm.createIndex("customer_tax_exemption", "type");
  pgm.createIndex("customer_tax_exemption", "status");
  pgm.createIndex("customer_tax_exemption", "exemptionNumber");
  pgm.createIndex("customer_tax_exemption", "startDate");
  pgm.createIndex("customer_tax_exemption", "expiryDate");
  pgm.createIndex("customer_tax_exemption", "isVerified");
  pgm.createIndex("customer_tax_exemption", "verifiedBy");
  pgm.createIndex("customer_tax_exemption", "verifiedAt");

  // Create customer tax exemption categories table
  pgm.createTable("customer_tax_exemption_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    exemptionId: { type: "uuid", notNull: true, references: "customer_tax_exemption", onDelete: "CASCADE" },
    taxCategoryId: { type: "uuid", notNull: true, references: "tax_category", onDelete: "CASCADE" },
    isExempt: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer tax exemption categories
  pgm.createIndex("customer_tax_exemption_category", "exemptionId");
  pgm.createIndex("customer_tax_exemption_category", "taxCategoryId");
  pgm.createIndex("customer_tax_exemption_category", ["exemptionId", "taxCategoryId"], { unique: true });

  // Create tax overrides for specific customer groups
  pgm.createTable("customer_group_tax_override", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerGroupId: { type: "uuid", notNull: true }, // References customer_group
    taxCategoryId: { type: "uuid", notNull: true, references: "tax_category", onDelete: "CASCADE" },
    taxRateId: { type: "uuid", references: "tax_rate", onDelete: "SET NULL" },
    isExempt: { type: "boolean", notNull: true, default: false },
    exemptionReason: { type: "text" },
    overrideRate: { type: "decimal(10,6)" }, // If not NULL, overrides the tax rate
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" },
    isActive: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer group tax overrides
  pgm.createIndex("customer_group_tax_override", "customerGroupId");
  pgm.createIndex("customer_group_tax_override", "taxCategoryId");
  pgm.createIndex("customer_group_tax_override", "taxRateId");
  pgm.createIndex("customer_group_tax_override", "isExempt");
  pgm.createIndex("customer_group_tax_override", "startDate");
  pgm.createIndex("customer_group_tax_override", "endDate");
  pgm.createIndex("customer_group_tax_override", "isActive");
  pgm.createIndex("customer_group_tax_override", ["customerGroupId", "taxCategoryId"], { unique: true });

  // Create product tax category assignments
  pgm.createTable("product_tax_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    taxCategoryId: { type: "uuid", notNull: true, references: "tax_category", onDelete: "CASCADE" },
    merchantId: { type: "uuid", references: "merchant" },
    isDefault: { type: "boolean", notNull: true, default: false },
    overrideStoreSettings: { type: "boolean", notNull: true, default: false },
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product tax categories
  pgm.createIndex("product_tax_category", "productId");
  pgm.createIndex("product_tax_category", "variantId");
  pgm.createIndex("product_tax_category", "taxCategoryId");
  pgm.createIndex("product_tax_category", "merchantId");
  pgm.createIndex("product_tax_category", "isDefault");
  pgm.createIndex("product_tax_category", "overrideStoreSettings");
  pgm.createIndex("product_tax_category", ["productId", "variantId", "taxCategoryId"], {
    unique: true,
    where: "variantId IS NOT NULL"
  });
  pgm.createIndex("product_tax_category", ["productId", "taxCategoryId"], {
    unique: true,
    where: "variantId IS NULL"
  });

  // Create product tax exemptions for specific zones
  pgm.createTable("product_tax_exemption", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    productId: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variantId: { type: "uuid", references: "productVariant", onDelete: "CASCADE" },
    taxZoneId: { type: "uuid", notNull: true, references: "tax_zone", onDelete: "CASCADE" },
    taxCategoryId: { type: "uuid", references: "tax_category", onDelete: "SET NULL" },
    isExempt: { type: "boolean", notNull: true, default: true },
    exemptionReason: { type: "text" },
    startDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    endDate: { type: "timestamp" },
    isActive: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product tax exemptions
  pgm.createIndex("product_tax_exemption", "productId");
  pgm.createIndex("product_tax_exemption", "variantId");
  pgm.createIndex("product_tax_exemption", "taxZoneId");
  pgm.createIndex("product_tax_exemption", "taxCategoryId");
  pgm.createIndex("product_tax_exemption", "isExempt");
  pgm.createIndex("product_tax_exemption", "startDate");
  pgm.createIndex("product_tax_exemption", "endDate");
  pgm.createIndex("product_tax_exemption", "isActive");
  pgm.createIndex("product_tax_exemption", ["productId", "variantId", "taxZoneId"], {
    unique: true,
    where: "variantId IS NOT NULL"
  });
  pgm.createIndex("product_tax_exemption", ["productId", "taxZoneId"], {
    unique: true,
    where: "variantId IS NULL"
  });

  // Insert sample data
  pgm.sql(`
    -- Insert sample product tax categories
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM product WHERE slug = 'premium-bluetooth-headphones' LIMIT 1
      ) AND EXISTS (
        SELECT 1 FROM tax_category WHERE code = 'standard' LIMIT 1
      ) THEN
        -- Assign standard tax category to sample product
        INSERT INTO product_tax_category (
          productId,
          taxCategoryId,
          isDefault,
          overrideStoreSettings
        )
        SELECT
          product.id,
          tax_category.id,
          true,
          false
        FROM
          product,
          tax_category
        WHERE
          product.slug = 'premium-bluetooth-headphones'
          AND tax_category.code = 'standard'
        LIMIT 1;
      END IF;
    END
    $$;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable("product_tax_exemption");
  pgm.dropTable("product_tax_category");
  pgm.dropTable("customer_group_tax_override");
  pgm.dropTable("customer_tax_exemption_category");
  pgm.dropTable("customer_tax_exemption");

  // Drop enum types
  pgm.dropType("tax_exemption_type");
  pgm.dropType("tax_exemption_status");
};
