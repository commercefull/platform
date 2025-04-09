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
  // Create customer activity log table
  pgm.createTable("customer_activity", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    sessionId: { type: "varchar(255)" }, // Session ID for tracking
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('login', 'logout', 'registration', 'password_change', 'profile_update', 'order_placed', 'cart_update', 'wishlist_update', 'review_submitted', 'support_ticket', 'product_view', 'category_view', 'search', 'email_open', 'email_click', 'payment_method_added', 'address_added', 'address_updated', 'failed_login', 'password_reset', 'account_locked', 'account_unlocked')" 
    },
    ipAddress: { type: "varchar(50)" },
    userAgent: { type: "varchar(255)" },
    deviceType: { type: "varchar(20)" }, // mobile, tablet, desktop
    osName: { type: "varchar(50)" },
    browser: { type: "varchar(50)" },
    location: { type: "jsonb" }, // Geolocation data
    entityType: { type: "varchar(50)" }, // Type of entity involved (e.g., product, order)
    entityId: { type: "uuid" }, // ID of entity involved
    additionalData: { type: "jsonb" }, // Activity specific data
    success: { type: "boolean" }, // Whether the activity was successful (e.g., login)
    message: { type: "text" }, // Additional message about the activity
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer activity
  pgm.createIndex("customer_activity", "customerId");
  pgm.createIndex("customer_activity", "sessionId");
  pgm.createIndex("customer_activity", "type");
  pgm.createIndex("customer_activity", "ipAddress");
  pgm.createIndex("customer_activity", "entityType");
  pgm.createIndex("customer_activity", "entityId");
  pgm.createIndex("customer_activity", "createdAt");

  // Create customer consent table for tracking privacy/terms agreement
  pgm.createTable("customer_consent", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('terms', 'privacy', 'marketing', 'cookies', 'data_processing', 'third_party', 'age_verification', 'sms', 'phone_calls', 'personalization')" 
    },
    given: { type: "boolean", notNull: true },
    ipAddress: { type: "varchar(50)" },
    userAgent: { type: "varchar(255)" },
    source: { type: "varchar(100)" }, // Where consent was collected (e.g., registration, checkout)
    version: { type: "varchar(50)" }, // Version of terms/privacy policy
    docUrl: { type: "text" }, // URL to the document agreed to
    expiresAt: { type: "timestamp" }, // When consent expires (if applicable)
    withdrawnAt: { type: "timestamp" }, // When consent was withdrawn
    additionalData: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer consent
  pgm.createIndex("customer_consent", "customerId");
  pgm.createIndex("customer_consent", "type");
  pgm.createIndex("customer_consent", "given");
  pgm.createIndex("customer_consent", "version");
  pgm.createIndex("customer_consent", "expiresAt");
  pgm.createIndex("customer_consent", "withdrawnAt");
  pgm.createIndex("customer_consent", ["customerId", "type", "version"], { unique: true });

  // Create customer preferences table
  pgm.createTable("customer_preference", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    category: { type: "varchar(50)", notNull: true }, // Preference category (e.g., notifications, display)
    key: { type: "varchar(100)", notNull: true }, // Preference key
    value: { type: "jsonb", notNull: true }, // Preference value
    source: { type: "varchar(50)" }, // How preference was set (user, system, default)
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer preferences
  pgm.createIndex("customer_preference", "customerId");
  pgm.createIndex("customer_preference", "category");
  pgm.createIndex("customer_preference", ["customerId", "category", "key"], { unique: true });

  // Create customer wishlist table
  pgm.createTable("customer_wishlist", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customerId: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true, default: 'Default' },
    description: { type: "text" },
    isPublic: { type: "boolean", notNull: true, default: false },
    shareToken: { type: "varchar(100)" }, // For sharing wishlists
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer wishlist
  pgm.createIndex("customer_wishlist", "customerId");
  pgm.createIndex("customer_wishlist", "isPublic");
  pgm.createIndex("customer_wishlist", "shareToken", { unique: true, where: "shareToken IS NOT NULL" });
  pgm.createIndex("customer_wishlist", ["customerId", "name"], { unique: true });

  // Create customer wishlist item table
  pgm.createTable("customer_wishlist_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    wishlistId: { type: "uuid", notNull: true, references: "customer_wishlist", onDelete: "CASCADE" },
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    quantity: { type: "integer", notNull: true, default: 1 },
    addedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    note: { type: "text" }, // Customer note for this item
    priority: { type: "integer", default: 0 }, // For sorting items within list
    additionalData: { type: "jsonb" } // Additional attributes/options
  });

  // Create indexes for wishlist items
  pgm.createIndex("customer_wishlist_item", "wishlistId");
  pgm.createIndex("customer_wishlist_item", "productId");
  pgm.createIndex("customer_wishlist_item", "variantId");
  pgm.createIndex("customer_wishlist_item", "addedAt");
  pgm.createIndex("customer_wishlist_item", "priority");
  pgm.createIndex("customer_wishlist_item", ["wishlistId", "productId", "variantId"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Auto-create default wishlist for each customer
  pgm.sql(`
    -- Create a trigger function
    CREATE OR REPLACE FUNCTION create_default_wishlist()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO customer_wishlist (customerId, name, description)
        VALUES (NEW.id, 'Wishlist', 'Default wishlist');
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create a trigger on customer table
    CREATE TRIGGER create_customer_default_wishlist
    AFTER INSERT ON customer
    FOR EACH ROW
    EXECUTE FUNCTION create_default_wishlist();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop trigger first
  pgm.sql(`
    DROP TRIGGER IF EXISTS create_customer_default_wishlist ON customer;
    DROP FUNCTION IF EXISTS create_default_wishlist();
  `);

  // Then drop tables
  pgm.dropTable("customer_wishlist_item");
  pgm.dropTable("customer_wishlist");
  pgm.dropTable("customer_preference");
  pgm.dropTable("customer_consent");
  pgm.dropTable("customer_activity");
};
