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
  // Create notification delivery log
  pgm.createTable("notification_delivery_log", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    notificationId: { type: "uuid", references: "notification", onDelete: "SET NULL" },
    userId: { type: "uuid", notNull: true },
    userType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'customer',
      check: "userType IN ('customer', 'merchant', 'admin')" 
    },
    type: { type: "notification_type", notNull: true },
    channel: { type: "notification_channel", notNull: true },
    recipient: { type: "varchar(255)", notNull: true }, // Email, phone number, device token
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'blocked')" 
    },
    statusDetails: { type: "text" }, // Details about status
    sentAt: { type: "timestamp" },
    deliveredAt: { type: "timestamp" },
    failedAt: { type: "timestamp" },
    failureReason: { type: "text" },
    provider: { type: "varchar(50)" }, // Delivery provider (SendGrid, Twilio, etc.)
    providerMessageId: { type: "varchar(255)" }, // Message ID from provider
    providerResponse: { type: "jsonb" }, // Full response from provider
    retryCount: { type: "integer", default: 0 },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification delivery logs
  pgm.createIndex("notification_delivery_log", "notificationId");
  pgm.createIndex("notification_delivery_log", "userId");
  pgm.createIndex("notification_delivery_log", "userType");
  pgm.createIndex("notification_delivery_log", "type");
  pgm.createIndex("notification_delivery_log", "channel");
  pgm.createIndex("notification_delivery_log", "recipient");
  pgm.createIndex("notification_delivery_log", "status");
  pgm.createIndex("notification_delivery_log", "sentAt");
  pgm.createIndex("notification_delivery_log", "deliveredAt");
  pgm.createIndex("notification_delivery_log", "failedAt");
  pgm.createIndex("notification_delivery_log", "provider");
  pgm.createIndex("notification_delivery_log", "providerMessageId");
  pgm.createIndex("notification_delivery_log", "created_at");
  
  // Create notification event log
  pgm.createTable("notification_event_log", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    notificationId: { type: "uuid", references: "notification", onDelete: "SET NULL" },
    deliveryLogId: { type: "uuid", references: "notification_delivery_log", onDelete: "SET NULL" },
    userId: { type: "uuid" },
    userType: { type: "varchar(20)" },
    eventType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "eventType IN ('open', 'click', 'bounce', 'complaint', 'unsubscribe', 'block', 'dropped', 'impression', 'deferred')" 
    },
    eventData: { type: "jsonb" },
    userAgent: { type: "text" },
    ipAddress: { type: "varchar(45)" },
    deviceInfo: { type: "jsonb" },
    timestamp: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification event logs
  pgm.createIndex("notification_event_log", "notificationId");
  pgm.createIndex("notification_event_log", "deliveryLogId");
  pgm.createIndex("notification_event_log", "userId");
  pgm.createIndex("notification_event_log", "userType");
  pgm.createIndex("notification_event_log", "eventType");
  pgm.createIndex("notification_event_log", "timestamp");

  // Create notification batch
  pgm.createTable("notification_batch", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    type: { type: "notification_type", notNull: true },
    templateId: { type: "uuid", references: "notification_template" },
    channel: { type: "notification_channel", notNull: true },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'draft',
      check: "status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'failed')" 
    },
    scheduledAt: { type: "timestamp" },
    startedAt: { type: "timestamp" },
    completedAt: { type: "timestamp" },
    targetCount: { type: "integer", default: 0 },
    sentCount: { type: "integer", default: 0 },
    deliveredCount: { type: "integer", default: 0 },
    failedCount: { type: "integer", default: 0 },
    targetAudience: { type: "jsonb" }, // Audience selection criteria
    contentData: { type: "jsonb" }, // Content and parameters for the batch
    sendingSettings: { type: "jsonb" }, // Throttling, retry settings, etc.
    testRecipients: { type: "jsonb" }, // Test recipients before full send
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedBy: { type: "uuid" }
  });

  // Create indexes for notification batches
  pgm.createIndex("notification_batch", "type");
  pgm.createIndex("notification_batch", "templateId");
  pgm.createIndex("notification_batch", "channel");
  pgm.createIndex("notification_batch", "status");
  pgm.createIndex("notification_batch", "scheduledAt");
  pgm.createIndex("notification_batch", "startedAt");
  pgm.createIndex("notification_batch", "completedAt");
  pgm.createIndex("notification_batch", "created_at");
  pgm.createIndex("notification_batch", "createdBy");

  // Create notification webhook endpoint
  pgm.createTable("notification_webhook", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    url: { type: "text", notNull: true },
    secret: { type: "text" }, // Secret for signature verification
    events: { type: "jsonb", notNull: true }, // Array of event types to send
    format: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'json',
      check: "format IN ('json', 'form', 'xml')" 
    },
    headers: { type: "jsonb" }, // Custom headers
    isActive: { type: "boolean", notNull: true, default: true },
    failureCount: { type: "integer", default: 0 },
    lastSuccess: { type: "timestamp" },
    lastFailure: { type: "timestamp" },
    lastFailureReason: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for notification webhooks
  pgm.createIndex("notification_webhook", "isActive");
  pgm.createIndex("notification_webhook", "events", { method: "gin" });
  pgm.createIndex("notification_webhook", "lastSuccess");
  pgm.createIndex("notification_webhook", "lastFailure");
  pgm.createIndex("notification_webhook", "created_at");

  // Insert sample notification delivery log
  pgm.sql(`
    WITH sample_notification AS (SELECT id FROM notification LIMIT 1)
    INSERT INTO "notification_delivery_log" (
      notificationId,
      userId,
      userType,
      type,
      channel,
      recipient,
      status,
      sentAt,
      provider
    )
    VALUES (
      (SELECT id FROM sample_notification),
      '00000000-0000-0000-0000-000000000001', -- Dummy user ID
      'customer',
      'order_status',
      'in_app',
      'system',
      'delivered',
      NOW(),
      'internal'
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("notification_webhook");
  pgm.dropTable("notification_batch");
  pgm.dropTable("notification_event_log");
  pgm.dropTable("notification_delivery_log");
};
