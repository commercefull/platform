# Supplier Feature

## Overview

The Supplier feature manages supplier/vendor relationships for inventory sourcing. It handles supplier profiles, purchase orders, and product sourcing for dropshipping or traditional inventory models.

---

## Use Cases

### Supplier Management (Business)

### UC-SUP-001: List Suppliers (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request suppliers  
**Then** the system returns all supplier accounts

#### API Endpoint
```
GET /business/suppliers
Query: status?, search?, limit, offset
```

---

### UC-SUP-002: Get Supplier (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/suppliers/:id
```

---

### UC-SUP-003: Create Supplier (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid supplier data  
**When** they create a supplier  
**Then** the supplier account is created

#### API Endpoint
```
POST /business/suppliers
Body: {
  name, code,
  contactName, contactEmail, contactPhone?,
  address: {},
  paymentTerms?,
  leadTime?,
  isActive
}
```

---

### UC-SUP-004: Update Supplier (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/suppliers/:id
```

---

### UC-SUP-005: Delete Supplier (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/suppliers/:id
```

---

### Supplier Products (Business)

### UC-SUP-006: List Supplier Products (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/suppliers/:supplierId/products
```

---

### UC-SUP-007: Link Product to Supplier (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** a product and supplier  
**When** linking them  
**Then** the product can be sourced from that supplier

#### API Endpoint
```
POST /business/suppliers/:supplierId/products
Body: { productId, supplierSku?, cost, minOrderQuantity? }
```

---

### UC-SUP-008: Update Supplier Product (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/suppliers/:supplierId/products/:productId
```

---

### UC-SUP-009: Unlink Product from Supplier (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/suppliers/:supplierId/products/:productId
```

---

### Purchase Orders (Business)

### UC-SUP-010: List Purchase Orders (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/suppliers/purchase-orders
Query: supplierId?, status?, limit, offset
```

---

### UC-SUP-011: Get Purchase Order (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/suppliers/purchase-orders/:id
```

---

### UC-SUP-012: Create Purchase Order (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** products to order  
**When** creating a purchase order  
**Then** the PO is created and can be sent to supplier

#### API Endpoint
```
POST /business/suppliers/purchase-orders
Body: {
  supplierId,
  items: [{ productId, quantity, unitCost }],
  expectedDeliveryDate?,
  notes?
}
```

---

### UC-SUP-013: Update Purchase Order (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/suppliers/purchase-orders/:id
```

---

### UC-SUP-014: Send Purchase Order (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/suppliers/purchase-orders/:id/send
```

---

### UC-SUP-015: Receive Purchase Order (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** a sent purchase order  
**When** receiving inventory  
**Then** stock levels are updated

#### API Endpoint
```
POST /business/suppliers/purchase-orders/:id/receive
Body: { items: [{ productId, quantityReceived }] }
```

---

### UC-SUP-016: Cancel Purchase Order (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
POST /business/suppliers/purchase-orders/:id/cancel
Body: { reason }
```

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `supplier.created` | Supplier created | supplierId |
| `supplier.po.created` | PO created | purchaseOrderId, supplierId |
| `supplier.po.sent` | PO sent | purchaseOrderId |
| `supplier.po.received` | PO received | purchaseOrderId, items |
| `supplier.po.cancelled` | PO cancelled | purchaseOrderId |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-SUP-001 to UC-SUP-005 | `supplier/supplier.test.ts` | ❌ |
| UC-SUP-006 to UC-SUP-009 | `supplier/products.test.ts` | ❌ |
| UC-SUP-010 to UC-SUP-016 | `supplier/purchase-orders.test.ts` | ❌ |
