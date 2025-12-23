/**
 * Supplier Test Data Seed
 * Seeds test data for supplier integration tests
 */

// Fixed UUIDs for test data consistency
const SUPPLIER_IDS = {
  ACME_CORP: '01938000-0000-7000-8000-000000000001',
  GLOBAL_PARTS: '01938000-0000-7000-8000-000000000002',
  QUALITY_GOODS: '01938000-0000-7000-8000-000000000003',
};

const SUPPLIER_ADDRESS_IDS = {
  ACME_HQ: '01938001-0000-7000-8000-000000000001',
  ACME_WAREHOUSE: '01938001-0000-7000-8000-000000000002',
  GLOBAL_HQ: '01938001-0000-7000-8000-000000000003',
};

const SUPPLIER_PRODUCT_IDS = {
  WIDGET_A: '01938002-0000-7000-8000-000000000001',
  WIDGET_B: '01938002-0000-7000-8000-000000000002',
  GADGET_X: '01938002-0000-7000-8000-000000000003',
};

const PURCHASE_ORDER_IDS = {
  PO_001: '01938003-0000-7000-8000-000000000001',
  PO_002: '01938003-0000-7000-8000-000000000002',
};

const PURCHASE_ORDER_ITEM_IDS = {
  PO_001_ITEM_1: '01938004-0000-7000-8000-000000000001',
  PO_001_ITEM_2: '01938004-0000-7000-8000-000000000002',
  PO_002_ITEM_1: '01938004-0000-7000-8000-000000000003',
};

// Test product ID (should exist from product seeds)
const TEST_PRODUCT_ID = '01912000-0000-7000-8000-000000000001';
// Test warehouse ID (should exist from warehouse seeds)
const TEST_WAREHOUSE_ID = '01915000-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  // Clean up existing test data in reverse order of dependencies
  await knex('supplierReceivingItem')
    .whereIn(
      'supplierReceivingRecordId',
      knex('supplierReceivingRecord')
        .select('supplierReceivingRecordId')
        .whereIn('supplierPurchaseOrderId', Object.values(PURCHASE_ORDER_IDS)),
    )
    .del()
    .catch(() => {});
  await knex('supplierReceivingRecord')
    .whereIn('supplierPurchaseOrderId', Object.values(PURCHASE_ORDER_IDS))
    .del()
    .catch(() => {});
  await knex('supplierPurchaseOrderItem')
    .whereIn('supplierPurchaseOrderItemId', Object.values(PURCHASE_ORDER_ITEM_IDS))
    .del()
    .catch(() => {});
  await knex('supplierPurchaseOrder')
    .whereIn('supplierPurchaseOrderId', Object.values(PURCHASE_ORDER_IDS))
    .del()
    .catch(() => {});
  await knex('supplierProduct')
    .whereIn('supplierProductId', Object.values(SUPPLIER_PRODUCT_IDS))
    .del()
    .catch(() => {});
  await knex('supplierAddress')
    .whereIn('supplierAddressId', Object.values(SUPPLIER_ADDRESS_IDS))
    .del()
    .catch(() => {});
  await knex('supplier')
    .whereIn('supplierId', Object.values(SUPPLIER_IDS))
    .del()
    .catch(() => {});

  // Seed Suppliers
  await knex('supplier').insert([
    {
      supplierId: SUPPLIER_IDS.ACME_CORP,
      name: 'ACME Corporation',
      code: 'ACME',
      description: 'Leading supplier of widgets and gadgets',
      website: 'https://acme.example.com',
      email: 'orders@acme.example.com',
      phone: '+1-555-0100',
      isActive: true,
      isApproved: true,
      status: 'active',
      rating: 4.5,
      taxId: 'US-123456789',
      paymentTerms: 'Net 30',
      paymentMethod: 'wire_transfer',
      currency: 'USD',
      minOrderValue: 100.0,
      leadTime: 7,
      categories: ['electronics', 'hardware'],
      tags: ['preferred', 'reliable'],
    },
    {
      supplierId: SUPPLIER_IDS.GLOBAL_PARTS,
      name: 'Global Parts Inc',
      code: 'GPARTS',
      description: 'International parts distributor',
      website: 'https://globalparts.example.com',
      email: 'sales@globalparts.example.com',
      phone: '+1-555-0200',
      isActive: true,
      isApproved: true,
      status: 'active',
      rating: 4.2,
      taxId: 'US-987654321',
      paymentTerms: 'Net 45',
      paymentMethod: 'credit',
      currency: 'USD',
      minOrderValue: 250.0,
      leadTime: 14,
      categories: ['parts', 'components'],
      tags: ['international'],
    },
    {
      supplierId: SUPPLIER_IDS.QUALITY_GOODS,
      name: 'Quality Goods Ltd',
      code: 'QGOODS',
      description: 'Premium quality supplier',
      email: 'info@qualitygoods.example.com',
      phone: '+1-555-0300',
      isActive: true,
      isApproved: false,
      status: 'pending',
      rating: null,
      paymentTerms: 'Net 15',
      currency: 'USD',
      leadTime: 5,
      categories: ['premium'],
      tags: ['new'],
    },
  ]);

  // Seed Supplier Addresses
  await knex('supplierAddress').insert([
    {
      supplierAddressId: SUPPLIER_ADDRESS_IDS.ACME_HQ,
      supplierId: SUPPLIER_IDS.ACME_CORP,
      name: 'ACME Headquarters',
      addressLine1: '123 Industrial Way',
      addressLine2: 'Suite 100',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
      addressType: 'headquarters',
      isDefault: true,
      contactName: 'John Smith',
      contactEmail: 'jsmith@acme.example.com',
      contactPhone: '+1-555-0101',
      isActive: true,
    },
    {
      supplierAddressId: SUPPLIER_ADDRESS_IDS.ACME_WAREHOUSE,
      supplierId: SUPPLIER_IDS.ACME_CORP,
      name: 'ACME Warehouse',
      addressLine1: '456 Logistics Blvd',
      city: 'Indianapolis',
      state: 'IN',
      postalCode: '46201',
      country: 'US',
      addressType: 'warehouse',
      isDefault: false,
      contactName: 'Jane Doe',
      contactEmail: 'jdoe@acme.example.com',
      isActive: true,
    },
    {
      supplierAddressId: SUPPLIER_ADDRESS_IDS.GLOBAL_HQ,
      supplierId: SUPPLIER_IDS.GLOBAL_PARTS,
      name: 'Global Parts HQ',
      addressLine1: '789 Commerce St',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
      addressType: 'headquarters',
      isDefault: true,
      isActive: true,
    },
  ]);

  // Check if test product exists before seeding supplier products
  const productExists = await knex('product').where('productId', TEST_PRODUCT_ID).first();

  if (productExists) {
    // Seed Supplier Products
    await knex('supplierProduct').insert([
      {
        supplierProductId: SUPPLIER_PRODUCT_IDS.WIDGET_A,
        supplierId: SUPPLIER_IDS.ACME_CORP,
        productId: TEST_PRODUCT_ID,
        sku: 'ACME-WA-001',
        supplierSku: 'WIDGET-A',
        supplierProductName: 'Premium Widget A',
        status: 'active',
        isPreferred: true,
        unitCost: 15.99,
        currency: 'USD',
        minimumOrderQuantity: 10,
        leadTime: 5,
      },
      {
        supplierProductId: SUPPLIER_PRODUCT_IDS.WIDGET_B,
        supplierId: SUPPLIER_IDS.ACME_CORP,
        productId: TEST_PRODUCT_ID,
        sku: 'ACME-WB-001',
        supplierSku: 'WIDGET-B',
        supplierProductName: 'Standard Widget B',
        status: 'active',
        isPreferred: false,
        unitCost: 12.5,
        currency: 'USD',
        minimumOrderQuantity: 25,
        leadTime: 7,
      },
      {
        supplierProductId: SUPPLIER_PRODUCT_IDS.GADGET_X,
        supplierId: SUPPLIER_IDS.GLOBAL_PARTS,
        productId: TEST_PRODUCT_ID,
        sku: 'GP-GX-001',
        supplierSku: 'GADGET-X',
        supplierProductName: 'Gadget X Component',
        status: 'active',
        isPreferred: true,
        unitCost: 25.0,
        currency: 'USD',
        minimumOrderQuantity: 5,
        leadTime: 10,
      },
    ]);

    // Check if test warehouse exists before seeding purchase orders
    const warehouseExists = await knex('distributionWarehouse').where('distributionWarehouseId', TEST_WAREHOUSE_ID).first();

    if (warehouseExists) {
      // Seed Purchase Orders
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      await knex('supplierPurchaseOrder').insert([
        {
          supplierPurchaseOrderId: PURCHASE_ORDER_IDS.PO_001,
          poNumber: 'PO-TEST-001',
          supplierId: SUPPLIER_IDS.ACME_CORP,
          distributionWarehouseId: TEST_WAREHOUSE_ID,
          status: 'confirmed',
          orderType: 'standard',
          priority: 'normal',
          orderDate: now,
          expectedDeliveryDate: nextWeek,
          currency: 'USD',
          subtotal: 319.8,
          tax: 25.58,
          shipping: 15.0,
          discount: 0,
          total: 360.38,
          notes: 'Test purchase order 1',
        },
        {
          supplierPurchaseOrderId: PURCHASE_ORDER_IDS.PO_002,
          poNumber: 'PO-TEST-002',
          supplierId: SUPPLIER_IDS.GLOBAL_PARTS,
          distributionWarehouseId: TEST_WAREHOUSE_ID,
          status: 'draft',
          orderType: 'restock',
          priority: 'high',
          orderDate: now,
          currency: 'USD',
          subtotal: 250.0,
          tax: 20.0,
          shipping: 0,
          discount: 25.0,
          total: 245.0,
          notes: 'Test purchase order 2 - draft',
        },
      ]);

      // Seed Purchase Order Items
      await knex('supplierPurchaseOrderItem').insert([
        {
          supplierPurchaseOrderItemId: PURCHASE_ORDER_ITEM_IDS.PO_001_ITEM_1,
          supplierPurchaseOrderId: PURCHASE_ORDER_IDS.PO_001,
          supplierProductId: SUPPLIER_PRODUCT_IDS.WIDGET_A,
          productId: TEST_PRODUCT_ID,
          sku: 'ACME-WA-001',
          supplierSku: 'WIDGET-A',
          name: 'Premium Widget A',
          quantity: 20,
          receivedQuantity: 0,
          unitCost: 15.99,
          tax: 25.58,
          discount: 0,
          total: 319.8,
          status: 'pending',
        },
        {
          supplierPurchaseOrderItemId: PURCHASE_ORDER_ITEM_IDS.PO_001_ITEM_2,
          supplierPurchaseOrderId: PURCHASE_ORDER_IDS.PO_001,
          supplierProductId: SUPPLIER_PRODUCT_IDS.WIDGET_B,
          productId: TEST_PRODUCT_ID,
          sku: 'ACME-WB-001',
          supplierSku: 'WIDGET-B',
          name: 'Standard Widget B',
          quantity: 10,
          receivedQuantity: 0,
          unitCost: 12.5,
          tax: 0,
          discount: 0,
          total: 125.0,
          status: 'pending',
        },
        {
          supplierPurchaseOrderItemId: PURCHASE_ORDER_ITEM_IDS.PO_002_ITEM_1,
          supplierPurchaseOrderId: PURCHASE_ORDER_IDS.PO_002,
          supplierProductId: SUPPLIER_PRODUCT_IDS.GADGET_X,
          productId: TEST_PRODUCT_ID,
          sku: 'GP-GX-001',
          supplierSku: 'GADGET-X',
          name: 'Gadget X Component',
          quantity: 10,
          receivedQuantity: 0,
          unitCost: 25.0,
          tax: 20.0,
          discount: 0,
          total: 250.0,
          status: 'pending',
        },
      ]);

      console.log('Supplier test data seeded successfully (with purchase orders)');
    } else {
      console.log('Supplier test data seeded (without purchase orders - warehouse not found)');
    }
  } else {
    console.log('Supplier test data seeded (without products/orders - product not found)');
  }
};
