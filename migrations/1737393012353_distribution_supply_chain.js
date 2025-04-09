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
    isActive: { type: "boolean", notNull: true, default: true },
    isApproved: { type: "boolean", notNull: true, default: false },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'inactive', 'pending', 'suspended', 'blacklisted')" 
    },
    rating: { type: "decimal(3,2)" }, // Supplier rating
    taxId: { type: "varchar(50)" }, // Tax identification number
    paymentTerms: { type: "varchar(100)" }, // Net 30, etc.
    paymentMethod: { type: "varchar(50)" }, // Wire, ACH, etc.
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    minOrderValue: { type: "decimal(10,2)" }, // Minimum order value
    leadTime: { type: "integer" }, // Average lead time in days
    notes: { type: "text" },
    categories: { type: "text[]" }, // Product categories supplied
    tags: { type: "text[]" }, // For categorization
    customFields: { type: "jsonb" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" }
  });

  // Create indexes for supplier
  pgm.createIndex("supplier", "code");
  pgm.createIndex("supplier", "isActive");
  pgm.createIndex("supplier", "isApproved");
  pgm.createIndex("supplier", "status");
  pgm.createIndex("supplier", "rating");
  pgm.createIndex("supplier", "leadTime");
  pgm.createIndex("supplier", "categories", { method: "gin" });
  pgm.createIndex("supplier", "tags", { method: "gin" });

  // Create supplier address table
  pgm.createTable("supplier_address", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    supplierId: { type: "uuid", notNull: true, references: "supplier", onDelete: "CASCADE" },
    name: { type: "varchar(100)", notNull: true }, // Address name (Headquarters, Warehouse, etc.)
    addressLine1: { type: "varchar(255)", notNull: true },
    addressLine2: { type: "varchar(255)" },
    city: { type: "varchar(100)", notNull: true },
    state: { type: "varchar(100)", notNull: true },
    postalCode: { type: "varchar(20)", notNull: true },
    country: { type: "varchar(2)", notNull: true }, // ISO country code
    addressType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'headquarters',
      check: "addressType IN ('headquarters', 'billing', 'warehouse', 'returns', 'manufacturing')" 
    },
    isDefault: { type: "boolean", notNull: true, default: false },
    contactName: { type: "varchar(100)" },
    contactEmail: { type: "varchar(255)" },
    contactPhone: { type: "varchar(30)" },
    notes: { type: "text" },
    isActive: { type: "boolean", notNull: true, default: true },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for supplier addresses
  pgm.createIndex("supplier_address", "supplierId");
  pgm.createIndex("supplier_address", "addressType");
  pgm.createIndex("supplier_address", "isDefault");
  pgm.createIndex("supplier_address", "isActive");
  pgm.createIndex("supplier_address", ["supplierId", "addressType", "isDefault"], {
    unique: true,
    where: "isDefault = true"
  });

  // Create supplier_product table (connecting suppliers to products)
  pgm.createTable("supplier_product", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    supplierId: { type: "uuid", notNull: true, references: "supplier", onDelete: "CASCADE" },
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true }, // Our SKU
    supplierSku: { type: "varchar(100)" }, // Supplier's SKU
    supplierProductName: { type: "varchar(255)" }, // Supplier's product name
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'active',
      check: "status IN ('active', 'inactive', 'discontinued', 'pending')" 
    },
    isPreferred: { type: "boolean", notNull: true, default: false }, // Preferred supplier for this product
    unitCost: { type: "decimal(10,2)", notNull: true }, // Cost per unit
    currency: { type: "varchar(3)", notNull: true, default: 'USD' },
    minimumOrderQuantity: { type: "integer", default: 1 }, // MOQ
    leadTime: { type: "integer" }, // Lead time in days
    packagingInfo: { type: "jsonb" }, // Units per pack, etc.
    dimensions: { type: "jsonb" }, // Product dimensions from supplier
    weight: { type: "decimal(10,2)" }, // Weight per unit
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    lastOrderedAt: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for supplier products
  pgm.createIndex("supplier_product", "supplierId");
  pgm.createIndex("supplier_product", "productId");
  pgm.createIndex("supplier_product", "variantId");
  pgm.createIndex("supplier_product", "sku");
  pgm.createIndex("supplier_product", "supplierSku");
  pgm.createIndex("supplier_product", "status");
  pgm.createIndex("supplier_product", "isPreferred");
  pgm.createIndex("supplier_product", "unitCost");
  pgm.createIndex("supplier_product", "leadTime");
  pgm.createIndex("supplier_product", ["productId", "variantId", "supplierId"], { 
    unique: true,
    nulls: "not distinct"
  });
  pgm.createIndex("supplier_product", ["productId", "variantId", "isPreferred"], {
    unique: true,
    where: "isPreferred = true",
    nulls: "not distinct"
  });

  // Create purchase order table
  pgm.createTable("purchase_order", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    poNumber: { type: "varchar(50)", notNull: true, unique: true }, // Purchase order number
    supplierId: { type: "uuid", notNull: true, references: "supplier" },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse" }, // Destination warehouse
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'draft',
      check: "status IN ('draft', 'pending', 'approved', 'sent', 'confirmed', 'partial', 'completed', 'cancelled')" 
    },
    orderType: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'standard',
      check: "orderType IN ('standard', 'restock', 'backorder', 'special', 'emergency')" 
    },
    priority: { 
      type: "varchar(10)", 
      notNull: true, 
      default: 'normal',
      check: "priority IN ('low', 'normal', 'high', 'urgent')" 
    },
    orderDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    expectedDeliveryDate: { type: "timestamp" },
    deliveryDate: { type: "timestamp" },
    shippingMethod: { type: "varchar(50)" },
    trackingNumber: { type: "varchar(100)" },
    carrierName: { type: "varchar(100)" },
    paymentTerms: { type: "varchar(100)" },
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
    supplierNotes: { type: "text" }, // Notes visible to supplier
    attachments: { type: "jsonb" }, // Attached documents
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" },
    approvedAt: { type: "timestamp" },
    approvedBy: { type: "uuid" },
    sentAt: { type: "timestamp" },
    confirmedAt: { type: "timestamp" },
    completedAt: { type: "timestamp" }
  });

  // Create indexes for purchase orders
  pgm.createIndex("purchase_order", "poNumber");
  pgm.createIndex("purchase_order", "supplierId");
  pgm.createIndex("purchase_order", "warehouseId");
  pgm.createIndex("purchase_order", "status");
  pgm.createIndex("purchase_order", "orderType");
  pgm.createIndex("purchase_order", "priority");
  pgm.createIndex("purchase_order", "orderDate");
  pgm.createIndex("purchase_order", "expectedDeliveryDate");
  pgm.createIndex("purchase_order", "deliveryDate");
  pgm.createIndex("purchase_order", "total");
  pgm.createIndex("purchase_order", "createdAt");

  // Create purchase order item table
  pgm.createTable("purchase_order_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    purchaseOrderId: { type: "uuid", notNull: true, references: "purchase_order", onDelete: "CASCADE" },
    supplierProductId: { type: "uuid", references: "supplier_product" },
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true }, // Our SKU
    supplierSku: { type: "varchar(100)" }, // Supplier's SKU
    name: { type: "varchar(255)", notNull: true }, // Product name
    description: { type: "text" },
    quantity: { type: "integer", notNull: true },
    receivedQuantity: { type: "integer", notNull: true, default: 0 },
    unitCost: { type: "decimal(10,2)", notNull: true },
    tax: { type: "decimal(10,2)", notNull: true, default: 0 },
    discount: { type: "decimal(10,2)", notNull: true, default: 0 },
    total: { 
      type: "decimal(15,2)", 
      notNull: true,
      check: "total = (quantity * unitCost) + tax - discount"
    },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'partial', 'received', 'cancelled', 'backordered')" 
    },
    expectedDeliveryDate: { type: "timestamp" },
    receivedAt: { type: "timestamp" },
    notes: { type: "text" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  // Create indexes for purchase order items
  pgm.createIndex("purchase_order_item", "purchaseOrderId");
  pgm.createIndex("purchase_order_item", "supplierProductId");
  pgm.createIndex("purchase_order_item", "productId");
  pgm.createIndex("purchase_order_item", "variantId");
  pgm.createIndex("purchase_order_item", "sku");
  pgm.createIndex("purchase_order_item", "supplierSku");
  pgm.createIndex("purchase_order_item", "status");
  pgm.createIndex("purchase_order_item", "quantity");
  pgm.createIndex("purchase_order_item", "receivedQuantity");
  pgm.createIndex("purchase_order_item", "expectedDeliveryDate");
  pgm.createIndex("purchase_order_item", "receivedAt");

  // Create receiving record table
  pgm.createTable("receiving_record", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    receiptNumber: { type: "varchar(50)", notNull: true, unique: true },
    purchaseOrderId: { type: "uuid", references: "purchase_order" },
    warehouseId: { type: "uuid", notNull: true, references: "warehouse" },
    supplierId: { type: "uuid", notNull: true, references: "supplier" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'in_progress', 'completed', 'cancelled', 'disputed')" 
    },
    receivedDate: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    carrierName: { type: "varchar(100)" },
    trackingNumber: { type: "varchar(100)" },
    packageCount: { type: "integer" },
    notes: { type: "text" },
    discrepancies: { type: "boolean", notNull: true, default: false }, // Whether any discrepancies found
    attachments: { type: "jsonb" }, // Attached documents
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    createdBy: { type: "uuid" },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedBy: { type: "uuid" },
    completedAt: { type: "timestamp" },
    completedBy: { type: "uuid" }
  });

  // Create indexes for receiving records
  pgm.createIndex("receiving_record", "receiptNumber");
  pgm.createIndex("receiving_record", "purchaseOrderId");
  pgm.createIndex("receiving_record", "warehouseId");
  pgm.createIndex("receiving_record", "supplierId");
  pgm.createIndex("receiving_record", "status");
  pgm.createIndex("receiving_record", "receivedDate");
  pgm.createIndex("receiving_record", "trackingNumber");
  pgm.createIndex("receiving_record", "discrepancies");
  pgm.createIndex("receiving_record", "createdAt");

  // Create receiving item table
  pgm.createTable("receiving_item", {
    id: { type: "uuid", notNull: true, default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    receivingRecordId: { type: "uuid", notNull: true, references: "receiving_record", onDelete: "CASCADE" },
    purchaseOrderItemId: { type: "uuid", references: "purchase_order_item" },
    productId: { type: "uuid", notNull: true }, // Reference to product
    variantId: { type: "uuid" }, // Optional reference to product variant
    sku: { type: "varchar(100)", notNull: true }, // Our SKU
    name: { type: "varchar(255)", notNull: true }, // Product name
    expectedQuantity: { type: "integer" }, // Expected quantity based on PO
    receivedQuantity: { type: "integer", notNull: true }, // Actual received quantity
    rejectedQuantity: { type: "integer", notNull: true, default: 0 }, // Quantity rejected
    binId: { type: "uuid", references: "warehouse_bin" }, // Storage location
    lotNumber: { type: "varchar(100)" },
    serialNumbers: { type: "text[]" }, // Array of serial numbers
    expiryDate: { type: "timestamp" },
    status: { 
      type: "varchar(20)", 
      notNull: true, 
      default: 'received',
      check: "status IN ('received', 'inspecting', 'accepted', 'rejected', 'partial')" 
    },
    acceptanceStatus: { 
      type: "varchar(20)", 
      default: 'pending',
      check: "acceptanceStatus IN ('pending', 'accepted', 'rejected', 'partial')" 
    },
    inspectionNotes: { type: "text" },
    discrepancyReason: { type: "varchar(255)" },
    metadata: { type: "jsonb" },
    createdAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updatedAt: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    processedAt: { type: "timestamp" },
    processedBy: { type: "uuid" }
  });

  // Create indexes for receiving items
  pgm.createIndex("receiving_item", "receivingRecordId");
  pgm.createIndex("receiving_item", "purchaseOrderItemId");
  pgm.createIndex("receiving_item", "productId");
  pgm.createIndex("receiving_item", "variantId");
  pgm.createIndex("receiving_item", "sku");
  pgm.createIndex("receiving_item", "binId");
  pgm.createIndex("receiving_item", "lotNumber");
  pgm.createIndex("receiving_item", "expiryDate");
  pgm.createIndex("receiving_item", "status");
  pgm.createIndex("receiving_item", "acceptanceStatus");
  pgm.createIndex("receiving_item", "createdAt");
  pgm.createIndex("receiving_item", "serialNumbers", { method: "gin" });

  // Insert default supplier
  pgm.sql(`
    INSERT INTO "supplier" (
      name, 
      code, 
      description, 
      isActive, 
      isApproved,
      status,
      paymentTerms,
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
      supplierId,
      name, 
      addressLine1, 
      city, 
      state, 
      postalCode,
      country,
      addressType,
      isDefault,
      isActive
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
