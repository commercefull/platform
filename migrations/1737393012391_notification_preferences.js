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
    userId: { type: "uuid", notNull: true }, // User ID (customer, merchant, admin)
    userType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'customer',
      check: "userType IN ('customer', 'merchant', 'admin')" 
    },
    type: { type: "notification_type", notNull: true },
    channelPreferences: { type: "jsonb", notNull: true, default: '{}'}, // Preferences for each channel
    isEnabled: { type: "boolean", notNull: true, default: true },
    schedulePreferences: { type: "jsonb" }, // Preferred times to receive notifications
    metadata: { type: "jsonb" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create unique index for user preferences
  pgm.createIndex("notification_preference", ["userId", "userType", "type"], { unique: true });
  pgm.createIndex("notification_preference", "isEnabled");

  // Create notification device table for push notifications
  pgm.createTable("notification_device", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    userId: { type: "uuid", notNull: true }, // User ID (customer, merchant, admin)
    userType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'customer',
      check: "userType IN ('customer', 'merchant', 'admin')" 
    },
    deviceToken: { type: "text", notNull: true }, // Device token for push notifications
    deviceType: { 
      type: "varchar(20)", 
      notNull: true,
      check: "deviceType IN ('ios', 'android', 'web', 'desktop', 'other')" 
    },
    deviceName: { type: "varchar(100)" }, // User-friendly device name
    deviceModel: { type: "varchar(100)" }, // Device model
    appVersion: { type: "varchar(20)" }, // App version
    osVersion: { type: "varchar(20)" }, // OS version
    isActive: { type: "boolean", notNull: true, default: true },
    lastUsedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification devices
  pgm.createIndex("notification_device", "userId");
  pgm.createIndex("notification_device", "userType");
  pgm.createIndex("notification_device", "deviceToken");
  pgm.createIndex("notification_device", "deviceType");
  pgm.createIndex("notification_device", "isActive");
  pgm.createIndex("notification_device", "lastUsedAt");
  pgm.createIndex("notification_device", ["userId", "deviceToken"], { unique: true });

  // Create notification unsubscribe table
  pgm.createTable("notification_unsubscribe", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    userId: { type: "uuid" }, // Optional user ID
    email: { type: "varchar(255)" }, // Email address for unsubscribe
    phone: { type: "varchar(30)" }, // Phone number for unsubscribe
    token: { type: "varchar(100)", notNull: true }, // Unique unsubscribe token
    category: { type: "varchar(50)" }, // Category unsubscribed from
    reason: { type: "text" }, // Reason for unsubscribing
    isGlobal: { type: "boolean", notNull: true, default: false }, // Global unsubscribe
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification unsubscribes
  pgm.createIndex("notification_unsubscribe", "userId");
  pgm.createIndex("notification_unsubscribe", "email");
  pgm.createIndex("notification_unsubscribe", "phone");
  pgm.createIndex("notification_unsubscribe", "token", { unique: true });
  pgm.createIndex("notification_unsubscribe", "category");
  pgm.createIndex("notification_unsubscribe", "isGlobal");

  // Insert default notification preferences for system user
  pgm.sql(`
    INSERT INTO "notification_preference" (
      userId, 
      userType, 
      type, 
      channelPreferences, 
      isEnabled
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
      userId,
      userType,
      deviceToken,
      deviceType,
      deviceName,
      deviceModel,
      appVersion,
      osVersion
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
