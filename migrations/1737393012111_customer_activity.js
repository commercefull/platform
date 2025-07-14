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
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    session_id: { type: "varchar(255)" }, // Session ID for tracking
    activity_type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "activity_type IN ('login', 'logout', 'registration', 'password_change', 'profile_update', 'order_placed', 'cart_update', 'wishlist_update', 'review_submitted', 'support_ticket', 'product_view', 'category_view', 'search', 'email_open', 'email_click', 'payment_method_added', 'address_added', 'address_updated', 'failed_login', 'password_reset', 'account_locked', 'account_unlocked')" 
    },
    ip_address: { type: "varchar(50)" },
    user_agent: { type: "varchar(255)" },
    device_type: { type: "varchar(20)" }, // mobile, tablet, desktop
    os_name: { type: "varchar(50)" },
    browser: { type: "varchar(50)" },
    location: { type: "jsonb" }, // Geolocation data
    entity_type: { type: "varchar(50)" }, // Type of entity involved (e.g., product, order)
    entity_id: { type: "uuid" }, // ID of entity involved
    additional_data: { type: "jsonb" }, // Activity specific data
    success: { type: "boolean" }, // Whether the activity was successful (e.g., login)
    message: { type: "text" }, // Additional message about the activity
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer activity
  pgm.createIndex("customer_activity", "customer_id");
  pgm.createIndex("customer_activity", "session_id");
  pgm.createIndex("customer_activity", "activity_type");
  pgm.createIndex("customer_activity", "ip_address");
  pgm.createIndex("customer_activity", "entity_type");
  pgm.createIndex("customer_activity", "entity_id");
  pgm.createIndex("customer_activity", "created_at");

  // Create customer consent table for tracking privacy/terms agreement
  pgm.createTable("customer_consent", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('terms', 'privacy', 'marketing', 'cookies', 'data_processing', 'third_party', 'age_verification', 'sms', 'phone_calls', 'personalization')" 
    },
    given: { type: "boolean", notNull: true },
    ip_address: { type: "varchar(50)" },
    user_agent: { type: "varchar(255)" },
    source: { type: "varchar(100)" }, // Where consent was collected (e.g., registration, checkout)
    version: { type: "varchar(50)" }, // Version of terms/privacy policy
    doc_url: { type: "text" }, // URL to the document agreed to
    expires_at: { type: "timestamp" }, // When consent expires (if applicable)
    withdrawn_at: { type: "timestamp" }, // When consent was withdrawn
    additional_data: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer consent
  pgm.createIndex("customer_consent", "customer_id");
  pgm.createIndex("customer_consent", "type");
  pgm.createIndex("customer_consent", "given");
  pgm.createIndex("customer_consent", "version");
  pgm.createIndex("customer_consent", "expires_at");
  pgm.createIndex("customer_consent", "withdrawn_at");
  pgm.createIndex("customer_consent", ["customer_id", "type", "version"], { unique: true });

  // Create customer preferences table
  pgm.createTable("customer_preference", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    category: { type: "varchar(50)", notNull: true }, // Preference category (e.g., notifications, display)
    key: { type: "varchar(100)", notNull: true }, // Preference key
    value: { type: "jsonb", notNull: true }, // Preference value
    source: { type: "varchar(50)" }, // How preference was set (user, system, default)
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer preferences
  pgm.createIndex("customer_preference", "customer_id");
  pgm.createIndex("customer_preference", "category");
  pgm.createIndex("customer_preference", ["customer_id", "category", "key"], { unique: true });

  // Create customer wishlist table
  pgm.createTable("customer_wishlist", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    customer_id: { type: "uuid", notNull: true, references: "customer", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true, default: 'Default' },
    description: { type: "text" },
    is_public: { type: "boolean", notNull: true, default: false },
    share_token: { type: "varchar(100)" }, // For sharing wishlists
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for customer wishlist
  pgm.createIndex("customer_wishlist", "customer_id");
  pgm.createIndex("customer_wishlist", "is_public");
  pgm.createIndex("customer_wishlist", "share_token", { unique: true, where: "share_token IS NOT NULL" });
  pgm.createIndex("customer_wishlist", ["customer_id", "name"], { unique: true });

  // Create customer wishlist item table
  pgm.createTable("customer_wishlist_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    wishlist_id: { type: "uuid", notNull: true, references: "customer_wishlist", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    quantity: { type: "integer", notNull: true, default: 1 },
    added_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    note: { type: "text" }, // Customer note for this item
    priority: { type: "integer", default: 0 }, // For sorting items within list
    additional_data: { type: "jsonb" } // Additional attributes/options
  });

  // Create indexes for wishlist items
  pgm.createIndex("customer_wishlist_item", "wishlist_id");
  pgm.createIndex("customer_wishlist_item", "product_id");
  pgm.createIndex("customer_wishlist_item", "variant_id");
  pgm.createIndex("customer_wishlist_item", "added_at");
  pgm.createIndex("customer_wishlist_item", "priority");
  pgm.createIndex("customer_wishlist_item", ["wishlist_id", "product_id", "variant_id"], { 
    unique: true,
    nulls: "not distinct"
  });

  // Auto-create default wishlist for each customer
  pgm.sql(`
    -- Create a trigger function
    CREATE OR REPLACE FUNCTION create_default_wishlist()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO customer_wishlist (customer_id, name, description)
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
