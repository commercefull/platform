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
  // Create user notification preferences table
  pgm.createTable("notification_preference", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    user_id: { type: "uuid", notNull: true }, // User ID (customer, merchant, admin)
    user_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'customer',
      check: "user_type IN ('customer', 'merchant', 'admin')" 
    },
    type: { type: "notification_type", notNull: true },
    channel_preferences: { type: "jsonb", notNull: true, default: '{}'}, // Preferences for each channel
    is_enabled: { type: "boolean", notNull: true, default: true },
    schedule_preferences: { type: "jsonb" }, // Preferred times to receive notifications
    metadata: { type: "jsonb" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create unique index for user preferences
  pgm.createIndex("notification_preference", ["user_id", "user_type", "type"], { unique: true });
  pgm.createIndex("notification_preference", "is_enabled");

  // Create notification device table for push notifications
  pgm.createTable("notification_device", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    user_id: { type: "uuid", notNull: true }, // User ID (customer, merchant, admin)
    user_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'customer',
      check: "user_type IN ('customer', 'merchant', 'admin')" 
    },
    device_token: { type: "text", notNull: true }, // Device token for push notifications
    device_type: { 
      type: "varchar(20)", 
      notNull: true,
      check: "device_type IN ('ios', 'android', 'web', 'desktop', 'other')" 
    },
    device_name: { type: "varchar(100)" }, // User-friendly device name
    device_model: { type: "varchar(100)" }, // Device model
    app_version: { type: "varchar(20)" }, // App version
    os_version: { type: "varchar(20)" }, // OS version
    is_active: { type: "boolean", notNull: true, default: true },
    last_used_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification devices
  pgm.createIndex("notification_device", "user_id");
  pgm.createIndex("notification_device", "user_type");
  pgm.createIndex("notification_device", "device_token");
  pgm.createIndex("notification_device", "device_type");
  pgm.createIndex("notification_device", "is_active");
  pgm.createIndex("notification_device", "last_used_at");
  pgm.createIndex("notification_device", ["user_id", "device_token"], { unique: true });

  // Create notification unsubscribe table
  pgm.createTable("notification_unsubscribe", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    user_id: { type: "uuid" }, // Optional user ID
    email: { type: "varchar(255)" }, // Email address for unsubscribe
    phone: { type: "varchar(30)" }, // Phone number for unsubscribe
    token: { type: "varchar(100)", notNull: true }, // Unique unsubscribe token
    category: { type: "varchar(50)" }, // Category unsubscribed from
    reason: { type: "text" }, // Reason for unsubscribing
    is_global: { type: "boolean", notNull: true, default: false }, // Global unsubscribe
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification unsubscribes
  pgm.createIndex("notification_unsubscribe", "user_id");
  pgm.createIndex("notification_unsubscribe", "email");
  pgm.createIndex("notification_unsubscribe", "phone");
  pgm.createIndex("notification_unsubscribe", "token", { unique: true });
  pgm.createIndex("notification_unsubscribe", "category");
  pgm.createIndex("notification_unsubscribe", "is_global");

  // Insert default notification preferences for system user
  pgm.sql(`
    INSERT INTO "notification_preference" (
      user_id, 
      user_type, 
      type, 
      channel_preferences, 
      is_enabled
    )
    VALUES 
      (
        '00000000-0000-0000-0000-000000000001', -- Dummy user ID
        'customer',
        'order_status',
        '{"email": true, "sms": true, "push": true, "in_app": true}',
        true
      ),
      (
        '00000000-0000-0000-0000-000000000001', -- Dummy user ID
        'customer',
        'payment_status',
        '{"email": true, "sms": true, "push": true, "in_app": true}',
        true
      ),
      (
        '00000000-0000-0000-0000-000000000001', -- Dummy user ID
        'customer',
        'shipping_update',
        '{"email": true, "sms": true, "push": true, "in_app": true}',
        true
      ),
      (
        '00000000-0000-0000-0000-000000000001', -- Dummy user ID
        'customer',
        'promotion',
        '{"email": true, "sms": false, "push": false, "in_app": true}',
        true
      )
  `);

  // Insert sample device token
  pgm.sql(`
    INSERT INTO "notification_device" (
      user_id,
      user_type,
      device_token,
      device_type,
      device_name,
      device_model,
      app_version,
      os_version
    )
    VALUES (
      '00000000-0000-0000-0000-000000000001', -- Dummy user ID
      'customer',
      'sample_device_token_for_testing',
      'ios',
      'iPhone',
      'iPhone 14 Pro',
      '1.0.0',
      '16.0'
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("notification_unsubscribe");
  pgm.dropTable("notification_device");
  pgm.dropTable("notification_preference");
};
