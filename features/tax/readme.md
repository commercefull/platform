# Tax Management Feature

## Feature Overview

The tax feature includes:

### Data Models
- **TaxRate**: Defines tax rates based on location, with support for country, region, and postal code targeting
- **TaxCategory**: Categorizes products for different tax treatments
- **TaxExemption**: Manages customer tax exemptions with certificate tracking

### Tax Repository (`taxRepo.ts`)
- CRUD operations for tax rates, categories, and exemptions
- Line item tax calculation with location-based tax application
- Basket-level tax calculation with detailed breakdown
- Support for tax exemptions based on customer status

### Controllers
- **Admin Controller**: Complete management of tax rates, categories, and exemptions
- **Public Controller**: Tax calculation endpoints for frontend consumption

### Routers
- **Admin Router**: Protected endpoints requiring admin authentication
- **Public Router**: Mix of public and authenticated endpoints for tax calculations

## Key Features

- **Location-based Tax Rates**: Configure taxes based on country, region/state, and even postal code
- **Product Category Support**: Apply different tax rates to different product categories
- **Tax Exemptions**: Manage customer tax exemptions with certificate tracking and expiration dates
- **Detailed Tax Breakdowns**: Get detailed tax breakdowns per line item and for the entire basket
- **Priority-based Tax Application**: Configure which taxes apply first when multiple taxes are applicable

This implementation follows the same architectural pattern as your existing content feature, ensuring consistency across your platform.

## API Usage

For detailed usage examples and endpoint documentation, refer to the controller and router implementations.