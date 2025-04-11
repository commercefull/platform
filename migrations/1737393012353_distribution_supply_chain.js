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
  // Create supplier table
  pgm.createTable("supplier", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    code: { type: "varchar(20)", notNull: true, unique: true }, // Supplier code
    description: { type: "text" },
    website: { type: "varchar(255)" },
    email: { type: "varchar(255)" },
    phone: { type: "varchar(30)" },
    is_active: { type: "boolean", notNull: true, default: true },
    is_approved: { type: "boolean", notNull: true, default: false },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'inactive', 'pending', 'suspended', 'blacklisted')" 
    },
    rating: { type: "decimal(3,2)" }, // Supplier rating
    tax_id: { type: "varchar(50)" }, // Tax identification number
    payment_terms: { type: "varchar(100)" }, // Net 30, etc.
    payment_method: { type: "varchar(50)" }, // Wire, ACH, etc.
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    min_order_value: { type: "decimal(10,2)" }, // Minimum order value
    lead_time: { type: "integer" }, // Average lead time in days
    notes: { type: "text" },
    categories: { type: "text[]" }, // Product categories supplied
    tags: { type: "text[]" }, // For categorization
    custom_fields: { type: "jsonb" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" }
  });

  // Create indexes for supplier
  pgm.createIndex("supplier", "code");
  pgm.createIndex("supplier", "is_active");
  pgm.createIndex("supplier", "is_approved");
  pgm.createIndex("supplier", "status");
  pgm.createIndex("supplier", "rating");
  pgm.createIndex("supplier", "lead_time");
  pgm.createIndex("supplier", "categories", { method: "gin" });
  pgm.createIndex("supplier", "tags", { method: "gin" });

  // Create supplier address table
  pgm.createTable("supplier_address", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    supplier_id: { type: "uuid", notNull: true, references: "supplier", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true }, // Address name (Headquarters, Warehouse, etc.)
    address_line1: { type: "varchar(255)", notNull: true },
    address_line2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)", notNull: true },
    postal_code: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    address_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'headquarters',
      check: "address_type IN ('headquarters', 'billing', 'warehouse', 'returns', 'manufacturing')" 
    },
    is_default: { type: "boolean", notNull: true, default: false },
    contact_name: { type: "varchar(100)" },
    contact_email: { type: "varchar(255)" },
    contact_phone: { type: "varchar(30)" },
    notes: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for supplier addresses
  pgm.createIndex("supplier_address", "supplier_id");
  pgm.createIndex("supplier_address", "address_type");
  pgm.createIndex("supplier_address", "is_default");
  pgm.createIndex("supplier_address", "is_active");
  pgm.createIndex("supplier_address", ["supplier_id", "address_type", "is_default"], {
    unique: true,
    where: "is_default = true"
  });

  // Create supplier_product table (connecting suppliers to products)
  pgm.createTable("supplier_product", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    supplier_id: { type: "uuid", notNull: true, references: "supplier", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true }, // Our SKU
    supplier_sku: { type: "varchar(100)" }, // Supplier's SKU
    supplier_product_name: { type: "varchar(255)" }, // Supplier's product name
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'inactive', 'discontinued', 'pending')" 
    },
    is_preferred: { type: "boolean", notNull: true, default: false }, // Preferred supplier for this product
    unit_cost: { type: "decimal(10,2)", notNull: true }, // Cost per unit
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    minimum_order_quantity: { type: "integer", default: 1 }, // MOQ
    lead_time: { type: "integer" }, // Lead time in days
    packaging_info: { type: "jsonb" }, // Units per pack, etc.
    dimensions: { type: "jsonb" }, // Product dimensions from supplier
    weight: { type: "decimal(10,2)" }, // Weight per unit
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    last_ordered_at: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for supplier products
  pgm.createIndex("supplier_product", "supplier_id");
  pgm.createIndex("supplier_product", "product_id");
  pgm.createIndex("supplier_product", "variant_id");
  pgm.createIndex("supplier_product", "sku");
  pgm.createIndex("supplier_product", "supplier_sku");
  pgm.createIndex("supplier_product", "status");
  pgm.createIndex("supplier_product", "is_preferred");
  pgm.createIndex("supplier_product", "unit_cost");
  pgm.createIndex("supplier_product", "lead_time");
  pgm.createIndex("supplier_product", ["product_id", "variant_id", "supplier_id"], { 
    unique: true,
    nulls: "not distinct"
  });
  pgm.createIndex("supplier_product", ["product_id", "variant_id", "is_preferred"], {
    unique: true,
    where: "is_preferred = true",
    nulls: "not distinct"
  });

  // Create purchase order table
  pgm.createTable("purchase_order", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    po_number: { type: "varchar(50)", notNull: true, unique: true }, // Purchase order number
    supplier_id: { type: "uuid", notNull: true, references: "supplier" },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse" }, // Destination warehouse
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'draft',
      check: "status IN ('draft', 'pending', 'approved', 'sent', 'confirmed', 'partial', 'completed', 'cancelled')" 
    },
    order_type: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'standard',
      check: "order_type IN ('standard', 'restock', 'backorder', 'special', 'emergency')" 
    },
    priority: { 
      type: "varchar(10)", 
      notNull: true, 
      default: 'normal',
      check: "priority IN ('low', 'normal', 'high', 'urgent')" 
    },
    order_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expected_delivery_date: { type: "timestamp" },
    delivery_date: { type: "timestamp" },
    shipping_method: { type: "varchar(50)" },
    tracking_number: { type: "varchar(100)" },
    carrier_name: { type: "varchar(100)" },
    payment_terms: { type: "varchar(100)" },
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    subtotal: { type: "decimal(15,2)", notNull: true, default: 0 },
    tax: { type: "decimal(15,2)", notNull: true, default: 0 },
    shipping: { type: "decimal(15,2)", notNull: true, default: 0 },
    discount: { type: "decimal(15,2)", notNull: true, default: 0 },
    total: { 
      type: "decimal(15,2)", 
      notNull: true, 
      default: 0,
      check: "total = subtotal + tax + shipping - discount"
    },
    notes: { type: "text" },
    supplier_notes: { type: "text" }, // Notes visible to supplier
    attachments: { type: "jsonb" }, // Attached documents
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" },
    approved_at: { type: "timestamp" },
    approved_by: { type: "uuid" },
    sent_at: { type: "timestamp" },
    confirmed_at: { type: "timestamp" },
    completed_at: { type: "timestamp" }
  });

  // Create indexes for purchase orders
  pgm.createIndex("purchase_order", "po_number");
  pgm.createIndex("purchase_order", "supplier_id");
  pgm.createIndex("purchase_order", "warehouse_id");
  pgm.createIndex("purchase_order", "status");
  pgm.createIndex("purchase_order", "order_type");
  pgm.createIndex("purchase_order", "priority");
  pgm.createIndex("purchase_order", "order_date");
  pgm.createIndex("purchase_order", "expected_delivery_date");
  pgm.createIndex("purchase_order", "delivery_date");
  pgm.createIndex("purchase_order", "total");
  pgm.createIndex("purchase_order", "created_at");

  // Create purchase order item table
  pgm.createTable("purchase_order_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    purchase_order_id: { type: "uuid", notNull: true, references: "purchase_order", onDelete: "CASCADE" },
    supplier_product_id: { type: "uuid", references: "supplier_product" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true }, // Our SKU
    supplier_sku: { type: "varchar(100)" }, // Supplier's SKU
    name: { type: "varchar(255)", notNull: true }, // Product name
    description: { type: "text" },
    quantity: { type: "integer", notNull: true },
    received_quantity: { type: "integer", notNull: true, default: 0 },
    unit_cost: { type: "decimal(10,2)", notNull: true },
    tax: { type: "decimal(10,2)", notNull: true, default: 0 },
    discount: { type: "decimal(10,2)", notNull: true, default: 0 },
    total: { 
      type: "decimal(15,2)", 
      notNull: true,
      check: "total = (quantity * unit_cost) + tax - discount"
    },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'partial', 'received', 'cancelled', 'backordered')" 
    },
    expected_delivery_date: { type: "timestamp" },
    received_at: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for purchase order items
  pgm.createIndex("purchase_order_item", "purchase_order_id");
  pgm.createIndex("purchase_order_item", "supplier_product_id");
  pgm.createIndex("purchase_order_item", "product_id");
  pgm.createIndex("purchase_order_item", "variant_id");
  pgm.createIndex("purchase_order_item", "sku");
  pgm.createIndex("purchase_order_item", "supplier_sku");
  pgm.createIndex("purchase_order_item", "status");
  pgm.createIndex("purchase_order_item", "quantity");
  pgm.createIndex("purchase_order_item", "received_quantity");
  pgm.createIndex("purchase_order_item", "expected_delivery_date");
  pgm.createIndex("purchase_order_item", "received_at");

  // Create receiving record table
  pgm.createTable("receiving_record", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    receipt_number: { type: "varchar(50)", notNull: true, unique: true },
    purchase_order_id: { type: "uuid", references: "purchase_order" },
    warehouse_id: { type: "uuid", notNull: true, references: "warehouse" },
    supplier_id: { type: "uuid", notNull: true, references: "supplier" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'in_progress', 'completed', 'cancelled', 'disputed')" 
    },
    received_date: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    carrier_name: { type: "varchar(100)" },
    tracking_number: { type: "varchar(100)" },
    package_count: { type: "integer" },
    notes: { type: "text" },
    discrepancies: { type: "boolean", notNull: true, default: false }, // Whether any discrepancies found
    attachments: { type: "jsonb" }, // Attached documents
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    created_by: { type: "uuid" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_by: { type: "uuid" },
    completed_at: { type: "timestamp" },
    completed_by: { type: "uuid" }
  });

  // Create indexes for receiving records
  pgm.createIndex("receiving_record", "receipt_number");
  pgm.createIndex("receiving_record", "purchase_order_id");
  pgm.createIndex("receiving_record", "warehouse_id");
  pgm.createIndex("receiving_record", "supplier_id");
  pgm.createIndex("receiving_record", "status");
  pgm.createIndex("receiving_record", "received_date");
  pgm.createIndex("receiving_record", "tracking_number");
  pgm.createIndex("receiving_record", "discrepancies");
  pgm.createIndex("receiving_record", "created_at");

  // Create receiving item table
  pgm.createTable("receiving_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    receiving_record_id: { type: "uuid", notNull: true, references: "receiving_record", onDelete: "CASCADE" },
    purchase_order_item_id: { type: "uuid", references: "purchase_order_item" },
    product_id: { type: "uuid", notNull: true }, // Reference to product
    variant_id: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true }, // Our SKU
    name: { type: "varchar(255)", notNull: true }, // Product name
    expected_quantity: { type: "integer" }, // Expected quantity based on PO
    received_quantity: { type: "integer", notNull: true }, // Actual received quantity
    rejected_quantity: { type: "integer", notNull: true, default: 0 }, // Quantity rejected
    bin_id: { type: "uuid", references: "warehouse_bin" }, // Storage location
    lot_number: { type: "varchar(100)" },
    serial_numbers: { type: "text[]" }, // Array of serial numbers
    expiry_date: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'received',
      check: "status IN ('received', 'inspecting', 'accepted', 'rejected', 'partial')" 
    },
    acceptance_status: { 
      type: "varchar(20)", 
      default: 'pending',
      check: "acceptance_status IN ('pending', 'accepted', 'rejected', 'partial')" 
    },
    inspection_notes: { type: "text" },
    discrepancy_reason: { type: "varchar(255)" },
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    processed_at: { type: "timestamp" },
    processed_by: { type: "uuid" }
  });

  // Create indexes for receiving items
  pgm.createIndex("receiving_item", "receiving_record_id");
  pgm.createIndex("receiving_item", "purchase_order_item_id");
  pgm.createIndex("receiving_item", "product_id");
  pgm.createIndex("receiving_item", "variant_id");
  pgm.createIndex("receiving_item", "sku");
  pgm.createIndex("receiving_item", "bin_id");
  pgm.createIndex("receiving_item", "lot_number");
  pgm.createIndex("receiving_item", "expiry_date");
  pgm.createIndex("receiving_item", "status");
  pgm.createIndex("receiving_item", "acceptance_status");
  pgm.createIndex("receiving_item", "created_at");
  pgm.createIndex("receiving_item", "serial_numbers", { method: "gin" });

  // Insert default supplier
  pgm.sql(`
    INSERT INTO "supplier" (
      name, 
      code, 
      description, 
      is_active, 
      is_approved,
      status,
      payment_terms,
      currency,
      categories
    )
    VALUES (
      'Sample Supplier Inc.', 
      'SAMPLE', 
      'Default sample supplier for testing', 
      true,
      true,
      'active',
      'Net 30',
      'USD',
      ARRAY['General', 'Electronics', 'Apparel']
    )
  `);

  // Insert default supplier address
  pgm.sql(`
    WITH sample_supplier AS (SELECT id FROM supplier WHERE code = 'SAMPLE')
    INSERT INTO "supplier_address" (
      supplier_id,
      name, 
      address_line1, 
      city, 
      state, 
      postal_code,
      country,
      address_type,
      is_default,
      is_active
    )
    VALUES (
      (SELECT id FROM sample_supplier),
      'Headquarters',
      '123 Supplier St',
      'Suppliertown',
      'State',
      '12345',
      'US',
      'headquarters',
      true,
      true
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("receiving_item");
  pgm.dropTable("receiving_record");
  pgm.dropTable("purchase_order_item");
  pgm.dropTable("purchase_order");
  pgm.dropTable("supplier_product");
  pgm.dropTable("supplier_address");
  pgm.dropTable("supplier");
};
