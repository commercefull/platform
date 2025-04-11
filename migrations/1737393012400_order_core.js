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
    order_number: { type: "varchar(50)", notNull: true, unique: true }, // Human-readable order number
    customer_id: { type: "uuid", references: "customer" }, // Nullable for guest checkout
    basket_id: { type: "uuid", references: "basket" }, // Original basket
    status: { type: "order_status", notNull: true, default: "pending" },
    payment_status: { type: "payment_status", notNull: true, default: "pending" },
    fulfillment_status: { type: "fulfillment_status", notNull: true, default: "unfulfilled" },
    currency_code: { type: "varchar(3)", notNull: true, default: "USD" },
    subtotal: { type: "decimal(15,2)", notNull: true, default: 0 }, // Sum of line items before discounts/tax
    discount_total: { type: "decimal(15,2)", notNull: true, default: 0 }, // Total discounts
    tax_total: { type: "decimal(15,2)", notNull: true, default: 0 }, // Total tax
    shipping_total: { type: "decimal(15,2)", notNull: true, default: 0 }, // Total shipping
    handling_fee: { type: "decimal(15,2)", notNull: true, default: 0 }, // Handling/processing fee
    total_amount: { type: "decimal(15,2)", notNull: true, default: 0 }, // Final order total
    total_items: { type: "integer", notNull: true, default: 0 }, // Number of items
    total_quantity: { type: "integer", notNull: true, default: 0 }, // Total quantity
    tax_exempt: { type: "boolean", notNull: true, default: false },
    order_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    completed_at: { type: "timestamp" },
    cancelled_at: { type: "timestamp" },
    returned_at: { type: "timestamp" },
    shipping_address_id: { type: "uuid", references: "customer_address" },
    billing_address_id: { type: "uuid", references: "customer_address" },
    shipping_address: { type: "jsonb" }, // Copy of shipping address at time of order
    billing_address: { type: "jsonb" }, // Copy of billing address at time of order
    customer_email: { type: "varchar(255)", notNull: true },
    customer_phone: { type: "varchar(50)" },
    customer_name: { type: "varchar(100)" },
    customer_notes: { type: "text" }, // Customer order notes
    admin_notes: { type: "text" }, // Admin order notes
    ip_address: { type: "varchar(45)" },
    user_agent: { type: "text" },
    referral_source: { type: "varchar(255)" },
    estimated_delivery_date: { type: "timestamp" },
    has_gift_wrapping: { type: "boolean", notNull: true, default: false },
    gift_message: { type: "text" },
    is_gift: { type: "boolean", notNull: true, default: false },
    is_subscription_order: { type: "boolean", notNull: true, default: false },
    parent_order_id: { type: "uuid", references: "order" }, // For subscription reorders
    tags: { type: "text[]" },
    metadata: { type: "jsonb", default: "{}" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for orders
  pgm.createIndex("order", "order_number");
  pgm.createIndex("order", "customer_id");
  pgm.createIndex("order", "basket_id");
  pgm.createIndex("order", "status");
  pgm.createIndex("order", "payment_status");
  pgm.createIndex("order", "fulfillment_status");
  pgm.createIndex("order", "order_date");
  pgm.createIndex("order", "shipping_address_id");
  pgm.createIndex("order", "billing_address_id");
  pgm.createIndex("order", "customer_email");
  pgm.createIndex("order", "is_subscription_order");
  pgm.createIndex("order", "parent_order_id");
  pgm.createIndex("order", "tags", { method: "gin" });

  // Create order item table
  pgm.createTable("order_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    product_id: { type: "uuid", references: "product" },
    variant_id: { type: "uuid", references: "product_variant" },
    basket_item_id: { type: "uuid", references: "basket_item" }, // Original basket item
    sku: { type: "varchar(100)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    quantity: { type: "integer", notNull: true },
    unit_price: { type: "decimal(15,2)", notNull: true }, // Original price per unit
    unit_cost: { type: "decimal(15,2)" }, // Cost per unit (for reporting)
    discounted_unit_price: { type: "decimal(15,2)", notNull: true }, // Price after item-level discounts
    line_total: { type: "decimal(15,2)", notNull: true }, // quantity * discountedUnitPrice
    discount_total: { type: "decimal(15,2)", notNull: true, default: 0 }, // Discounts applied to this item
    tax_total: { type: "decimal(15,2)", notNull: true, default: 0 }, // Tax for this item
    tax_rate: { type: "decimal(6,4)", default: 0 }, // Tax rate applied
    tax_exempt: { type: "boolean", notNull: true, default: false },
    options: { type: "jsonb" }, // Product options/customizations
    attributes: { type: "jsonb" }, // Product attributes at time of order
    fulfillment_status: { type: "fulfillment_status", notNull: true, default: "unfulfilled" },
    gift_wrapped: { type: "boolean", notNull: true, default: false },
    gift_message: { type: "text" },
    weight: { type: "decimal(10,2)" }, // Weight in oz/g
    dimensions: { type: "jsonb" }, // Length, width, height
    is_digital: { type: "boolean", notNull: true, default: false },
    download_link: { type: "text" }, // For digital products
    download_expiry_date: { type: "timestamp" },
    download_limit: { type: "integer" },
    subscription_info: { type: "jsonb" }, // For subscription items
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order items
  pgm.createIndex("order_item", "order_id");
  pgm.createIndex("order_item", "product_id");
  pgm.createIndex("order_item", "variant_id");
  pgm.createIndex("order_item", "basket_item_id");
  pgm.createIndex("order_item", "sku");
  pgm.createIndex("order_item", "fulfillment_status");
  pgm.createIndex("order_item", "is_digital");

  // Create order discount table
  pgm.createTable("order_discount", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    order_item_id: { type: "uuid", references: "order_item", onDelete: "CASCADE" }, // NULL for order-level discounts
    code: { type: "varchar(100)" }, // Coupon/promo code
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    type: { 
      type: "varchar(50)", 
      notNull: true,
      check: "type IN ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'gift_card')" 
    },
    value: { type: "decimal(15,2)", notNull: true }, // Amount or percentage
    discount_amount: { type: "decimal(15,2)", notNull: true }, // Actual discount applied
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order discounts
  pgm.createIndex("order_discount", "order_id");
  pgm.createIndex("order_discount", "order_item_id");
  pgm.createIndex("order_discount", "code");
  pgm.createIndex("order_discount", "type");

  // Create order status history table
  pgm.createTable("order_status_history", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    status: { type: "order_status", notNull: true },
    previous_status: { type: "order_status" },
    notes: { type: "text" },
    created_by: { type: "varchar(255)" }, // User ID or system
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order status history
  pgm.createIndex("order_status_history", "order_id");
  pgm.createIndex("order_status_history", "status");
  pgm.createIndex("order_status_history", "created_at");

  // Create order note table
  pgm.createTable("order_note", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    content: { type: "text", notNull: true },
    is_customer_visible: { type: "boolean", notNull: true, default: false }, // Note visible to customer?
    created_by: { type: "varchar(255)" }, // User ID or system
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order notes
  pgm.createIndex("order_note", "order_id");
  pgm.createIndex("order_note", "is_customer_visible");
  pgm.createIndex("order_note", "created_at");

  // Create order tax table
  pgm.createTable("order_tax", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    order_item_id: { type: "uuid", references: "order_item", onDelete: "CASCADE" }, // NULL for order-level taxes
    tax_type: { type: "varchar(50)", notNull: true }, // sales, vat, etc.
    name: { type: "varchar(255)", notNull: true },
    rate: { type: "decimal(6,4)", notNull: true }, // Tax rate percentage
    amount: { type: "decimal(15,2)", notNull: true }, // Tax amount
    jurisdiction: { type: "varchar(255)" }, // Tax jurisdiction
    tax_provider: { type: "varchar(255)" }, // Tax calculation provider info
    provider_tax_id: { type: "varchar(255)" }, // ID from the tax provider
    is_included_in_price: { type: "boolean", notNull: true, default: false }, // Tax included in price?
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order taxes
  pgm.createIndex("order_tax", "order_id");
  pgm.createIndex("order_tax", "order_item_id");
  pgm.createIndex("order_tax", "tax_type");

  // Create order shipping table
  pgm.createTable("order_shipping", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    order_id: { type: "uuid", notNull: true, references: "order", onDelete: "CASCADE" },
    shipping_method: { type: "varchar(100)", notNull: true }, // Name of shipping method
    carrier: { type: "varchar(100)" }, // Shipping carrier
    service: { type: "varchar(100)" }, // Specific service level
    amount: { type: "decimal(15,2)", notNull: true }, // Shipping cost
    tax_amount: { type: "decimal(15,2)" }, // Tax on shipping
    tracking_number: { type: "varchar(100)" },
    tracking_url: { type: "text" },
    estimated_delivery_date: { type: "timestamp" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for order shipping
  pgm.createIndex("order_shipping", "order_id");
  pgm.createIndex("order_shipping", "shipping_method");
  pgm.createIndex("order_shipping", "carrier");
  pgm.createIndex("order_shipping", "tracking_number");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop order shipping table
  pgm.dropTable("order_shipping", { ifExists: true, cascade: true });
  
  // Drop order tax table
  pgm.dropTable("order_tax", { ifExists: true, cascade: true });
  
  // Drop order note table
  pgm.dropTable("order_note", { ifExists: true, cascade: true });
  
  // Drop order status history table
  pgm.dropTable("order_status_history", { ifExists: true, cascade: true });
  
  // Drop order discount table
  pgm.dropTable("order_discount", { ifExists: true, cascade: true });
  
  // Drop order item table
  pgm.dropTable("order_item", { ifExists: true, cascade: true });
  
  // Drop order table
  pgm.dropTable("order", { ifExists: true, cascade: true });
  
  // Drop fulfillment status enum
  pgm.dropType("fulfillment_status", { ifExists: true, cascade: true });
  
  // Drop payment status enum
  pgm.dropType("payment_status", { ifExists: true, cascade: true });
  
  // Drop order status enum
  pgm.dropType("order_status", { ifExists: true, cascade: true });
};
