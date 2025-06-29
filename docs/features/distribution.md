# Distribution Feature

## Overview

The distribution feature manages the logistics and fulfillment operations for the ecommerce platform. It handles distribution centers, shipping methods, zones, fulfillment partners, rules, and order processing. This system enables merchants to efficiently fulfill orders by routing them to appropriate distribution centers and fulfillment partners based on configurable rules.

## Core Components

### 1. Distribution Centers
Distribution centers are physical locations where inventory is stored and from which orders are fulfilled. Each center has a specific capacity, location, and contact information.

### 2. Shipping Zones
Geographic regions defined by countries, regions, and postal codes that help determine available shipping options and fulfillment rules for customer orders based on their delivery address.

### 3. Shipping Methods
Available shipping options (like standard, express, overnight) with associated carriers, delivery timeframes, and base pricing.

### 4. Fulfillment Partners
Third-party services that can handle the fulfillment process, complete with API integration capabilities for automated order processing.

### 5. Distribution Rules
Merchant logic rules that determine which distribution center and fulfillment partner should handle a specific order based on shipping zone, method, and other factors. Rules have priorities to handle conflicts.

### 6. Order Fulfillment
Tracks the progress of order fulfillment, including status updates (pending, processing, shipped, delivered), tracking information, and delivery confirmation.

## Data Models

### Distribution Center
```typescript
interface DistributionCenter {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Shipping Zone
```typescript
interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions: string[];
  postalCodes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Shipping Method
```typescript
interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  carrier: string;
  estimatedDeliveryDays: number;
  isActive: boolean;
  basePrice: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Fulfillment Partner
```typescript
interface FulfillmentPartner {
  id: string;
  name: string;
  code: string;
  apiKey?: string;
  apiEndpoint?: string;
  isActive: boolean;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Distribution Rule
```typescript
interface DistributionRule {
  id: string;
  name: string;
  priority: number;
  distributionCenterId: string;
  shippingZoneId: string;
  shippingMethodId: string;
  fulfillmentPartnerId: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Fulfillment
```typescript
interface OrderFulfillment {
  id: string;
  orderId: string;
  distributionCenterId: string;
  ruleId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingMethodId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Repository Layer

The `DistributionRepo` class provides data access methods for all distribution-related operations:

- **Distribution Centers**: CRUD operations for centers, filtering by active status or code
- **Shipping Zones**: Management of geographical shipping zones and their coverage areas
- **Shipping Methods**: Management of available shipping options, carriers, and delivery estimates
- **Fulfillment Partners**: Integration with third-party fulfillment services
- **Distribution Rules**: Configuration of order routing logic
- **Order Fulfillment**: Tracking and status updates for fulfillment processes

## API Endpoints

### Public API (Customer-Facing)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/centers` | GET | List active distribution centers with limited public information |
| `/shipping-methods` | GET | List active shipping methods |
| `/shipping-methods/available` | GET | Get available shipping methods for a specific address |
| `/tracking/:orderId` | GET | Get tracking information for an order |

### Admin API (Merchant-Facing)

#### Distribution Centers
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/centers` | GET | List all distribution centers |
| `/centers/active` | GET | List active distribution centers |
| `/centers/:id` | GET | Get distribution center by ID |
| `/centers/code/:code` | GET | Get distribution center by code |
| `/centers` | POST | Create a new distribution center |
| `/centers/:id` | PUT | Update a distribution center |
| `/centers/:id` | DELETE | Delete a distribution center |

#### Shipping Zones
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/shipping-zones` | GET | List all shipping zones |
| `/shipping-zones/active` | GET | List active shipping zones |
| `/shipping-zones/:id` | GET | Get shipping zone by ID |
| `/shipping-zones` | POST | Create a new shipping zone |
| `/shipping-zones/:id` | PUT | Update a shipping zone |
| `/shipping-zones/:id` | DELETE | Delete a shipping zone |

#### Shipping Methods
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/shipping-methods` | GET | List all shipping methods |
| `/shipping-methods/active` | GET | List active shipping methods |
| `/shipping-methods/:id` | GET | Get shipping method by ID |
| `/shipping-methods/carrier/:carrier` | GET | Get shipping methods by carrier |
| `/shipping-methods` | POST | Create a new shipping method |
| `/shipping-methods/:id` | PUT | Update a shipping method |
| `/shipping-methods/:id` | DELETE | Delete a shipping method |

#### Fulfillment Partners
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/fulfillment-partners` | GET | List all fulfillment partners |
| `/fulfillment-partners/active` | GET | List active fulfillment partners |
| `/fulfillment-partners/:id` | GET | Get fulfillment partner by ID |
| `/fulfillment-partners/code/:code` | GET | Get fulfillment partner by code |
| `/fulfillment-partners` | POST | Create a new fulfillment partner |
| `/fulfillment-partners/:id` | PUT | Update a fulfillment partner |
| `/fulfillment-partners/:id` | DELETE | Delete a fulfillment partner |

#### Distribution Rules
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rules` | GET | List all distribution rules |
| `/rules/active` | GET | List active distribution rules |
| `/rules/:id` | GET | Get distribution rule by ID |
| `/rules/zone/:zoneId` | GET | Get distribution rules by shipping zone |
| `/rules/default` | GET | Get the default distribution rule |
| `/rules` | POST | Create a new distribution rule |
| `/rules/:id` | PUT | Update a distribution rule |
| `/rules/:id` | DELETE | Delete a distribution rule |

#### Order Fulfillment
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/fulfillments` | GET | List all order fulfillments |
| `/fulfillments/:id` | GET | Get order fulfillment by ID |
| `/fulfillments/order/:orderId` | GET | Get fulfillments by order ID |
| `/fulfillments/status/:status` | GET | Get fulfillments by status |
| `/fulfillments/center/:centerId` | GET | Get fulfillments by distribution center |
| `/fulfillments` | POST | Create a new order fulfillment |
| `/fulfillments/:id` | PUT | Update an order fulfillment |
| `/fulfillments/:id/status` | PUT | Update an order fulfillment status |
| `/fulfillments/:id` | DELETE | Delete an order fulfillment |

## Usage Flow

1. **Order Placement**: When a customer places an order, the system determines the appropriate distribution center and fulfillment method based on:
   - Customer's shipping address (matched against shipping zones)
   - Selected shipping method
   - Available distribution centers
   - Distribution rules (prioritized)

2. **Fulfillment Creation**: An order fulfillment record is created with initial status "pending"

3. **Processing**: The order moves to "processing" status as items are prepared for shipping

4. **Shipping**: When the order is shipped, status is updated to "shipped" with tracking information

5. **Delivery**: Upon delivery confirmation, status is updated to "delivered"

## Integration Points

- **Inventory System**: Distribution centers must sync with inventory to ensure availability
- **Order System**: Order creation triggers fulfillment processes
- **Third-party Shipping APIs**: Integration with carriers for tracking updates
- **Fulfillment Partner APIs**: For third-party fulfillment services

## Security Considerations

- Public API endpoints provide limited information for customer use
- Admin API endpoints should be protected with appropriate authentication and authorization
- API keys and endpoints for fulfillment partners must be securely stored

## Future Enhancements

- Real-time tracking integration
- Advanced rule-based routing with machine learning optimization
- International customs documentation
- Return management process integration
- Carbon footprint calculation for shipping options
