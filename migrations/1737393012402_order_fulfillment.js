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
  // Create shipment status enum
  pgm.createType("shipment_status", [
    "pending",
    "processing",
    "ready_for_pickup",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "failed_delivery",
    "returned",
    "cancelled"
  ]);

  // Create shipping carrier enum
  pgm.createType("shipping_carrier", [
    "fedex",
    "ups",
    "usps",
    "dhl",
    "amazon",
    "other"
  ]);

  // Create fulfillment provider enum
  pgm.createType("fulfillment_provider", [
    "self",
    "shipbob",
    "shipmonk",
    "amazon_fba",
    "shopify_fulfillment",
    "external_warehouse",
    "other"
  ]);

  // Create fulfillment table
  pgm.createTable("order_fulfillment", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    warehouse_id: { type: "uuid", references: "warehouse" },
    fulfillment_number: { type: "varchar(50)", notNull: true, unique: true }, // Human-readable fulfillment number
    status: { type: "shipment_status", notNull: true, default: "pending" },
    provider: { type: "fulfillment_provider", notNull: true, default: "self" },
    carrier: { type: "shipping_carrier" },
    service_level: { type: "varchar(100)" }, // e.g., "Ground", "2-Day Air"
    tracking_number: { type: "varchar(100)" },
    tracking_url: { type: "text" },
    label_url: { type: "text" }, // URL to shipping label
    manifest_id: { type: "varchar(100)" }, // Shipping manifest ID
    shipping_address_id: { type: "uuid", references: "customer_address" },
    shipping_address: { type: "jsonb", notNull: true }, // Copy of shipping address at time of fulfillment
    shipping_cost: { type: "decimal(15,2)" },
    package_count: { type: "integer", default: 1 },
    total_weight: { type: "decimal(10,2)" }, // Total weight of all packages
    dimensions: { type: "jsonb" }, // Combined dimensions
    packaging_type: { type: "varchar(50)" }, // Type of packaging used
    shipping_method: { type: "varchar(100)" },
    instructions: { type: "text" }, // Special handling instructions
    notes: { type: "text" }, // Internal notes
    metadata: { type: "jsonb" },
    created_by: { type: "varchar(255)" }, // User who created the fulfillment
    fulfillment_data: { type: "jsonb" }, // Additional data from the fulfillment provider
    estimated_delivery_date: { type: "timestamp" },
    shipped_at: { type: "timestamp" }, // When the fulfillment was shipped
    delivered_at: { type: "timestamp" }, // When the fulfillment was delivered
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for fulfillment
  pgm.createIndex("order_fulfillment", "order_id");
  pgm.createIndex("order_fulfillment", "warehouse_id");
  pgm.createIndex("order_fulfillment", "fulfillment_number");
  pgm.createIndex("order_fulfillment", "status");
  pgm.createIndex("order_fulfillment", "provider");
  pgm.createIndex("order_fulfillment", "carrier");
  pgm.createIndex("order_fulfillment", "tracking_number");
  pgm.createIndex("order_fulfillment", "shipping_address_id");
  pgm.createIndex("order_fulfillment", "shipped_at");
  pgm.createIndex("order_fulfillment", "delivered_at");
  pgm.createIndex("order_fulfillment", "estimated_delivery_date");
  pgm.createIndex("order_fulfillment", "created_at");

  // Create fulfillment item table
  pgm.createTable("order_fulfillment_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    fulfillment_id: { type: "uuid", notNull: true, references: "order_fulfillment", onDelete: "CASCADE" },
    order_item_id: { type: "uuid", notNull: true, references: "order_item", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true },
    inventory_item_id: { type: "uuid", references: "inventory_item" },
    warehouse_location_id: { type: "uuid", references: "warehouse_location" },
    lot_number: { type: "varchar(100)" }, // Batch/lot for items with expiry dates
    serial_number: { type: "varchar(100)" }, // For serialized products
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for fulfillment items
  pgm.createIndex("order_fulfillment_item", "fulfillment_id");
  pgm.createIndex("order_fulfillment_item", "order_item_id");
  pgm.createIndex("order_fulfillment_item", "inventory_item_id");
  pgm.createIndex("order_fulfillment_item", "warehouse_location_id");
  pgm.createIndex("order_fulfillment_item", "lot_number");
  pgm.createIndex("order_fulfillment_item", "serial_number");

  // Create fulfillment package table
  pgm.createTable("order_fulfillment_package", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    fulfillment_id: { type: "uuid", notNull: true, references: "order_fulfillment", onDelete: "CASCADE" },
    package_number: { type: "varchar(50)", notNull: true }, // Human-readable package identifier
    tracking_number: { type: "varchar(100)" }, // Individual package tracking number
    weight: { type: "decimal(10,2)" }, // Weight in oz/g
    dimensions: { type: "jsonb" }, // Length, width, height
    package_type: { type: "varchar(50)" }, // Box, envelope, etc.
    shipping_label_url: { type: "text" },
    commercial_invoice_url: { type: "text" }, // For international shipments
    customs_info: { type: "jsonb" }, // For international shipments
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for fulfillment packages
  pgm.createIndex("order_fulfillment_package", "fulfillment_id");
  pgm.createIndex("order_fulfillment_package", "package_number");
  pgm.createIndex("order_fulfillment_package", "tracking_number");

  // Create shipping rate table
  pgm.createTable("shipping_rate", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    carrier: { type: "shipping_carrier", notNull: true },
    service_level: { type: "varchar(100)", notNull: true }, // e.g., "Ground", "2-Day Air"
    service_name: { type: "varchar(255)", notNull: true }, // Display name for the service
    rate: { type: "decimal(15,2)", notNull: true }, // Cost of shipping
    estimated_days: { type: "integer" }, // Estimated transit time in days
    estimated_delivery_date: { type: "timestamp" },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    is_selected: { type: "boolean", notNull: true, default: false }, // Whether this rate was chosen
    carrier_account_id: { type: "varchar(100)" }, // Carrier account ID
    shipment_id: { type: "varchar(100)" }, // ID from shipping API
    metadata: { type: "jsonb" },
    rate_data: { type: "jsonb" }, // Full rate data from carrier API
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for shipping rates
  pgm.createIndex("shipping_rate", "order_id");
  pgm.createIndex("shipping_rate", "carrier");
  pgm.createIndex("shipping_rate", "service_level");
  pgm.createIndex("shipping_rate", "rate");
  pgm.createIndex("shipping_rate", "estimated_days");
  pgm.createIndex("shipping_rate", "is_selected");
  pgm.createIndex("shipping_rate", "shipment_id");
  pgm.createIndex("shipping_rate", "created_at");

  // Create fulfillment status history table
  pgm.createTable("fulfillment_status_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    fulfillment_id: { type: "uuid", notNull: true, references: "order_fulfillment", onDelete: "CASCADE" },
    status: { type: "shipment_status", notNull: true },
    previous_status: { type: "shipment_status" },
    notes: { type: "text" },
    location: { type: "varchar(255)" }, // Location where the status was updated
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "varchar(255)" } // User who updated the status
  });

  // Create indexes for fulfillment status history
  pgm.createIndex("fulfillment_status_history", "fulfillment_id");
  pgm.createIndex("fulfillment_status_history", "status");
  pgm.createIndex("fulfillment_status_history", "created_at");

  // Create return reason enum
  pgm.createType("return_reason", [
    "defective",
    "damaged",
    "wrong_item",
    "not_as_described",
    "unwanted",
    "size_issue",
    "quality_issue",
    "arrived_late",
    "other"
  ]);

  // Create return status enum
  pgm.createType("return_status", [
    "requested",
    "approved",
    "denied",
    "in_transit",
    "received",
    "inspected",
    "completed",
    "cancelled"
  ]);

  // Create order return table
  pgm.createTable("order_return", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    return_number: { type: "varchar(50)", notNull: true, unique: true }, // Human-readable return number
    customer_id: { type: "uuid", references: "customer" },
    status: { type: "return_status", notNull: true, default: "requested" },
    return_type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "return_type IN ('refund', 'exchange', 'store_credit', 'repair')" 
    },
    requested_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    approved_at: { type: "timestamp" },
    received_at: { type: "timestamp" },
    completed_at: { type: "timestamp" },
    rma_number: { type: "varchar(100)" }, // Return Merchandise Authorization number
    refund_id: { type: "uuid", references: "order_refund" },
    return_shipping_paid: { type: "boolean", notNull: true, default: false }, // Whether return shipping was paid for
    return_shipping_amount: { type: "decimal(15,2)" }, // Cost of return shipping
    return_shipping_label: { type: "text" }, // URL to return shipping label
    return_carrier: { type: "shipping_carrier" },
    return_tracking_number: { type: "varchar(100)" },
    return_tracking_url: { type: "text" },
    return_reason: { type: "text" },
    return_instructions: { type: "text" },
    customer_notes: { type: "text" }, // Notes from customer
    admin_notes: { type: "text" }, // Internal notes
    requires_inspection: { type: "boolean", notNull: true, default: true },
    inspection_passed_items: { type: "jsonb" }, // Items that passed inspection
    inspection_failed_items: { type: "jsonb" }, // Items that failed inspection
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order returns
  pgm.createIndex("order_return", "order_id");
  pgm.createIndex("order_return", "return_number");
  pgm.createIndex("order_return", "customer_id");
  pgm.createIndex("order_return", "status");
  pgm.createIndex("order_return", "return_type");
  pgm.createIndex("order_return", "requested_at");
  pgm.createIndex("order_return", "approved_at");
  pgm.createIndex("order_return", "received_at");
  pgm.createIndex("order_return", "completed_at");
  pgm.createIndex("order_return", "rma_number");
  pgm.createIndex("order_return", "refund_id");
  pgm.createIndex("order_return", "return_tracking_number");
  pgm.createIndex("order_return", "created_at");

  // Create order return item table
  pgm.createTable("order_return_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    return_id: { type: "uuid", notNull: true, references: "order_return", onDelete: "CASCADE" },
    order_item_id: { type: "uuid", notNull: true, references: "order_item", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true },
    return_reason: { type: "return_reason", notNull: true },
    return_reason_detail: { type: "text" }, // Detailed reason
    condition: { 
      type: "varchar(50)", 
      notNull: true,
      check: "condition IN ('new', 'like_new', 'used', 'damaged', 'unsellable')" 
    },
    restock_item: { type: "boolean", notNull: true, default: false },
    refund_amount: { type: "decimal(15,2)" }, // Amount to refund for this item
    exchange_product_id: { type: "uuid", references: "product" }, // For exchange returns
    exchange_variant_id: { type: "uuid", references: "product_variant" }, // For exchange returns
    metadata: { type: "jsonb" },
    notes: { type: "text" },
    inspection_notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order return items
  pgm.createIndex("order_return_item", "return_id");
  pgm.createIndex("order_return_item", "order_item_id");
  pgm.createIndex("order_return_item", "return_reason");
  pgm.createIndex("order_return_item", "condition");
  pgm.createIndex("order_return_item", "restock_item");
  pgm.createIndex("order_return_item", "exchange_product_id");
  pgm.createIndex("order_return_item", "exchange_variant_id");

  // Insert sample fulfillment data
  pgm.sql(`
    WITH sample_order AS (
      SELECT id FROM "order" LIMIT 1
    ),
    sample_items AS (
      SELECT id FROM "order_item" WHERE order_id = (SELECT id FROM sample_order) LIMIT 2
    ),
    new_fulfillment AS (
      INSERT INTO "order_fulfillment" (
        order_id,
        fulfillment_number,
        status,
        provider,
        carrier,
        service_level,
        tracking_number,
        tracking_url,
        shipping_address,
        shipping_cost,
        shipping_method
      )
      VALUES (
        (SELECT id FROM sample_order),
        'FUL-' || SUBSTRING(CAST(gen_random_uuid() AS TEXT), 1, 8),
        'pending',
        'self',
        'fedex',
        'Ground',
        '794635052364',
        'https://www.fedex.com/apps/fedextrack/?tracknumbers=794635052364',
        '{"firstName": "Sample", "lastName": "Customer", "address1": "123 Main St", "city": "Anytown", "state": "CA", "zip": "90210", "country": "US"}',
        5.99,
        'Standard Shipping'
      )
      RETURNING id
    )
    INSERT INTO "order_fulfillment_item" (
      fulfillment_id,
      order_item_id,
      quantity
    )
    SELECT 
      (SELECT id FROM new_fulfillment),
      id,
      1
    FROM sample_items
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("order_return_item");
  pgm.dropTable("order_return");
  pgm.dropTable("fulfillment_status_history");
  pgm.dropTable("shipping_rate");
  pgm.dropTable("order_fulfillment_package");
  pgm.dropTable("order_fulfillment_item");
  pgm.dropTable("order_fulfillment");
  pgm.dropType("return_status");
  pgm.dropType("return_reason");
  pgm.dropType("fulfillment_provider");
  pgm.dropType("shipping_carrier");
  pgm.dropType("shipment_status");
};
