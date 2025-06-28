# Inventory Feature

The Inventory feature manages product stock levels, inventory locations, reservations, and transactions across the CommerceFull platform. It provides a comprehensive solution for tracking and managing product availability.

## Overview

The inventory system handles several key aspects of e-commerce inventory management:

1. **Inventory Tracking**: Monitor stock levels for products across multiple locations
2. **Location Management**: Create and manage warehouses, stores, and other inventory locations
3. **Stock Reservations**: Reserve inventory for customer orders during checkout process
4. **Inventory Transactions**: Record all inventory movements with detailed tracking
5. **Low Stock Alerts**: Identify products that need reordering

## Architecture

The Inventory feature follows a layered architecture:

- **Controllers**: Handle HTTP requests and responses
- **Repositories**: Interface with the database using snake_case column names
- **Domain Models**: Business logic and data structures using camelCase properties
- **Database**: PostgreSQL tables with snake_case columns

### Key Components

- `InventoryRepo`: Core repository for all inventory operations
- `InventoryController`: Admin-facing API endpoints
- `InventoryPublicController`: Customer-facing API endpoints
- Database tables: `inventory_item`, `inventory_location`, `inventory_transaction`, `inventory_reservation`

## Database Schema

The inventory feature uses the following tables:

1. **inventory_item**: Tracks product quantities by location
   - Fields: `id`, `product_id`, `sku`, `location_id`, `quantity`, `reserved_quantity`, `available_quantity`, `low_stock_threshold`, `reorder_point`, `reorder_quantity`, `last_restock_date`, `created_at`, `updated_at`

2. **inventory_location**: Stores information about warehouses, stores, etc.
   - Fields: `id`, `name`, `type`, `address`, `city`, `state`, `country`, `postal_code`, `is_active`, `created_at`, `updated_at`

3. **inventory_transaction**: Records all inventory movements
   - Fields: `id`, `inventory_id`, `transaction_type`, `quantity`, `source_location_id`, `destination_location_id`, `reference`, `notes`, `created_by`, `created_at`

4. **inventory_reservation**: Manages temporary holds on inventory during checkout
   - Fields: `id`, `inventory_id`, `quantity`, `order_id`, `cart_id`, `expires_at`, `status`, `created_at`, `updated_at`

## API Endpoints

### Public Endpoints (Customer-Facing)

- `GET /inventory/products/:productId/availability`: Check product availability
- `GET /inventory/products/:productId/inventory`: Get inventory information for a product
- `GET /inventory/locations/:id/availability`: Get inventory at a specific location
- `POST /inventory/cart/:cartId/reserve`: Reserve inventory for items in a cart
- `GET /inventory/cart/:cartId/reservations`: Get reservations for a cart
- `POST /inventory/cart/:cartId/release`: Release reservations for a cart

### Admin Endpoints

- `GET /admin/inventory/items`: List all inventory items
- `GET /admin/inventory/items/:id`: Get specific inventory item
- `POST /admin/inventory/items`: Create new inventory item
- `PUT /admin/inventory/items/:id`: Update inventory item
- `DELETE /admin/inventory/items/:id`: Delete inventory item
- `GET /admin/inventory/locations`: List all locations
- `POST /admin/inventory/locations`: Create new location
- `PUT /admin/inventory/locations/:id`: Update location
- `DELETE /admin/inventory/locations/:id`: Delete location
- `GET /admin/inventory/transactions`: List all transactions
- `POST /admin/inventory/transactions`: Create new transaction
- `GET /admin/inventory/reservations`: List all reservations
- `PUT /admin/inventory/reservations/:id/status`: Update reservation status

## Key Workflows

### Inventory Reservation Process

1. Customer adds items to cart
2. System reserves inventory quantities
3. Reservations expire after a configurable time if not converted to orders
4. Successful order creation extends or converts reservations

### Inventory Adjustment Process

1. Admin initiates inventory adjustment
2. System creates transaction record
3. Inventory quantities are updated
4. Low stock notifications are triggered if applicable

### Multi-Location Fulfillment

1. Order is created
2. System determines optimal fulfillment location
3. Inventory is allocated from chosen location
4. Order is prepared for shipping from location

## Integration with Other Features

- **Product**: Links to product catalog via `product_id`
- **Order**: Captures inventory at time of order via reservations
- **Checkout**: Validates inventory availability during checkout process
- **Shipping**: Uses location data for fulfillment decisions

## Naming Conventions

This feature follows the platform standards for naming:
- Database tables use **snake_case** for table names
- Database columns use **snake_case** for column names
- TypeScript interfaces and properties use **camelCase**
- The repository layer handles translation between snake_case and camelCase

## Testing

Integration tests are available in `/tests/integration/inventory/` directory covering:
- CRUD operations for inventory items and locations
- Inventory transactions
- Reservation workflows
- Error handling and edge cases
