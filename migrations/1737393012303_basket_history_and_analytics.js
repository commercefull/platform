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
    basketId: { type: "uuid", notNull: true, references: "basket", onDelete: "CASCADE" },
    eventType: {
      type: "varchar(50)",
      notNull: true,
      check: "eventType IN ('created', 'item_added', 'item_removed', 'item_updated', 'merged', 'discount_applied', 'discount_removed', 'cleared', 'abandoned', 'converted', 'expired', 'restored')"
    },
    entityId: { type: "uuid" }, // ID of the related entity (e.g., item ID, discount ID)
    data: { type: "jsonb", notNull: true }, // Serialized data about the event
    userId: { type: "uuid" }, // User who made the change (if admin/staff)
    ipAddress: { type: "varchar(50)" },
    userAgent: { type: "text" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for basket history
  pgm.createIndex("basket_history", "basketId");
  pgm.createIndex("basket_history", "eventType");
  pgm.createIndex("basket_history", "createdAt");

  // Create basket merge record to track basket merging
  pgm.createTable("basket_merge", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    targetBasketId: { type: "uuid", notNull: true, references: "basket" }, // The basket that received the items
    sourceBasketId: { type: "uuid", notNull: true, references: "basket" }, // The basket that was merged from
    mergeType: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "mergeType IN ('login', 'manual', 'system')"
    },
    itemsMerged: { type: "integer", notNull: true, default: 0 },
    conflictStrategy: { 
      type: "varchar(20)", 
      notNull: true, 
      check: "conflictStrategy IN ('keep_both', 'use_source', 'use_target', 'highest_quantity')"
    },
    mergedBy: { type: "uuid" }, // User ID if merged by admin/staff
    meta: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for basket merge records
  pgm.createIndex("basket_merge", "targetBasketId");
  pgm.createIndex("basket_merge", "sourceBasketId");

  // Create basket analytics table for tracking shopping behavior
  pgm.createTable("basket_analytics", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    basketId: { type: "uuid", notNull: true, references: "basket" },
    customerId: { type: "uuid", references: "customer" },
    sessionId: { type: "varchar(255)" },
    entryPoint: { type: "varchar(100)" }, // How the customer started their basket
    referralSource: { type: "varchar(255)" }, // Where the customer came from
    deviceType: { type: "varchar(50)" }, // mobile, tablet, desktop
    totalSessionTime: { type: "integer" }, // Time in seconds
    totalBasketInteractions: { type: "integer", default: 0 }, // Number of interactions with the basket
    abandonmentReason: { type: "varchar(100)" }, // If captured from exit survey
    timeToFirstAddItem: { type: "integer" }, // Time in seconds from session start to first item add
    timeToLastAddItem: { type: "integer" }, // Time in seconds from session start to last item add
    itemsBrowsed: { type: "integer", default: 0 }, // Number of items browsed before adding to basket
    addToCartRate: { type: "decimal(5,2)" }, // Percentage of viewed items added to cart
    conversionOutcome: { 
      type: "varchar(20)", 
      check: "conversionOutcome IN ('purchased', 'abandoned', 'saved_for_later', 'expired')"
    },
    meta: { type: "jsonb" }, // Additional analytics data
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for basket analytics
  pgm.createIndex("basket_analytics", "basketId");
  pgm.createIndex("basket_analytics", "customerId");
  pgm.createIndex("basket_analytics", "sessionId");
  pgm.createIndex("basket_analytics", "createdAt");
  pgm.createIndex("basket_analytics", "conversionOutcome");
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
