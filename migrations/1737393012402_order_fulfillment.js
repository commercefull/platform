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
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    warehouseId: { type: "uuid", references: "warehouse" },
    fulfillmentNumber: { type: "varchar(50)", notNull: true, unique: true }, // Human-readable fulfillment number
    status: { type: "shipment_status", notNull: true, default: "pending" },
    provider: { type: "fulfillment_provider", notNull: true, default: "self" },
    carrier: { type: "shipping_carrier" },
    serviceLevel: { type: "varchar(100)" }, // e.g., "Ground", "2-Day Air"
    trackingNumber: { type: "varchar(100)" },
    trackingUrl: { type: "text" },
    labelUrl: { type: "text" }, // URL to shipping label
    manifestId: { type: "varchar(100)" }, // Shipping manifest ID
    shippingAddressId: { type: "uuid", references: "customer_address" },
    shippingAddress: { type: "jsonb", notNull: true }, // Copy of shipping address at time of fulfillment
    shippingCost: { type: "decimal(15,2)" },
    packageCount: { type: "integer", default: 1 },
    totalWeight: { type: "decimal(10,2)" }, // Total weight of all packages
    dimensions: { type: "jsonb" }, // Combined dimensions
    packagingType: { type: "varchar(50)" }, // Type of packaging used
    shippingMethod: { type: "varchar(100)" },
    instructions: { type: "text" }, // Special handling instructions
    notes: { type: "text" }, // Internal notes
    metadata: { type: "jsonb" },
    createdBy: { type: "varchar(255)" }, // User who created the fulfillment
    fulfillmentData: { type: "jsonb" }, // Additional data from the fulfillment provider
    estimatedDeliveryDate: { type: "timestamp" },
    shippedAt: { type: "timestamp" }, // When the fulfillment was shipped
    deliveredAt: { type: "timestamp" }, // When the fulfillment was delivered
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for fulfillment
  pgm.createIndex("order_fulfillment", "orderId");
  pgm.createIndex("order_fulfillment", "warehouseId");
  pgm.createIndex("order_fulfillment", "fulfillmentNumber");
  pgm.createIndex("order_fulfillment", "status");
  pgm.createIndex("order_fulfillment", "provider");
  pgm.createIndex("order_fulfillment", "carrier");
  pgm.createIndex("order_fulfillment", "trackingNumber");
  pgm.createIndex("order_fulfillment", "shippingAddressId");
  pgm.createIndex("order_fulfillment", "shippedAt");
  pgm.createIndex("order_fulfillment", "deliveredAt");
  pgm.createIndex("order_fulfillment", "estimatedDeliveryDate");
  pgm.createIndex("order_fulfillment", "createdAt");

  // Create fulfillment item table
  pgm.createTable("order_fulfillment_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    fulfillmentId: { type: "uuid", notNull: true, references: "order_fulfillment", onDelete: "CASCADE" },
    orderItemId: { type: "uuid", notNull: true, references: "order_item", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true },
    inventoryItemId: { type: "uuid", references: "inventory_item" },
    warehouseLocationId: { type: "uuid", references: "warehouse_location" },
    lotNumber: { type: "varchar(100)" }, // Batch/lot for items with expiry dates
    serialNumber: { type: "varchar(100)" }, // For serialized products
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for fulfillment items
  pgm.createIndex("order_fulfillment_item", "fulfillmentId");
  pgm.createIndex("order_fulfillment_item", "orderItemId");
  pgm.createIndex("order_fulfillment_item", "inventoryItemId");
  pgm.createIndex("order_fulfillment_item", "warehouseLocationId");
  pgm.createIndex("order_fulfillment_item", "lotNumber");
  pgm.createIndex("order_fulfillment_item", "serialNumber");

  // Create fulfillment package table
  pgm.createTable("order_fulfillment_package", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    fulfillmentId: { type: "uuid", notNull: true, references: "order_fulfillment", onDelete: "CASCADE" },
    packageNumber: { type: "varchar(50)", notNull: true }, // Human-readable package identifier
    trackingNumber: { type: "varchar(100)" }, // Individual package tracking number
    weight: { type: "decimal(10,2)" }, // Weight in oz/g
    dimensions: { type: "jsonb" }, // Length, width, height
    packageType: { type: "varchar(50)" }, // Box, envelope, etc.
    shippingLabelUrl: { type: "text" },
    commercialInvoiceUrl: { type: "text" }, // For international shipments
    customsInfo: { type: "jsonb" }, // For international shipments
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for fulfillment packages
  pgm.createIndex("order_fulfillment_package", "fulfillmentId");
  pgm.createIndex("order_fulfillment_package", "packageNumber");
  pgm.createIndex("order_fulfillment_package", "trackingNumber");

  // Create shipping rate table
  pgm.createTable("shipping_rate", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    carrier: { type: "shipping_carrier", notNull: true },
    serviceLevel: { type: "varchar(100)", notNull: true }, // e.g., "Ground", "2-Day Air"
    serviceName: { type: "varchar(255)", notNull: true }, // Display name for the service
    rate: { type: "decimal(15,2)", notNull: true }, // Cost of shipping
    estimatedDays: { type: "integer" }, // Estimated transit time in days
    estimatedDeliveryDate: { type: "timestamp" },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    isSelected: { type: "boolean", notNull: true, default: false }, // Whether this rate was chosen
    carrierAccountId: { type: "varchar(100)" }, // Carrier account ID
    shipmentId: { type: "varchar(100)" }, // ID from shipping API
    metadata: { type: "jsonb" },
    rateData: { type: "jsonb" }, // Full rate data from carrier API
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for shipping rates
  pgm.createIndex("shipping_rate", "orderId");
  pgm.createIndex("shipping_rate", "carrier");
  pgm.createIndex("shipping_rate", "serviceLevel");
  pgm.createIndex("shipping_rate", "rate");
  pgm.createIndex("shipping_rate", "estimatedDays");
  pgm.createIndex("shipping_rate", "isSelected");
  pgm.createIndex("shipping_rate", "shipmentId");
  pgm.createIndex("shipping_rate", "createdAt");

  // Create fulfillment status history table
  pgm.createTable("fulfillment_status_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    fulfillmentId: { type: "uuid", notNull: true, references: "order_fulfillment", onDelete: "CASCADE" },
    status: { type: "shipment_status", notNull: true },
    previousStatus: { type: "shipment_status" },
    notes: { type: "text" },
    location: { type: "varchar(255)" }, // Location where the status was updated
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "varchar(255)" } // User who updated the status
  });

  // Create indexes for fulfillment status history
  pgm.createIndex("fulfillment_status_history", "fulfillmentId");
  pgm.createIndex("fulfillment_status_history", "status");
  pgm.createIndex("fulfillment_status_history", "createdAt");

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
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    returnNumber: { type: "varchar(50)", notNull: true, unique: true }, // Human-readable return number
    customerId: { type: "uuid", references: "customer" },
    status: { type: "return_status", notNull: true, default: "requested" },
    returnType: { 
      type: "varchar(50)", 
      notNull: true,
      check: "returnType IN ('refund', 'exchange', 'store_credit', 'repair')" 
    },
    requestedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    approvedAt: { type: "timestamp" },
    receivedAt: { type: "timestamp" },
    completedAt: { type: "timestamp" },
    rmaNumber: { type: "varchar(100)" }, // Return Merchandise Authorization number
    refundId: { type: "uuid", references: "order_refund" },
    returnShippingPaid: { type: "boolean", notNull: true, default: false }, // Whether return shipping was paid for
    returnShippingAmount: { type: "decimal(15,2)" }, // Cost of return shipping
    returnShippingLabel: { type: "text" }, // URL to return shipping label
    returnCarrier: { type: "shipping_carrier" },
    returnTrackingNumber: { type: "varchar(100)" },
    returnTrackingUrl: { type: "text" },
    returnReason: { type: "text" },
    returnInstructions: { type: "text" },
    customerNotes: { type: "text" }, // Notes from customer
    adminNotes: { type: "text" }, // Internal notes
    requiresInspection: { type: "boolean", notNull: true, default: true },
    inspectionPassedItems: { type: "jsonb" }, // Items that passed inspection
    inspectionFailedItems: { type: "jsonb" }, // Items that failed inspection
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order returns
  pgm.createIndex("order_return", "orderId");
  pgm.createIndex("order_return", "returnNumber");
  pgm.createIndex("order_return", "customerId");
  pgm.createIndex("order_return", "status");
  pgm.createIndex("order_return", "returnType");
  pgm.createIndex("order_return", "requestedAt");
  pgm.createIndex("order_return", "approvedAt");
  pgm.createIndex("order_return", "receivedAt");
  pgm.createIndex("order_return", "completedAt");
  pgm.createIndex("order_return", "rmaNumber");
  pgm.createIndex("order_return", "refundId");
  pgm.createIndex("order_return", "returnTrackingNumber");
  pgm.createIndex("order_return", "createdAt");

  // Create order return item table
  pgm.createTable("order_return_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    returnId: { type: "uuid", notNull: true, references: "order_return", onDelete: "CASCADE" },
    orderItemId: { type: "uuid", notNull: true, references: "order_item", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true },
    returnReason: { type: "return_reason", notNull: true },
    returnReasonDetail: { type: "text" }, // Detailed reason
    condition: { 
      type: "varchar(50)", 
      notNull: true,
      check: "condition IN ('new', 'like_new', 'used', 'damaged', 'unsellable')" 
    },
    restockItem: { type: "boolean", notNull: true, default: false },
    refundAmount: { type: "decimal(15,2)" }, // Amount to refund for this item
    exchangeProductId: { type: "uuid", references: "product" }, // For exchange returns
    exchangeVariantId: { type: "uuid", references: "product_variant" }, // For exchange returns
    metadata: { type: "jsonb" },
    notes: { type: "text" },
    inspectionNotes: { type: "text" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order return items
  pgm.createIndex("order_return_item", "returnId");
  pgm.createIndex("order_return_item", "orderItemId");
  pgm.createIndex("order_return_item", "returnReason");
  pgm.createIndex("order_return_item", "condition");
  pgm.createIndex("order_return_item", "restockItem");
  pgm.createIndex("order_return_item", "exchangeProductId");
  pgm.createIndex("order_return_item", "exchangeVariantId");

  // Insert sample fulfillment data
  pgm.sql(`
    WITH sample_order AS (
      SELECT id FROM "order" LIMIT 1
    ),
    sample_items AS (
      SELECT id FROM "order_item" WHERE orderId = (SELECT id FROM sample_order) LIMIT 2
    ),
    new_fulfillment AS (
      INSERT INTO "order_fulfillment" (
        orderId,
        fulfillmentNumber,
        status,
        provider,
        carrier,
        serviceLevel,
        trackingNumber,
        trackingUrl,
        shippingAddress,
        shippingCost,
        shippingMethod
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
      fulfillmentId,
      orderItemId,
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
