# Product Feature in the Commerce Platform

The product feature is a comprehensive module that provides full e-commerce product management capabilities. It follows a layered architecture pattern consistent with other features in the platform (like the basket feature) and consists of the following components:

## Core Architecture

### 1. Data Models & Repositories
- **Product Repository**: Handles CRUD operations for base product information
- **Product Variant Repository**: Manages product variations with different attributes (e.g., sizes, colors)
- **Product Image Repository**: Handles product imagery and relationships to products/variants

### 2. Controllers
- **Product Controller**: Admin-facing operations for product management
- **Product Public Controller**: Customer-facing product browsing and discovery
- **Product Variant Controller**: Specialized handling of product variants
- **Product Image Controller**: Management of product imagery

### 3. Routers
- **Public Router**: Exposes customer-facing endpoints for browsing products
- **Admin Router**: Protected routes for product administration

## Key Workflows

### Product Management
1. **Product Creation**:
   - Admin creates a base product with core attributes (name, description, type)
   - Product is assigned a unique ID and stored with initial draft status
   - Optional primary image can be associated with the product

2. **Variant Management**:
   - Products can have multiple variants (e.g., different sizes/colors)
   - Each variant has its own inventory tracking, pricing, and attributes
   - Variants can be reordered, set as default, or removed

3. **Image Management**:
   - Multiple images can be associated with a product or specific variants
   - Images can be designated as primary, reordered, and assigned metadata
   - When a primary image is deleted, the system automatically promotes another image

4. **Inventory Control**:
   - Inventory is tracked at the variant level
   - Three inventory policies are supported:
     - **Deny**: Prevents purchase when out of stock
     - **Continue**: Allows purchase regardless of inventory
     - **Backorder**: Allows purchase with backorder designation

### Customer Experience
1. **Product Discovery**:
   - Customers can browse products by category
   - Search functionality with filtering by price, attributes, etc.
   - Featured products can be highlighted

2. **Product Details**:
   - Detailed product information including description, pricing, and images
   - Variant selection (if product has variants)
   - Related products suggestions

## Technical Implementation

### Database Design
- Normalized relational schema with appropriate foreign key relationships
- Product variants and images are separate tables with references to parent products
- Support for soft deletion (via deletedAt fields) to maintain data integrity

### API Patterns
- RESTful endpoints for all operations
- Consistent response format using apiResponse utility
- Standardized error handling and validation

### Security
- Admin routes protected with authentication middleware
- Public routes with appropriate rate limiting and validation

## Integration Points

### Basket Feature Integration
The product feature integrates seamlessly with the basket feature:
- When adding items to the basket, product and variant data is validated
- Inventory checks are performed based on the variant's inventory policy
- Product images are available for display in the basket

### Other System Integrations
- Works with categories for product organization
- Integrates with search functionality for product discovery
- Connects with tax and promotion features for pricing calculations

## Extensibility

The product feature is designed for extensibility:
- Product types can be extended for different kinds of products
- Metadata fields allow for custom attributes without schema changes
- The variant system can accommodate complex product configurations

This modular architecture ensures that the product feature can evolve as business requirements change, while maintaining compatibility with other system components.