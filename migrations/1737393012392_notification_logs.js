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
    notification_id: { type: "uuid", references: "notification", onDelete: "SET NULL" },
    user_id: { type: "uuid", notNull: true },
    user_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'customer',
      check: "user_type IN ('customer', 'merchant', 'admin')" 
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
    status_details: { type: "text" }, // Details about status
    sent_at: { type: "timestamp" },
    delivered_at: { type: "timestamp" },
    failed_at: { type: "timestamp" },
    failure_reason: { type: "text" },
    provider: { type: "varchar(50)" }, // Delivery provider (SendGrid, Twilio, etc.)
    provider_message_id: { type: "varchar(255)" }, // Message ID from provider
    provider_response: { type: "jsonb" }, // Full response from provider
    retry_count: { type: "integer", default: 0 },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification delivery logs
  pgm.createIndex("notification_delivery_log", "notification_id");
  pgm.createIndex("notification_delivery_log", "user_id");
  pgm.createIndex("notification_delivery_log", "user_type");
  pgm.createIndex("notification_delivery_log", "type");
  pgm.createIndex("notification_delivery_log", "channel");
  pgm.createIndex("notification_delivery_log", "recipient");
  pgm.createIndex("notification_delivery_log", "status");
  pgm.createIndex("notification_delivery_log", "sent_at");
  pgm.createIndex("notification_delivery_log", "delivered_at");
  pgm.createIndex("notification_delivery_log", "failed_at");
  pgm.createIndex("notification_delivery_log", "provider");
  pgm.createIndex("notification_delivery_log", "provider_message_id");
  pgm.createIndex("notification_delivery_log", "created_at");
  
  // Create notification event log
  pgm.createTable("notification_event_log", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    notification_id: { type: "uuid", references: "notification", onDelete: "SET NULL" },
    delivery_log_id: { type: "uuid", references: "notification_delivery_log", onDelete: "SET NULL" },
    user_id: { type: "uuid" },
    user_type: { type: "varchar(20)" },
    event_type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "event_type IN ('open', 'click', 'bounce', 'complaint', 'unsubscribe', 'block', 'dropped', 'impression', 'deferred')" 
    },
    event_data: { type: "jsonb" },
    user_agent: { type: "text" },
    ip_address: { type: "varchar(45)" },
    device_info: { type: "jsonb" },
    timestamp: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for notification event logs
  pgm.createIndex("notification_event_log", "notification_id");
  pgm.createIndex("notification_event_log", "delivery_log_id");
  pgm.createIndex("notification_event_log", "user_id");
  pgm.createIndex("notification_event_log", "user_type");
  pgm.createIndex("notification_event_log", "event_type");
  pgm.createIndex("notification_event_log", "timestamp");

  // Create notification batch
  pgm.createTable("notification_batch", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text" },
    type: { type: "notification_type", notNull: true },
    template_id: { type: "uuid", references: "notification_template" },
    channel: { type: "notification_channel", notNull: true },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'draft',
      check: "status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'failed')" 
    },
    scheduled_at: { type: "timestamp" },
    started_at: { type: "timestamp" },
    completed_at: { type: "timestamp" },
    target_count: { type: "integer", default: 0 },
    sent_count: { type: "integer", default: 0 },
    delivered_count: { type: "integer", default: 0 },
    failed_count: { type: "integer", default: 0 },
    target_audience: { type: "jsonb" }, // Audience selection criteria
    content_data: { type: "jsonb" }, // Content and parameters for the batch
    sending_settings: { type: "jsonb" }, // Throttling, retry settings, etc.
    test_recipients: { type: "jsonb" }, // Test recipients before full send
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_by: { type: "uuid" }
  });

  // Create indexes for notification batches
  pgm.createIndex("notification_batch", "type");
  pgm.createIndex("notification_batch", "template_id");
  pgm.createIndex("notification_batch", "channel");
  pgm.createIndex("notification_batch", "status");
  pgm.createIndex("notification_batch", "scheduled_at");
  pgm.createIndex("notification_batch", "started_at");
  pgm.createIndex("notification_batch", "completed_at");
  pgm.createIndex("notification_batch", "created_at");
  pgm.createIndex("notification_batch", "created_by");

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
    is_active: { type: "boolean", notNull: true, default: true },
    failure_count: { type: "integer", default: 0 },
    last_success: { type: "timestamp" },
    last_failure: { type: "timestamp" },
    last_failure_reason: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for notification webhooks
  pgm.createIndex("notification_webhook", "is_active");
  pgm.createIndex("notification_webhook", "events", { method: "gin" });
  pgm.createIndex("notification_webhook", "last_success");
  pgm.createIndex("notification_webhook", "last_failure");
  pgm.createIndex("notification_webhook", "created_at");

  // Insert sample notification delivery log
  pgm.sql(`
    WITH sample_notification AS (SELECT id FROM notification LIMIT 1)
    INSERT INTO "notification_delivery_log" (
      "notification_id",
      "user_id",
      "user_type",
      "type",
      "channel",
      "recipient",
      "status",
      "sent_at",
      "provider"
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
