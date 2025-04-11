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
  // Create basket history table to track important changes
  pgm.createTable("basket_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    basket_id: { type: "uuid", notNull: true, references: "basket", onDelete: "CASCADE" },
    event_type: {
      type: "varchar(50)",
      notNull: true,
      check: "event_type IN ('created', 'item_added', 'item_removed', 'item_updated', 'merged', 'discount_applied', 'discount_removed', 'cleared', 'abandoned', 'converted', 'expired', 'restored')"
    },
    entity_id: { type: "uuid" }, // ID of the related entity (e.g., item ID, discount ID)
    data: { type: "jsonb", notNull: true }, // Serialized data about the event
    user_id: { type: "uuid" }, // User who made the change (if admin/staff)
    ip_address: { type: "varchar(50)" },
    user_agent: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for basket history
  pgm.createIndex("basket_history", "basket_id");
  pgm.createIndex("basket_history", "event_type");
  pgm.createIndex("basket_history", "created_at");

  // Create basket merge record to track basket merging
  pgm.createTable("basket_merge", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    target_basket_id: { type: "uuid", notNull: true, references: "basket" }, // The basket that received the items
    source_basket_id: { type: "uuid", notNull: true, references: "basket" }, // The basket that was merged from
    merge_type: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "merge_type IN ('login', 'manual', 'system')"
    },
    items_merged: { type: "integer", notNull: true, default: 0 },
    conflict_strategy: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "conflict_strategy IN ('keep_both', 'use_source', 'use_target', 'highest_quantity')"
    },
    merged_by: { type: "uuid" }, // User ID if merged by admin/staff
    meta: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for basket merges
  pgm.createIndex("basket_merge", "target_basket_id");
  pgm.createIndex("basket_merge", "source_basket_id");
  pgm.createIndex("basket_merge", "created_at");

  // Create basket analytics table for tracking shopping behavior
  pgm.createTable("basket_analytics", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    basket_id: { type: "uuid", notNull: true, references: "basket" },
    customer_id: { type: "uuid", references: "customer" },
    session_id: { type: "varchar(255)" },
    entry_point: { type: "varchar(100)" }, // How the customer started their basket
    referral_source: { type: "varchar(255)" }, // Where the customer came from
    device_type: { type: "varchar(50)" }, // mobile, tablet, desktop
    total_session_time: { type: "integer" }, // Time in seconds
    total_basket_interactions: { type: "integer", default: 0 }, // Number of interactions with the basket
    abandonment_reason: { type: "varchar(100)" }, // If captured from exit survey
    time_to_first_add_item: { type: "integer" }, // Time in seconds from session start to first item add
    time_to_last_add_item: { type: "integer" }, // Time in seconds from session start to last item add
    items_browsed: { type: "integer", default: 0 }, // Number of items browsed before adding to basket
    add_to_cart_rate: { type: "decimal(5,2)" }, // Percentage of viewed items added to cart
    conversion_outcome: { 
      type: "varchar(20)", 
      check: "conversion_outcome IN ('purchased', 'abandoned', 'saved_for_later', 'expired')"
    },
    meta: { type: "jsonb" }, // Additional analytics data
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for basket analytics
  pgm.createIndex("basket_analytics", "basket_id");
  pgm.createIndex("basket_analytics", "customer_id");
  pgm.createIndex("basket_analytics", "session_id");
  pgm.createIndex("basket_analytics", "created_at");
  pgm.createIndex("basket_analytics", "conversion_outcome");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("basket_analytics");
  pgm.dropTable("basket_merge");
  pgm.dropTable("basket_history");
};
