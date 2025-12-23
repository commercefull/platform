# Warehouse Feature

## Overview

The Warehouse feature manages warehouse operations including receiving, put-away, picking, packing, and shipping. It supports multi-warehouse inventory and warehouse management system (WMS) functionality.

---

## Use Cases

### Warehouse Management (Business)

### UC-WHS-001: List Warehouses (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request warehouses  
**Then** the system returns all warehouse locations

#### API Endpoint

```
GET /business/warehouses
Query: isActive?, limit, offset
```

---

### UC-WHS-002: Get Warehouse (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/warehouses/:id
```

---

### UC-WHS-003: Create Warehouse (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid warehouse data  
**When** they create a warehouse  
**Then** the warehouse is available for inventory

#### API Endpoint

```
POST /business/warehouses
Body: {
  name, code,
  address: {},
  type: 'owned'|'3pl'|'dropship',
  capacity?,
  isActive
}
```

---

### UC-WHS-004: Update Warehouse (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
PUT /business/warehouses/:id
```

---

### UC-WHS-005: Delete Warehouse (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/warehouses/:id
```

---

### Warehouse Zones (Business)

### UC-WHS-006: List Warehouse Zones (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
GET /business/warehouses/:warehouseId/zones
```

---

### UC-WHS-007: Create Warehouse Zone (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** a warehouse  
**When** creating a zone  
**Then** inventory can be organized by zone

#### API Endpoint

```
POST /business/warehouses/:warehouseId/zones
Body: {
  name, code,
  type: 'receiving'|'storage'|'picking'|'packing'|'shipping',
  temperature?: 'ambient'|'refrigerated'|'frozen'
}
```

---

### UC-WHS-008: Update Warehouse Zone (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
PUT /business/warehouses/:warehouseId/zones/:zoneId
```

---

### UC-WHS-009: Delete Warehouse Zone (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/warehouses/:warehouseId/zones/:zoneId
```

---

### Bin Locations (Business)

### UC-WHS-010: List Bin Locations (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
GET /business/warehouses/:warehouseId/bins
Query: zoneId?, isEmpty?, limit, offset
```

---

### UC-WHS-011: Create Bin Location (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
POST /business/warehouses/:warehouseId/bins
Body: { zoneId, code, aisle?, rack?, shelf?, bin? }
```

---

### UC-WHS-012: Update Bin Location (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
PUT /business/warehouses/:warehouseId/bins/:binId
```

---

### UC-WHS-013: Delete Bin Location (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/warehouses/:warehouseId/bins/:binId
```

---

### Receiving (Business)

### UC-WHS-014: Create Receiving Task (Business)

**Actor:** Warehouse Staff  
**Priority:** Medium

#### Given-When-Then

**Given** incoming inventory (PO or transfer)  
**When** creating a receiving task  
**Then** staff can process the receipt

#### API Endpoint

```
POST /business/warehouses/:warehouseId/receiving
Body: { purchaseOrderId?, transferId?, expectedItems: [] }
```

---

### UC-WHS-015: Process Receiving (Business)

**Actor:** Warehouse Staff  
**Priority:** Medium

#### API Endpoint

```
POST /business/warehouses/:warehouseId/receiving/:taskId/process
Body: { items: [{ productId, quantity, binId?, condition? }] }
```

---

### Pick/Pack (Business)

### UC-WHS-016: Create Pick Task (Business)

**Actor:** System/Merchant  
**Priority:** Medium

#### Given-When-Then

**Given** orders to fulfill  
**When** creating pick tasks  
**Then** warehouse staff can pick items

#### API Endpoint

```
POST /business/warehouses/:warehouseId/pick-tasks
Body: { orderIds: [], priority? }
```

---

### UC-WHS-017: Get Pick Task (Business)

**Actor:** Warehouse Staff  
**Priority:** Medium

#### API Endpoint

```
GET /business/warehouses/:warehouseId/pick-tasks/:taskId
```

---

### UC-WHS-018: Complete Pick Task (Business)

**Actor:** Warehouse Staff  
**Priority:** Medium

#### API Endpoint

```
POST /business/warehouses/:warehouseId/pick-tasks/:taskId/complete
Body: { items: [{ productId, quantity, binId }] }
```

---

### UC-WHS-019: Create Pack Task (Business)

**Actor:** System/Merchant  
**Priority:** Medium

#### API Endpoint

```
POST /business/warehouses/:warehouseId/pack-tasks
Body: { pickTaskId, orderId }
```

---

### UC-WHS-020: Complete Pack Task (Business)

**Actor:** Warehouse Staff  
**Priority:** Medium

#### API Endpoint

```
POST /business/warehouses/:warehouseId/pack-tasks/:taskId/complete
Body: { packages: [{ weight, dimensions, items: [] }] }
```

---

## Events Emitted

| Event                           | Trigger           | Payload             |
| ------------------------------- | ----------------- | ------------------- |
| `warehouse.receiving.completed` | Receiving done    | taskId, warehouseId |
| `warehouse.pick.created`        | Pick task created | taskId, orderIds    |
| `warehouse.pick.completed`      | Pick task done    | taskId              |
| `warehouse.pack.completed`      | Pack task done    | taskId, orderId     |

---

## Integration Test Coverage

| Use Case                 | Test File                     | Status |
| ------------------------ | ----------------------------- | ------ |
| UC-WHS-001 to UC-WHS-005 | `warehouse/warehouse.test.ts` | ❌     |
| UC-WHS-006 to UC-WHS-009 | `warehouse/zones.test.ts`     | ❌     |
| UC-WHS-010 to UC-WHS-013 | `warehouse/bins.test.ts`      | ❌     |
| UC-WHS-014 to UC-WHS-015 | `warehouse/receiving.test.ts` | ❌     |
| UC-WHS-016 to UC-WHS-020 | `warehouse/pickpack.test.ts`  | ❌     |
