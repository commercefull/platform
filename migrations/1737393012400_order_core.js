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
  // Create order status enum
  pgm.createType("order_status", [
    "pending",
    "processing",
    "on_hold",
    "completed",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
    "failed",
    "payment_pending",
    "payment_failed",
    "backordered"
  ]);
  
  // Create payment status enum
  pgm.createType("payment_status", [
    "pending",
    "authorized",
    "paid",
    "partially_paid",
    "partially_refunded",
    "refunded",
    "failed",
    "voided",
    "requires_action"
  ]);

  // Create fulfillment status enum
  pgm.createType("fulfillment_status", [
    "unfulfilled",
    "partially_fulfilled",
    "fulfilled",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
    "pending_pickup",
    "picked_up"
  ]);

  // Create main order table
  pgm.createTable("order", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderNumber: { type: "varchar(50)", notNull: true, unique: true }, // Human-readable order number
    customerId: { type: "uuid", references: "customer" }, // Nullable for guest checkout
    basketId: { type: "uuid", references: "basket" }, // Original basket
    status: { type: "order_status", notNull: true, default: "pending" },
    paymentStatus: { type: "payment_status", notNull: true, default: "pending" },
    fulfillmentStatus: { type: "fulfillment_status", notNull: true, default: "unfulfilled" },
    currencyCode: { type: "varchar(3)", notNull: true, default: "USD" },
    subtotal: { type: "decimal(15,2)", notNull: true, default: 0 }, // Sum of line items before discounts/tax
    discountTotal: { type: "decimal(15,2)", notNull: true, default: 0 }, // Total discounts
    taxTotal: { type: "decimal(15,2)", notNull: true, default: 0 }, // Total tax
    shippingTotal: { type: "decimal(15,2)", notNull: true, default: 0 }, // Total shipping
    handlingFee: { type: "decimal(15,2)", notNull: true, default: 0 }, // Handling/processing fee
    totalAmount: { type: "decimal(15,2)", notNull: true, default: 0 }, // Final order total
    totalItems: { type: "integer", notNull: true, default: 0 }, // Number of items
    totalQuantity: { type: "integer", notNull: true, default: 0 }, // Total quantity
    taxExempt: { type: "boolean", notNull: true, default: false },
    orderDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    completedAt: { type: "timestamp" },
    cancelledAt: { type: "timestamp" },
    returnedAt: { type: "timestamp" },
    shippingAddressId: { type: "uuid", references: "customer_address" },
    billingAddressId: { type: "uuid", references: "customer_address" },
    shippingAddress: { type: "jsonb" }, // Copy of shipping address at time of order
    billingAddress: { type: "jsonb" }, // Copy of billing address at time of order
    customerEmail: { type: "varchar(255)", notNull: true },
    customerPhone: { type: "varchar(50)" },
    customerName: { type: "varchar(100)" },
    customerNotes: { type: "text" }, // Customer order notes
    adminNotes: { type: "text" }, // Admin order notes
    ipAddress: { type: "varchar(45)" },
    userAgent: { type: "text" },
    referralSource: { type: "varchar(255)" },
    estimatedDeliveryDate: { type: "timestamp" },
    hasGiftWrapping: { type: "boolean", notNull: true, default: false },
    giftMessage: { type: "text" },
    isGift: { type: "boolean", notNull: true, default: false },
    isSubscriptionOrder: { type: "boolean", notNull: true, default: false },
    parentOrderId: { type: "uuid", references: "order" }, // For subscription reorders
    tags: { type: "text[]" },
    metadata: { type: "jsonb", default: "{}" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for orders
  pgm.createIndex("order", "orderNumber");
  pgm.createIndex("order", "customerId");
  pgm.createIndex("order", "basketId");
  pgm.createIndex("order", "status");
  pgm.createIndex("order", "paymentStatus");
  pgm.createIndex("order", "fulfillmentStatus");
  pgm.createIndex("order", "orderDate");
  pgm.createIndex("order", "shippingAddressId");
  pgm.createIndex("order", "billingAddressId");
  pgm.createIndex("order", "customerEmail");
  pgm.createIndex("order", "isSubscriptionOrder");
  pgm.createIndex("order", "parentOrderId");
  pgm.createIndex("order", "tags", { method: "gin" });

  // Create order item table
  pgm.createTable("order_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    productId: { type: "uuid", references: "product" },
    variantId: { type: "uuid", references: "product_variant" },
    basketItemId: { type: "uuid", references: "basket_item" }, // Original basket item
    sku: { type: "varchar(100)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    quantity: { type: "integer", notNull: true },
    unitPrice: { type: "decimal(15,2)", notNull: true }, // Original price per unit
    unitCost: { type: "decimal(15,2)" }, // Cost per unit (for reporting)
    discountedUnitPrice: { type: "decimal(15,2)", notNull: true }, // Price after item-level discounts
    lineTotal: { type: "decimal(15,2)", notNull: true }, // quantity * discountedUnitPrice
    discountTotal: { type: "decimal(15,2)", notNull: true, default: 0 }, // Discounts applied to this item
    taxTotal: { type: "decimal(15,2)", notNull: true, default: 0 }, // Tax for this item
    taxRate: { type: "decimal(6,4)", default: 0 }, // Tax rate applied
    taxExempt: { type: "boolean", notNull: true, default: false },
    options: { type: "jsonb" }, // Product options/customizations
    attributes: { type: "jsonb" }, // Product attributes at time of order
    fulfillmentStatus: { type: "fulfillment_status", notNull: true, default: "unfulfilled" },
    giftWrapped: { type: "boolean", notNull: true, default: false },
    giftMessage: { type: "text" },
    weight: { type: "decimal(10,2)" }, // Weight in oz/g
    dimensions: { type: "jsonb" }, // Length, width, height
    isDigital: { type: "boolean", notNull: true, default: false },
    downloadLink: { type: "text" }, // For digital products
    downloadExpiryDate: { type: "timestamp" },
    downloadLimit: { type: "integer" },
    subscriptionInfo: { type: "jsonb" }, // For subscription items
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order items
  pgm.createIndex("order_item", "orderId");
  pgm.createIndex("order_item", "productId");
  pgm.createIndex("order_item", "variantId");
  pgm.createIndex("order_item", "basketItemId");
  pgm.createIndex("order_item", "sku");
  pgm.createIndex("order_item", "fulfillmentStatus");
  pgm.createIndex("order_item", "isDigital");

  // Create order discount table
  pgm.createTable("order_discount", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    orderItemId: { type: "uuid", references: "order_item", onDelete: "CASCADE" }, // NULL for order-level discounts
    code: { type: "varchar(100)" }, // Coupon/promo code
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'gift_card')" 
    },
    value: { type: "decimal(15,2)", notNull: true }, // Amount or percentage
    discountAmount: { type: "decimal(15,2)", notNull: true }, // Actual discount applied
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order discounts
  pgm.createIndex("order_discount", "orderId");
  pgm.createIndex("order_discount", "orderItemId");
  pgm.createIndex("order_discount", "code");
  pgm.createIndex("order_discount", "type");

  // Create order status history table
  pgm.createTable("order_status_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    status: { type: "order_status", notNull: true },
    previousStatus: { type: "order_status" },
    notes: { type: "text" },
    createdBy: { type: "varchar(255)" }, // User ID or system
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order status history
  pgm.createIndex("order_status_history", "orderId");
  pgm.createIndex("order_status_history", "status");
  pgm.createIndex("order_status_history", "createdAt");

  // Create order notes table
  pgm.createTable("order_note", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    content: { type: "text", notNull: true },
    author: { type: "varchar(255)", notNull: true }, // User ID or system
    isPublic: { type: "boolean", notNull: true, default: false }, // Visible to customer
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order notes
  pgm.createIndex("order_note", "orderId");
  pgm.createIndex("order_note", "isPublic");
  pgm.createIndex("order_note", "createdAt");

  // Create order taxes table
  pgm.createTable("order_tax", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    orderId: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    orderItemId: { type: "uuid", references: "order_item", onDelete: "CASCADE" }, // NULL for order-level taxes
    name: { type: "varchar(255)", notNull: true }, // e.g., "State Tax", "VAT"
    rate: { type: "decimal(6,4)", notNull: true }, // Tax rate percentage (e.g., 0.0825 for 8.25%)
    amount: { type: "decimal(15,2)", notNull: true }, // Calculated tax amount
    isIncluded: { type: "boolean", notNull: true, default: false }, // Whether tax is included in item price
    jurisdiction: { type: "varchar(100)" }, // Taxing jurisdiction (state, country, etc.)
    taxCode: { type: "varchar(100)" }, // Tax classification code
    providerId: { type: "varchar(100)" }, // ID from tax provider (Avalara, TaxJar)
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order taxes
  pgm.createIndex("order_tax", "orderId");
  pgm.createIndex("order_tax", "orderItemId");
  pgm.createIndex("order_tax", "jurisdiction");
  pgm.createIndex("order_tax", "taxCode");

  // Insert sample order and items
  pgm.sql(`
    WITH sample_customer AS (
      SELECT 
        id, 
        email 
      FROM customer 
      LIMIT 1
    ),
    new_order AS (
      INSERT INTO "order" (
        orderNumber,
        customerId,
        status,
        paymentStatus,
        fulfillmentStatus,
        subtotal,
        taxTotal,
        shippingTotal,
        totalAmount,
        totalItems,
        totalQuantity,
        customerEmail,
        customerName,
        shippingAddress,
        billingAddress
      )
      VALUES (
        'ORD-' || SUBSTRING(CAST(gen_random_uuid() AS TEXT), 1, 8),
        (SELECT id FROM sample_customer),
        'processing',
        'paid',
        'unfulfilled',
        99.98,
        8.00,
        5.99,
        113.97,
        2,
        2,
        (SELECT email FROM sample_customer),
        'Sample Customer',
        '{"firstName": "Sample", "lastName": "Customer", "address1": "123 Main St", "city": "Anytown", "state": "CA", "zip": "90210", "country": "US"}',
        '{"firstName": "Sample", "lastName": "Customer", "address1": "123 Main St", "city": "Anytown", "state": "CA", "zip": "90210", "country": "US"}'
      )
      RETURNING id
    )
    INSERT INTO "order_item" (
      orderId,
      sku,
      name,
      description,
      quantity, 
      unitPrice,
      discountedUnitPrice,
      lineTotal
    )
    VALUES 
    (
      (SELECT id FROM new_order),
      'PROD-001',
      'Sample Product 1',
      'This is a sample product',
      1,
      49.99,
      49.99,
      49.99
    ),
    (
      (SELECT id FROM new_order),
      'PROD-002',
      'Sample Product 2',
      'This is another sample product',
      1,
      49.99,
      49.99,
      49.99
    )
  `);

  // Insert sample order status history
  pgm.sql(`
    WITH sample_order AS (SELECT id FROM "order" LIMIT 1)
    INSERT INTO "order_status_history" (
      orderId,
      status,
      previousStatus,
      notes,
      createdBy
    )
    VALUES 
    (
      (SELECT id FROM sample_order),
      'pending',
      NULL,
      'Order created',
      'system'
    ),
    (
      (SELECT id FROM sample_order),
      'processing',
      'pending',
      'Payment received, order is being processed',
      'system'
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("order_tax");
  pgm.dropTable("order_note");
  pgm.dropTable("order_status_history");
  pgm.dropTable("order_discount");
  pgm.dropTable("order_item");
  pgm.dropTable("order");
  pgm.dropType("fulfillment_status");
  pgm.dropType("payment_status");
  pgm.dropType("order_status");
};
