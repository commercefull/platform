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
  // Create notification type enum
  pgm.createType("notification_type", [
    "order_status", 
    "payment_status", 
    "shipping_update", 
    "account_update", 
    "security_alert", 
    "price_drop", 
    "back_in_stock", 
    "new_product", 
    "promotion", 
    "review_request", 
    "wishlist_update", 
    "support", 
    "system"
  ]);

  // Create notification channel enum
  pgm.createType("notification_channel", [
    "email", 
    "sms", 
    "push", 
    "in_app", 
    "webhook"
  ]);

  // Create base notification table
  pgm.createTable("notification", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    userId: { type: "uuid", notNull: true }, // User ID (customer, merchant, admin)
    userType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'customer',
      check: "userType IN ('customer', 'merchant', 'admin')" 
    },
    type: { type: "notification_type", notNull: true },
    title: { type: "varchar(255)", notNull: true },
    content: { type: "text", notNull: true },
    channel: { type: "notification_channel", notNull: true },
    isRead: { type: "boolean", notNull: true, default: false },
    readAt: { type: "timestamp" },
    sentAt: { type: "timestamp" },
    deliveredAt: { type: "timestamp" },
    expiresAt: { type: "timestamp" },
    actionUrl: { type: "text" }, // URL to direct user when clicked
    actionLabel: { type: "varchar(100)" }, // Text for action button/link
    imageUrl: { type: "text" }, // Optional image to display
    priority: { 
      type: "varchar(10)", 
      notNull: true, 
      default: 'normal',
      check: "priority IN ('low', 'normal', 'high', 'urgent')" 
    },
    category: { type: "varchar(50)" }, // For grouping
    data: { type: "jsonb" }, // Structured data for the notification
    metadata: { type: "jsonb" }, // Additional metadata
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notifications
  pgm.createIndex("notification", "userId");
  pgm.createIndex("notification", "userType");
  pgm.createIndex("notification", "type");
  pgm.createIndex("notification", "channel");
  pgm.createIndex("notification", "isRead");
  pgm.createIndex("notification", "sentAt");
  pgm.createIndex("notification", "expiresAt");
  pgm.createIndex("notification", "priority");
  pgm.createIndex("notification", "category");
  pgm.createIndex("notification", "createdAt");

  // Create notification template table
  pgm.createTable("notification_template", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    code: { type: "varchar(100)", notNull: true, unique: true }, // Unique template identifier
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    type: { type: "notification_type", notNull: true },
    supportedChannels: { type: "notification_channel[]", notNull: true }, // Which channels this template supports
    defaultChannel: { type: "notification_channel", notNull: true },
    subject: { type: "varchar(255)" }, // For email
    htmlTemplate: { type: "text" }, // HTML template
    textTemplate: { type: "text" }, // Plain text template
    pushTemplate: { type: "text" }, // Push notification template
    smsTemplate: { type: "text" }, // SMS template
    parameters: { type: "jsonb" }, // Required parameters for template
    isActive: { type: "boolean", notNull: true, default: true },
    categoryCode: { type: "varchar(50)" }, // For grouping
    previewData: { type: "jsonb" }, // Sample data for previewing
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for notification templates
  pgm.createIndex("notification_template", "code");
  pgm.createIndex("notification_template", "type");
  pgm.createIndex("notification_template", "isActive");
  pgm.createIndex("notification_template", "categoryCode");
  pgm.createIndex("notification_template", "supportedChannels", { method: "gin" });

  // Create notification category table
  pgm.createTable("notification_category", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    code: { type: "varchar(50)", notNull: true, unique: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    defaultPriority: { 
      type: "varchar(10)", 
      notNull: true, 
      default: 'normal',
      check: "defaultPriority IN ('low', 'normal', 'high', 'urgent')" 
    },
    isTransactional: { type: "boolean", notNull: true, default: false }, // Is transactional or marketing
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification categories
  pgm.createIndex("notification_category", "code");
  pgm.createIndex("notification_category", "isTransactional");

  // Insert default notification categories
  pgm.sql(`
    INSERT INTO "notification_category" (code, name, description, defaultPriority, isTransactional)
    VALUES 
      ('order', 'Orders', 'Order-related notifications', 'high', true),
      ('payment', 'Payments', 'Payment-related notifications', 'high', true),
      ('shipping', 'Shipping', 'Shipping and delivery notifications', 'high', true),
      ('account', 'Account', 'Account-related notifications', 'normal', true),
      ('security', 'Security', 'Security alerts and notifications', 'urgent', true),
      ('marketing', 'Marketing', 'Marketing and promotional notifications', 'low', false),
      ('system', 'System', 'System notifications and alerts', 'normal', true)
  `);

  // Insert sample notification templates
  pgm.sql(`
    INSERT INTO "notification_template" (
      code, 
      name, 
      description, 
      type, 
      supportedChannels, 
      defaultChannel,
      subject,
      htmlTemplate,
      textTemplate,
      parameters,
      categoryCode
    )
    VALUES 
      ('order_confirmation', 
       'Order Confirmation', 
       'Sent when an order is placed successfully', 
       'order_status', 
       ARRAY['email', 'sms', 'in_app']::notification_channel[], 
       'email',
       'Your order #{{orderNumber}} has been confirmed',
       '<h1>Thank you for your order!</h1><p>Your order #{{orderNumber}} has been confirmed and is being processed.</p>',
       'Thank you for your order! Your order #{{orderNumber}} has been confirmed and is being processed.',
       '{"orderNumber": "string", "customerName": "string", "orderTotal": "number"}',
       'order'),
       
      ('password_reset', 
       'Password Reset', 
       'Sent when a user requests a password reset', 
       'security_alert', 
       ARRAY['email']::notification_channel[], 
       'email',
       'Password Reset Request',
       '<h1>Password Reset</h1><p>Click the link below to reset your password:</p><p><a href="{{resetLink}}">Reset Password</a></p>',
       'To reset your password, please visit: {{resetLink}}',
       '{"resetLink": "string"}',
       'security')
  `);

  // Insert sample notification
  pgm.sql(`
    INSERT INTO "notification" (
      userId, 
      userType, 
      type, 
      title, 
      content, 
      channel, 
      isRead, 
      sentAt, 
      priority,
      category,
      data
    )
    VALUES (
      '00000000-0000-0000-0000-000000000001', -- Dummy user ID
      'customer',
      'order_status',
      'Your order has been confirmed',
      'Thank you for your order! Your order #OR12345 has been confirmed and is being processed.',
      'in_app',
      false,
      NOW(),
      'normal',
      'order',
      '{"orderNumber": "OR12345", "orderTotal": 99.99}'
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("notification_template");
  pgm.dropTable("notification_category");
  pgm.dropTable("notification");
  pgm.dropType("notification_channel");
  pgm.dropType("notification_type");
};
