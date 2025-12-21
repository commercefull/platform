# Wix E-commerce Migration Guide

## Overview

This guide provides detailed instructions for migrating from Wix E-commerce to CommerceFull, addressing the platform's API limitations and data structure complexities.

## Prerequisites

- Wix site access with admin permissions
- Wix API key and account ID
- CommerceFull API credentials
- Access to Wix Developer Console
- Node.js environment for migration scripts

## Wix Data Architecture

### API Structure
- REST API with GraphQL elements
- Limited bulk operations
- Rate limits: 100 requests per minute
- Webhooks for real-time updates
- Complex permission model

### Key Challenges
- Limited API access compared to other platforms
- Product options and variations handling
- Media asset migration complexity
- Order history limitations
- Custom app data extraction

## Preparation Phase

### 1. Wix API Setup

```javascript
const WixAPI = require('wix-api-client');

class WixAPIClient {
  constructor(config) {
    this.accountId = config.accountId;
    this.apiKey = config.apiKey;
    this.siteId = config.siteId;

    // Wix API client setup
    this.client = new WixAPI({
      accountId: this.accountId,
      apiKey: this.apiKey,
      siteId: this.siteId
    });
  }

  async getProducts(options = {}) {
    return await this.client.ecommerce.products.query(options).find();
  }

  async getProduct(productId) {
    return await this.client.ecommerce.products.get(productId);
  }

  async getOrders(options = {}) {
    return await this.client.ecommerce.orders.query(options).find();
  }

  async getCustomers(options = {}) {
    return await this.client.ecommerce.contacts.query(options).find();
  }

  async getCollections(options = {}) {
    return await this.client.ecommerce.collections.query(options).find();
  }
}
```

### 2. Data Assessment

```javascript
const assessWixData = async (wixApi) => {
  try {
    // Get basic counts (limited by Wix API)
    const productsQuery = await wixApi.getProducts({ limit: 1 });
    const ordersQuery = await wixApi.getOrders({ limit: 1 });
    const customersQuery = await wixApi.getCustomers({ limit: 1 });
    const collectionsQuery = await wixApi.getCollections({ limit: 1 });

    // Estimate totals (Wix doesn't provide total counts in basic API)
    const assessment = {
      products: {
        estimatedTotal: await estimateTotal(wixApi, 'products'),
        sampleData: productsQuery.items?.[0]
      },
      orders: {
        estimatedTotal: await estimateTotal(wixApi, 'orders'),
        sampleData: ordersQuery.items?.[0]
      },
      customers: {
        estimatedTotal: await estimateTotal(wixApi, 'customers'),
        sampleData: customersQuery.items?.[0]
      },
      collections: {
        estimatedTotal: await estimateTotal(wixApi, 'collections'),
        sampleData: collectionsQuery.items?.[0]
      }
    };

    return assessment;

  } catch (error) {
    console.error('Wix assessment failed:', error);
    throw error;
  }
};

// Helper function to estimate totals
async function estimateTotal(api, endpoint) {
  let total = 0;
  let hasMore = true;
  let offset = 0;
  const limit = 100;

  while (hasMore) {
    const response = await api[`get${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}`]({
      limit,
      offset
    });

    const items = response.items || [];
    total += items.length;

    if (items.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }

    // Safety limit to prevent infinite loops
    if (total > 10000) {
      return `${total}+ (limited estimate)`;
    }
  }

  return total;
}
```

## Migration Execution

### Phase 1: Foundation Data

#### 1.1 Collections to Categories Migration

```javascript
class WixCollectionsMigrator {
  async migrateCollections(wixApi, cf) {
    const collections = [];
    let hasMore = true;
    let offset = 0;

    // Get all collections
    while (hasMore) {
      const response = await wixApi.getCollections({
        limit: 100,
        offset
      });

      collections.push(...(response.items || []));

      if ((response.items || []).length < 100) {
        hasMore = false;
      } else {
        offset += 100;
      }
    }

    // Build hierarchy (Wix collections can have parent relationships)
    const collectionMap = new Map();

    for (const collection of collections) {
      const category = await cf.categories.create({
        name: collection.name,
        slug: this.generateSlug(collection.name),
        description: collection.description || '',
        parentId: collection.parentId ? collectionMap.get(collection.parentId) : null,
        isActive: collection.visible,
        metaTitle: collection.seoData?.title,
        metaDescription: collection.seoData?.description
      });

      collectionMap.set(collection._id, category.id);
    }

    return collectionMap;
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
```

#### 1.2 Product Options to Attributes Migration

```javascript
class WixProductOptionsMigrator {
  async migrateProductOptions(wixApi, cf) {
    // Get sample products to analyze option structures
    const sampleProducts = await wixApi.getProducts({ limit: 50 });

    // Extract unique option types
    const optionTypes = new Map();

    for (const product of sampleProducts.items || []) {
      if (product.productOptions) {
        for (const option of product.productOptions) {
          if (!optionTypes.has(option.name)) {
            optionTypes.set(option.name, {
              name: option.name,
              type: option.optionType,
              choices: new Set()
            });
          }

          // Collect all possible values
          if (option.choices) {
            for (const choice of option.choices) {
              optionTypes.get(option.name).choices.add(choice.description);
            }
          }
        }
      }
    }

    // Create attribute groups and attributes
    for (const [optionName, optionData] of optionTypes) {
      // Create group
      const group = await cf.productAttributeGroups.create({
        name: `${optionName} Options`,
        code: optionName.toLowerCase().replace(/\s+/g, '_'),
        description: `Product ${optionName.toLowerCase()} options from Wix`,
        position: 1,
        isComparable: true,
        isGlobal: true
      });

      // Create attribute
      const attribute = await cf.productAttributes.create({
        groupId: group.id,
        name: optionName,
        code: optionName.toLowerCase().replace(/\s+/g, '_'),
        description: optionName,
        type: this.mapOptionType(optionData.type),
        inputType: 'select',
        isRequired: false,
        isUnique: false,
        isSystem: false,
        isSearchable: true,
        isFilterable: true,
        isComparable: true,
        isVisibleOnFront: true,
        isUsedInProductListing: true,
        useForVariants: true,
        useForConfigurations: false,
        position: 1,
        options: Array.from(optionData.choices).map(choice => ({
          label: choice,
          value: choice.toLowerCase().replace(/\s+/g, '_')
        }))
      });
    }
  }

  mapOptionType(wixType) {
    const typeMapping = {
      'drop_down': 'select',
      'radio': 'select',
      'checkbox': 'select',
      'color': 'select',
      'text': 'text'
    };
    return typeMapping[wixType] || 'select';
  }
}
```

### Phase 2: Products Migration

#### 2.1 Product Data Extraction

```javascript
class WixProductExtractor {
  async extractAllProducts(wixApi) {
    const products = [];
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      const response = await wixApi.getProducts({
        limit: 100,
        offset
      });

      const items = response.items || [];
      products.push(...items);

      if (items.length < 100) {
        hasMore = false;
      } else {
        offset += 100;
      }

      // Rate limiting
      await this.sleep(600); // 100 requests per minute = ~600ms between requests
    }

    return products;
  }

  async extractProductVariants(wixApi, productId) {
    const product = await wixApi.getProduct(productId);
    return product.variants || [];
  }

  async extractProductMedia(wixApi, productId) {
    const product = await wixApi.getProduct(productId);
    return product.media?.items || [];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 2.2 Product Transformation

```javascript
class WixProductTransformer {
  transformProduct(wixProduct, collectionMap) {
    return {
      productId: generateUUID(),
      name: wixProduct.name,
      slug: this.generateSlug(wixProduct.slug || wixProduct.name),
      description: wixProduct.description,
      shortDescription: this.extractShortDescription(wixProduct.description),
      sku: wixProduct.sku,
      type: this.mapProductType(wixProduct),
      status: wixProduct.visible ? 'published' : 'draft',
      visibility: 'public',
      price: parseFloat(wixProduct.price?.formatted?.amount || wixProduct.price || 0),
      regularPrice: parseFloat(wixProduct.price?.formatted?.amount || wixProduct.price || 0),
      salePrice: wixProduct.discountedPrice ?
        parseFloat(wixProduct.discountedPrice.formatted?.amount || wixProduct.discountedPrice) : null,
      cost: wixProduct.cost ? parseFloat(wixProduct.cost.formatted?.amount || wixProduct.cost) : null,
      weight: parseFloat(wixProduct.weight || 0),
      stockQuantity: wixProduct.stock?.quantity || 0,
      stockStatus: this.mapStockStatus(wixProduct.stock),
      backorders: wixProduct.stock?.allowBackorders ? 'yes' : 'no',
      manageStock: wixProduct.stock?.trackInventory !== false,
      categories: wixProduct.collections?.map(col => collectionMap.get(col._id)).filter(Boolean) || [],
      attributes: this.transformProductOptions(wixProduct.productOptions),
      images: this.transformMedia(wixProduct.media?.items),
      variants: wixProduct.variants ? this.transformVariants(wixProduct.variants) : [],
      seo: {
        title: wixProduct.seoData?.title,
        description: wixProduct.seoData?.description,
        keywords: wixProduct.seoData?.tags?.join(', ')
      },
      customFields: this.transformCustomFields(wixProduct),
      createdAt: wixProduct.createdDate,
      updatedAt: wixProduct.lastUpdated
    };
  }

  mapProductType(wixProduct) {
    if (wixProduct.productType === 'digital') return 'downloadable';
    if (wixProduct.productOptions && wixProduct.productOptions.length > 0) return 'configurable';
    return 'simple';
  }

  mapStockStatus(stock) {
    if (!stock || stock.trackInventory === false) return 'instock';
    if (stock.quantity > 0) return 'instock';
    return 'outofstock';
  }

  transformProductOptions(options) {
    if (!options) return [];

    return options.map(option => ({
      name: option.name,
      code: option.name.toLowerCase().replace(/\s+/g, '_'),
      type: 'select',
      required: option.required || false,
      values: option.choices?.map(choice => ({
        label: choice.description,
        value: choice.value
      })) || []
    }));
  }

  transformMedia(mediaItems) {
    if (!mediaItems) return [];

    return mediaItems.map((media, index) => ({
      url: media.url || media.src,
      alt: media.altText || '',
      position: index,
      width: media.width,
      height: media.height,
      isMain: index === 0
    }));
  }

  transformVariants(variants) {
    if (!variants) return [];

    return variants.map(variant => ({
      variantId: generateUUID(),
      sku: variant.sku,
      price: parseFloat(variant.price?.formatted?.amount || variant.price || 0),
      stockQuantity: variant.stock?.quantity || 0,
      attributes: this.parseVariantOptions(variant.choices),
      isActive: variant.visible !== false
    }));
  }

  parseVariantOptions(choices) {
    if (!choices) return [];

    return Object.entries(choices).map(([optionName, choice]) => ({
      name: optionName,
      value: choice.description || choice
    }));
  }

  transformCustomFields(product) {
    const customFields = {};

    // Extract additional product data as custom fields
    if (product.brand) customFields.brand = product.brand;
    if (product.productCode) customFields.productCode = product.productCode;
    if (product.ribbon) customFields.ribbon = product.ribbon;

    return customFields;
  }

  extractShortDescription(description) {
    if (!description) return '';
    // Extract first sentence or limit to 200 characters
    const sentences = description.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    return firstSentence && firstSentence.length <= 200 ? firstSentence :
           description.substring(0, 200) + '...';
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
```

### Phase 3: Customers Migration

#### 3.1 Customer Data Extraction

```javascript
class WixCustomerExtractor {
  async extractAllCustomers(wixApi) {
    const customers = [];
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      const response = await wixApi.getCustomers({
        limit: 100,
        offset
      });

      const items = response.items || [];
      customers.push(...items);

      if (items.length < 100) {
        hasMore = false;
      } else {
        offset += 100;
      }

      await this.sleep(600);
    }

    return customers;
  }

  async extractCustomerDetails(wixApi, contactId) {
    // Get detailed customer information
    try {
      const contact = await wixApi.client.contacts.get(contactId, {
        include: 'addresses,emails,phones'
      });
      return contact;
    } catch (error) {
      console.warn(`Could not get details for customer ${contactId}:`, error);
      return null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 3.2 Customer Transformation

```javascript
class WixCustomerTransformer {
  transformCustomer(wixCustomer) {
    // Wix customer data structure varies
    const primaryInfo = wixCustomer.primaryInfo || wixCustomer;
    const contactInfo = wixCustomer.contactInfo || {};

    return {
      customerId: generateUUID(),
      email: primaryInfo.email || contactInfo.email,
      firstName: primaryInfo.firstName || contactInfo.firstName,
      lastName: primaryInfo.lastName || contactInfo.lastName,
      phone: contactInfo.phones?.[0]?.phone || contactInfo.phone,
      dateOfBirth: primaryInfo.birthdate ? new Date(primaryInfo.birthdate).toISOString().split('T')[0] : null,
      gender: this.mapGender(primaryInfo.gender),
      billingAddress: this.transformAddress(wixCustomer.addresses?.find(addr => addr.addressType === 'billing')),
      shippingAddress: this.transformAddress(wixCustomer.addresses?.find(addr => addr.addressType === 'shipping')),
      isActive: wixCustomer.status !== 'inactive',
      acceptsMarketing: primaryInfo.emailMarketingConsent?.subscribed || false,
      notes: primaryInfo.notes || '',
      tags: wixCustomer.labels || [],
      createdAt: wixCustomer.createdDate,
      updatedAt: wixCustomer.lastUpdated
    };
  }

  mapGender(wixGender) {
    const genderMap = {
      'M': 'Male',
      'F': 'Female',
      'O': 'Other'
    };
    return genderMap[wixGender] || null;
  }

  transformAddress(wixAddress) {
    if (!wixAddress) return null;

    return {
      firstName: wixAddress.contactDetails?.firstName,
      lastName: wixAddress.contactDetails?.lastName,
      company: wixAddress.company,
      address1: wixAddress.addressLine1,
      address2: wixAddress.addressLine2,
      city: wixAddress.city,
      state: wixAddress.subdivision,
      postcode: wixAddress.postalCode,
      country: wixAddress.country
    };
  }
}
```

### Phase 4: Orders Migration

#### 4.1 Order Data Extraction

```javascript
class WixOrderExtractor {
  async extractAllOrders(wixApi, dateFilter = null) {
    const orders = [];
    let hasMore = true;
    let offset = 0;

    const query = {
      limit: 100,
      offset
    };

    // Add date filter if provided (Wix API limitations)
    if (dateFilter) {
      query.createdDate = {
        $gte: dateFilter.start,
        $lte: dateFilter.end
      };
    }

    while (hasMore) {
      const response = await wixApi.getOrders(query);

      const items = response.items || [];
      orders.push(...items);

      if (items.length < 100) {
        hasMore = false;
      } else {
        offset += 100;
        query.offset = offset;
      }

      await this.sleep(600);
    }

    return orders;
  }

  async extractOrderFulfillments(wixApi, orderId) {
    try {
      const fulfillments = await wixApi.client.ecommerce.orders.fulfillments.list(orderId);
      return fulfillments.items || [];
    } catch (error) {
      console.warn(`Could not get fulfillments for order ${orderId}:`, error);
      return [];
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 4.2 Order Transformation

```javascript
class WixOrderTransformer {
  transformOrder(wixOrder, customerMap, productMap) {
    return {
      orderId: generateUUID(),
      orderNumber: wixOrder.number.toString(),
      externalId: wixOrder._id,
      status: this.mapOrderStatus(wixOrder.status),
      customerId: wixOrder.customerId ? customerMap.get(wixOrder.customerId) : null,
      billingAddress: this.transformAddress(wixOrder.billingInfo),
      shippingAddress: this.transformAddress(wixOrder.shippingInfo),
      lineItems: this.transformLineItems(wixOrder.lineItems, productMap),
      shippingTotal: parseFloat(wixOrder.shippingInfo?.shippingCosts?.total?.amount || 0),
      taxTotal: parseFloat(wixOrder.totals?.tax?.amount || 0),
      discountTotal: parseFloat(wixOrder.totals?.discount?.amount || 0),
      total: parseFloat(wixOrder.totals?.total?.amount || wixOrder.total || 0),
      currency: wixOrder.currency,
      paymentMethod: wixOrder.paymentMethod?.name || 'unknown',
      paymentMethodTitle: wixOrder.paymentMethod?.type || 'Unknown',
      transactionId: wixOrder.paymentTransactionId,
      customerNote: wixOrder.customerNote || '',
      orderNotes: this.extractOrderNotes(wixOrder),
      createdAt: wixOrder.createdDate,
      updatedAt: wixOrder.updatedDate
    };
  }

  mapOrderStatus(wixStatus) {
    const statusMapping = {
      'new': 'pending',
      'in_progress': 'processing',
      'fulfilled': 'completed',
      'cancelled': 'cancelled',
      'refunded': 'refunded'
    };
    return statusMapping[wixStatus] || 'pending';
  }

  transformAddress(wixAddressInfo) {
    if (!wixAddressInfo) return null;

    const address = wixAddressInfo.address || wixAddressInfo;

    return {
      firstName: address.contactDetails?.firstName,
      lastName: address.contactDetails?.lastName,
      company: address.company,
      address1: address.addressLine1 || address.streetAddress?.street1,
      address2: address.addressLine2 || address.streetAddress?.street2,
      city: address.city,
      state: address.subdivision || address.state,
      postcode: address.postalCode || address.zipCode,
      country: address.country
    };
  }

  transformLineItems(lineItems, productMap) {
    return lineItems?.map(item => {
      const productId = productMap.get(item.productId);

      return {
        productId: productId || null,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price?.amount || item.price || 0),
        total: parseFloat(item.total?.amount || item.total || 0),
        taxTotal: parseFloat(item.tax?.amount || 0),
        variantId: item.variantId ? this.findVariantId(item.variantId, productId) : null
      };
    }) || [];
  }

  extractOrderNotes(order) {
    const notes = [];

    if (order.fulfillmentStatus) {
      notes.push(`Fulfillment Status: ${order.fulfillmentStatus}`);
    }

    if (order.archived) {
      notes.push('Order archived in Wix');
    }

    return notes;
  }

  findVariantId(wixVariantId, commercefullProductId) {
    // This would require maintaining a mapping of Wix variant IDs to CF variant IDs
    // Implementation depends on how variants are migrated
    return null; // Placeholder
  }
}
```

## Complete Migration Script

```javascript
const WixMigrationRunner = require('./wix-migration-runner');

async function runWixMigration() {
  const runner = new WixMigrationRunner({
    wix: {
      accountId: process.env.WIX_ACCOUNT_ID,
      apiKey: process.env.WIX_API_KEY,
      siteId: process.env.WIX_SITE_ID
    },
    commercefull: {
      baseURL: process.env.COMMERCEFULL_URL,
      apiKey: process.env.COMMERCEFULL_API_KEY
    },
    options: {
      batchSize: 50,
      concurrency: 1, // Conservative due to Wix rate limits
      continueOnError: true,
      dateRange: {
        start: '2023-01-01', // Limit historical data
        end: new Date().toISOString().split('T')[0]
      }
    }
  });

  try {
    console.log('Starting Wix to CommerceFull migration...');

    // Phase 1: Foundation data
    await runner.migrateCollections();
    await runner.migrateProductOptions();

    // Phase 2: Products
    await runner.migrateProducts();

    // Phase 3: Customers
    await runner.migrateCustomers();

    // Phase 4: Orders (limited by date range)
    await runner.migrateOrders();

    // Phase 5: Content
    await runner.migrateContent();

    console.log('Migration completed successfully!');
    console.log(runner.monitor.generateReport());

  } catch (error) {
    console.error('Migration failed:', error);
    console.log('Partial results:', runner.monitor.generateReport());
  }
}

runWixMigration();
```

## Rate Limiting and API Management

```javascript
class WixRateLimiter {
  constructor(requestsPerMinute = 100) {
    this.requestsPerMinute = requestsPerMinute;
    this.requests = [];
  }

  async executeWithRateLimit(operation) {
    await this.enforceRateLimit();

    const startTime = Date.now();
    try {
      const result = await operation();
      this.requests.push({ timestamp: startTime, success: true });
      return result;
    } catch (error) {
      this.requests.push({ timestamp: startTime, success: false });
      throw error;
    }
  }

  async enforceRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old requests
    this.requests = this.requests.filter(req => req.timestamp > oneMinuteAgo);

    if (this.requests.length >= this.requestsPerMinute) {
      // Wait until we can make another request
      const oldestRequest = Math.min(...this.requests.map(r => r.timestamp));
      const waitTime = 60000 - (now - oldestRequest);

      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms...`);
        await this.sleep(waitTime);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Post-Migration Validation

### Wix-Specific Validation

```javascript
const WixValidation = {
  async validateProductCounts(wixApi, cfApi) {
    const wixProducts = await wixApi.getProducts({ limit: 1 });
    // Note: Wix API may not provide total counts
    const cfCount = await cfApi.products.count();

    return {
      wix: 'API limited - manual verification needed',
      commercefull: cfCount,
      note: 'Wix API has limitations on total counts'
    };
  },

  async validateCollections(wixApi, cfApi) {
    const wixCollections = await wixApi.getCollections({ limit: 250 });
    const cfCategories = await cfApi.categories.list({ limit: 1000 });

    return {
      wix: wixCollections.items?.length || 0,
      commercefull: cfCategories.length,
      difference: Math.abs((wixCollections.items?.length || 0) - cfCategories.length)
    };
  },

  async validateProductOptions(wixApi, cfApi) {
    // Sample some products to check option structures
    const wixProducts = await wixApi.getProducts({ limit: 10 });
    const cfProducts = await cfApi.products.list({ limit: 10 });

    const wixHasOptions = wixProducts.items?.some(p => p.productOptions?.length > 0);
    const cfHasVariants = cfProducts.some(p => p.variants?.length > 0);

    return {
      wixHasOptions,
      cfHasVariants,
      optionsMigrated: wixHasOptions === cfHasVariants
    };
  }
};
```

## Troubleshooting Wix Limitations

### API Access Issues

**Problem**: Limited API access compared to other platforms
**Solutions**:
- Use webhooks for real-time data sync during transition
- Export data manually for historical records
- Implement incremental sync after initial migration

### Product Options Complexity

**Problem**: Complex product option structures
**Solutions**:
- Pre-analyze option structures before migration
- Create mapping tables for option relationships
- Handle edge cases with custom logic

### Historical Data Limitations

**Problem**: Limited historical order data via API
**Solutions**:
- Export historical data manually from Wix admin
- Use CSV imports for old orders
- Implement phased migration approach

This guide addresses Wix's unique challenges including API limitations, complex product options, and rate limiting constraints while providing a comprehensive migration strategy to CommerceFull.
