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
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    tax_zone_id: { type: "uuid", references: "tax_zone", onDelete: "SET NULL" },
    type: { type: "tax_exemption_type", notNull: true },
    status: { type: "tax_exemption_status", notNull: true, default: "pending" },
    name: { type: "varchar(100)", notNull: true },
    exemption_number: { type: "varchar(100)", notNull: true },
    business_name: { type: "varchar(255)" },
    exemption_reason: { type: "text" },
    document_url: { type: "text" }, // Path to stored exemption certificate
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expiry_date: { type: "timestamp" },
    is_verified: { type: "boolean", notNull: true, default: false },
    verified_by: { type: "uuid", references: "admin_user" },
    verified_at: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer tax exemptions
  pgm.createIndex("customer_tax_exemption", "customer_id");
  pgm.createIndex("customer_tax_exemption", "tax_zone_id");
  pgm.createIndex("customer_tax_exemption", "type");
  pgm.createIndex("customer_tax_exemption", "status");
  pgm.createIndex("customer_tax_exemption", "exemption_number");
  pgm.createIndex("customer_tax_exemption", "start_date");
  pgm.createIndex("customer_tax_exemption", "expiry_date");
  pgm.createIndex("customer_tax_exemption", "is_verified");
  pgm.createIndex("customer_tax_exemption", "verified_by");
  pgm.createIndex("customer_tax_exemption", "verified_at");

  // Create customer tax exemption categories table
  pgm.createTable("customer_tax_exemption_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    exemption_id: { type: "uuid", notNull: true, references: "customer_tax_exemption", onDelete: "CASCADE" },
    tax_category_id: { type: "uuid", notNull: true, references: "tax_category", onDelete: "CASCADE" },
    is_exempt: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer tax exemption categories
  pgm.createIndex("customer_tax_exemption_category", "exemption_id");
  pgm.createIndex("customer_tax_exemption_category", "tax_category_id");
  pgm.createIndex("customer_tax_exemption_category", ["exemption_id", "tax_category_id"], { unique: true });

  // Create tax overrides for specific customer groups
  pgm.createTable("customer_group_tax_override", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_group_id: { type: "uuid", notNull: true }, // References customer_group
    tax_category_id: { type: "uuid", notNull: true, references: "tax_category", onDelete: "CASCADE" },
    tax_rate_id: { type: "uuid", references: "tax_rate", onDelete: "SET NULL" },
    is_exempt: { type: "boolean", notNull: true, default: false },
    exemption_reason: { type: "text" },
    override_rate: { type: "decimal(10,6)" }, // If not NULL, overrides the tax rate
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    end_date: { type: "timestamp" },
    is_active: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer group tax overrides
  pgm.createIndex("customer_group_tax_override", "customer_group_id");
  pgm.createIndex("customer_group_tax_override", "tax_category_id");
  pgm.createIndex("customer_group_tax_override", "tax_rate_id");
  pgm.createIndex("customer_group_tax_override", "is_exempt");
  pgm.createIndex("customer_group_tax_override", "start_date");
  pgm.createIndex("customer_group_tax_override", "end_date");
  pgm.createIndex("customer_group_tax_override", "is_active");
  pgm.createIndex("customer_group_tax_override", ["customer_group_id", "tax_category_id"], { unique: true });

  // Create product tax category assignments
  pgm.createTable("product_tax_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    tax_category_id: { type: "uuid", notNull: true, references: "tax_category", onDelete: "CASCADE" },
    merchant_id: { type: "uuid", references: "merchant" },
    is_default: { type: "boolean", notNull: true, default: false },
    override_store_settings: { type: "boolean", notNull: true, default: false },
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product tax categories
  pgm.createIndex("product_tax_category", "product_id");
  pgm.createIndex("product_tax_category", "variant_id");
  pgm.createIndex("product_tax_category", "tax_category_id");
  pgm.createIndex("product_tax_category", "merchant_id");
  pgm.createIndex("product_tax_category", "is_default");
  pgm.createIndex("product_tax_category", "override_store_settings");
  pgm.createIndex("product_tax_category", ["product_id", "variant_id", "tax_category_id"], {
    unique: true,
    where: "variant_id IS NOT NULL"
  });
  pgm.createIndex("product_tax_category", ["product_id", "tax_category_id"], {
    unique: true,
    where: "variant_id IS NULL"
  });

  // Create product tax exemptions for specific zones
  pgm.createTable("product_tax_exemption", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    product_id: { type: "uuid", notNull: true, references: "product", onDelete: "CASCADE" },
    variant_id: { type: "uuid", references: "product_variant", onDelete: "CASCADE" },
    tax_zone_id: { type: "uuid", notNull: true, references: "tax_zone", onDelete: "CASCADE" },
    tax_category_id: { type: "uuid", references: "tax_category", onDelete: "SET NULL" },
    is_exempt: { type: "boolean", notNull: true, default: true },
    exemption_reason: { type: "text" },
    start_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    end_date: { type: "timestamp" },
    is_active: { type: "boolean", notNull: true, default: true },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for product tax exemptions
  pgm.createIndex("product_tax_exemption", "product_id");
  pgm.createIndex("product_tax_exemption", "variant_id");
  pgm.createIndex("product_tax_exemption", "tax_zone_id");
  pgm.createIndex("product_tax_exemption", "tax_category_id");
  pgm.createIndex("product_tax_exemption", "is_exempt");
  pgm.createIndex("product_tax_exemption", "start_date");
  pgm.createIndex("product_tax_exemption", "end_date");
  pgm.createIndex("product_tax_exemption", "is_active");
  pgm.createIndex("product_tax_exemption", ["product_id", "variant_id", "tax_zone_id"], {
    unique: true,
    where: "variant_id IS NOT NULL"
  });
  pgm.createIndex("product_tax_exemption", ["product_id", "tax_zone_id"], {
    unique: true,
    where: "variant_id IS NULL"
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
          product_id,
          tax_category_id,
          is_default,
          override_store_settings
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
  pgm.dropTable("product_tax_exemption");
  pgm.dropTable("product_tax_category");
  pgm.dropTable("customer_group_tax_override");
  pgm.dropTable("customer_tax_exemption_category");
  pgm.dropTable("customer_tax_exemption");
  pgm.dropType("tax_exemption_type");
  pgm.dropType("tax_exemption_status");
};
