# BigCommerce to CommerceFull Migration Guide

## Overview

This guide provides detailed instructions for migrating from BigCommerce to CommerceFull, covering API-based extraction, transformation, and loading processes.

## Prerequisites

- BigCommerce API credentials (Store Hash, Client ID, Access Token)
- BigCommerce store access for content migration
- CommerceFull API credentials
- Node.js environment for migration scripts

## BigCommerce Data Architecture

### API Structure
- REST API with pagination
- Rate limits: 60,000 requests per hour
- Bulk operations for products and customers
- Webhooks for real-time data sync

### Key Challenges
- API rate limiting and pagination
- Complex product modifiers and options
- Multi-channel inventory management
- Content and theme customization

## Preparation Phase

### 1. API Connection Setup

```javascript
const BigCommerce = require('@bigcommerce/api');

class BigCommerceAPI {
  constructor(config) {
    this.client = new BigCommerce({
      logLevel: 'info',
      clientId: config.clientId,
      accessToken: config.accessToken,
      storeHash: config.storeHash,
      responseType: 'json',
      apiVersion: 'v3'
    });
  }

  async getProducts(params = {}) {
    return await this.client.get('/catalog/products', params);
  }

  async getProduct(productId) {
    return await this.client.get(`/catalog/products/${productId}`);
  }

  async getCustomers(params = {}) {
    return await this.client.get('/customers', params);
  }

  async getOrders(params = {}) {
    return await this.client.get('/orders', params);
  }
}
```

### 2. Data Assessment

```javascript
const assessBigCommerceData = async (bcApi) => {
  try {
    const [products, customers, orders, categories] = await Promise.all([
      bcApi.getProducts({ limit: 1 }).then(res => res.meta?.pagination?.total),
      bcApi.getCustomers({ limit: 1 }).then(res => res.meta?.pagination?.total),
      bcApi.getOrders({ limit: 1 }).then(res => res.meta?.pagination?.total),
      bcApi.client.get('/catalog/categories', { limit: 1 }).then(res => res.meta?.pagination?.total)
    ]);

    return {
      products,
      customers,
      orders,
      categories,
      estimatedTime: Math.ceil((products + customers + orders) / 1000) // Rough estimate
    };
  } catch (error) {
    console.error('Assessment failed:', error);
    throw error;
  }
};
```

## Migration Execution

### Phase 1: Foundation Data

#### 1.1 Categories Migration

```javascript
class BigCommerceCategoryMigrator {
  async migrateCategories(bcApi, cf) {
    const categories = [];
    let page = 1;

    while (true) {
      const response = await bcApi.client.get('/catalog/categories', {
        page,
        limit: 250
      });

      categories.push(...response.data);

      if (response.data.length < 250) break;
      page++;
    }

    // Build category tree
    const categoryTree = this.buildCategoryTree(categories);
    const categoryMap = new Map();

    // Migrate categories in hierarchical order
    for (const category of categoryTree) {
      const cfCategory = await cf.categories.create({
        name: category.name,
        slug: this.generateSlug(category.name),
        description: category.description,
        parentId: category.parent_id ? categoryMap.get(category.parent_id) : null,
        isActive: category.is_visible,
        metaTitle: category.page_title,
        metaDescription: category.meta_description
      });

      categoryMap.set(category.id, cfCategory.id);
    }

    return categoryMap;
  }

  buildCategoryTree(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map
    for (const category of categories) {
      categoryMap.set(category.id, { ...category, children: [] });
    }

    // Second pass: build hierarchy
    for (const category of categories) {
      if (category.parent_id === 0) {
        rootCategories.push(categoryMap.get(category.id));
      } else {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(category.id));
        }
      }
    }

    return this.flattenTree(rootCategories);
  }

  flattenTree(categories) {
    const result = [];

    const flatten = (cats) => {
      for (const cat of cats) {
        result.push(cat);
        if (cat.children) {
          flatten(cat.children);
        }
      }
    };

    flatten(categories);
    return result;
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
```

#### 1.2 Product Attributes Migration

```javascript
class BigCommerceAttributeMigrator {
  async migrateAttributes(bcApi, cf) {
    // BigCommerce has product options/modifiers
    const options = [];
    let page = 1;

    while (true) {
      const response = await bcApi.client.get('/catalog/products/options', {
        page,
        limit: 250
      });

      options.push(...response.data);

      if (response.data.length < 250) break;
      page++;
    }

    // Group options by type and create attribute groups
    const attributeGroups = this.groupOptionsByType(options);

    for (const [type, groupOptions] of Object.entries(attributeGroups)) {
      const group = await cf.productAttributeGroups.create({
        name: `${type} Options`,
        code: type.toLowerCase().replace(/\s+/g, '_'),
        description: `Product ${type.toLowerCase()} options from BigCommerce`,
        position: 1,
        isComparable: true,
        isGlobal: true
      });

      for (const option of groupOptions) {
        const attribute = await cf.productAttributes.create({
          groupId: group.id,
          name: option.display_name || option.name,
          code: option.name.toLowerCase().replace(/\s+/g, '_'),
          description: option.display_name,
          type: 'select',
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
          position: option.sort_order || 0
        });

        // Store option values
        if (option.option_values) {
          await this.migrateOptionValues(cf, attribute.id, option.option_values);
        }
      }
    }
  }

  groupOptionsByType(options) {
    const groups = {};

    for (const option of options) {
      const type = option.type || 'Custom';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(option);
    }

    return groups;
  }

  async migrateOptionValues(cf, attributeId, optionValues) {
    // This would typically be handled by CommerceFull's attribute option system
    // Implementation depends on CF's API structure
    console.log(`Migrating ${optionValues.length} values for attribute ${attributeId}`);
  }
}
```

### Phase 2: Products Migration

#### 2.1 Product Extraction

```javascript
class BigCommerceProductExtractor {
  async extractAllProducts(bcApi) {
    const products = [];
    let page = 1;

    while (true) {
      try {
        const response = await bcApi.getProducts({
          page,
          limit: 250,
          include: 'variants,images,custom_fields,modifiers'
        });

        products.push(...response.data);

        if (response.data.length < 250) break;
        page++;

        // Rate limiting
        await this.sleep(100);

      } catch (error) {
        if (error.status === 429) {
          console.log('Rate limited, waiting...');
          await this.sleep(60000); // Wait 1 minute
          continue;
        }
        throw error;
      }
    }

    return products;
  }

  async extractProductVariants(bcApi, productId) {
    const variants = [];
    let page = 1;

    while (true) {
      const response = await bcApi.client.get(`/catalog/products/${productId}/variants`, {
        page,
        limit: 250
      });

      variants.push(...response.data);

      if (response.data.length < 250) break;
      page++;
    }

    return variants;
  }

  async extractProductModifiers(bcApi, productId) {
    return await bcApi.client.get(`/catalog/products/${productId}/modifiers`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 2.2 Product Transformation

```javascript
class BigCommerceProductTransformer {
  transformProduct(bcProduct, categoryMap) {
    return {
      productId: generateUUID(),
      name: bcProduct.name,
      slug: this.generateSlug(bcProduct.name),
      description: bcProduct.description,
      shortDescription: bcProduct.description?.substring(0, 200),
      sku: bcProduct.sku,
      type: this.mapProductType(bcProduct.type),
      status: bcProduct.is_visible ? 'published' : 'draft',
      visibility: 'public',
      price: parseFloat(bcProduct.price),
      regularPrice: parseFloat(bcProduct.price),
      salePrice: bcProduct.sale_price ? parseFloat(bcProduct.sale_price) : null,
      cost: bcProduct.cost_price ? parseFloat(bcProduct.cost_price) : null,
      weight: parseFloat(bcProduct.weight || 0),
      dimensions: {
        length: parseFloat(bcProduct.depth || 0),
        width: parseFloat(bcProduct.width || 0),
        height: parseFloat(bcProduct.height || 0)
      },
      stockQuantity: bcProduct.inventory_level,
      stockStatus: bcProduct.inventory_tracking === 'none' || bcProduct.inventory_level > 0 ? 'instock' : 'outofstock',
      backorders: bcProduct.inventory_warning_level === 0 ? 'yes' : 'no',
      manageStock: bcProduct.inventory_tracking !== 'none',
      categories: bcProduct.categories?.map(catId => categoryMap.get(catId)).filter(Boolean) || [],
      tags: bcProduct.tags || [],
      attributes: this.transformModifiers(bcProduct.modifiers),
      images: this.transformImages(bcProduct.images),
      variants: this.transformVariants(bcProduct.variants),
      seo: {
        title: bcProduct.page_title,
        description: bcProduct.meta_description,
        keywords: bcProduct.meta_keywords
      },
      customFields: this.transformCustomFields(bcProduct.custom_fields),
      createdAt: bcProduct.date_created,
      updatedAt: bcProduct.date_modified
    };
  }

  mapProductType(bcType) {
    const typeMapping = {
      'physical': 'simple',
      'digital': 'downloadable'
    };
    return typeMapping[bcType] || 'simple';
  }

  transformModifiers(modifiers) {
    if (!modifiers) return [];

    return modifiers.map(modifier => ({
      name: modifier.display_name || modifier.name,
      code: modifier.name.toLowerCase().replace(/\s+/g, '_'),
      type: modifier.type,
      required: modifier.required,
      options: modifier.option_values?.map(option => ({
        label: option.label,
        value: option.value,
        price: parseFloat(option.adjusters?.price?.adjuster_value || 0)
      })) || []
    }));
  }

  transformImages(images) {
    if (!images) return [];

    return images.map((image, index) => ({
      url: image.url_standard,
      alt: image.alt_text || '',
      position: image.sort_order || index,
      width: image.width,
      height: image.height,
      isMain: index === 0
    }));
  }

  transformVariants(variants) {
    if (!variants || variants.length <= 1) return [];

    return variants.map(variant => ({
      variantId: generateUUID(),
      sku: variant.sku,
      price: parseFloat(variant.price || 0),
      salePrice: variant.sale_price ? parseFloat(variant.sale_price) : null,
      cost: variant.cost_price ? parseFloat(variant.cost_price) : null,
      stockQuantity: variant.inventory_level,
      weight: parseFloat(variant.weight || 0),
      dimensions: {
        length: parseFloat(variant.depth || 0),
        width: parseFloat(variant.width || 0),
        height: parseFloat(variant.height || 0)
      },
      options: this.parseVariantOptions(variant.option_values),
      isActive: variant.purchasing_disabled === false,
      imageUrl: variant.image_url
    }));
  }

  parseVariantOptions(optionValues) {
    if (!optionValues) return [];

    return optionValues.map(option => ({
      name: option.option_display_name,
      value: option.label
    }));
  }

  transformCustomFields(customFields) {
    if (!customFields) return {};

    return customFields.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {});
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
}
```

### Phase 3: Customers Migration

#### 3.1 Customer Extraction

```javascript
class BigCommerceCustomerExtractor {
  async extractAllCustomers(bcApi) {
    const customers = [];
    let page = 1;

    while (true) {
      try {
        const response = await bcApi.getCustomers({
          page,
          limit: 250,
          include: 'addresses'
        });

        customers.push(...response.data);

        if (response.data.length < 250) break;
        page++;

        await this.sleep(100);

      } catch (error) {
        if (error.status === 429) {
          await this.sleep(60000);
          continue;
        }
        throw error;
      }
    }

    return customers;
  }

  async extractCustomerAddresses(bcApi, customerId) {
    return await bcApi.client.get(`/customers/${customerId}/addresses`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 3.2 Customer Transformation

```javascript
class BigCommerceCustomerTransformer {
  transformCustomer(bcCustomer) {
    const addresses = bcCustomer.addresses || [];
    const defaultBilling = addresses.find(addr => addr.is_default_billing);
    const defaultShipping = addresses.find(addr => addr.is_default_shipping);

    return {
      customerId: generateUUID(),
      email: bcCustomer.email,
      firstName: bcCustomer.first_name,
      lastName: bcCustomer.last_name,
      phone: bcCustomer.phone,
      company: bcCustomer.company,
      dateCreated: bcCustomer.date_created,
      dateModified: bcCustomer.date_modified,
      acceptsMarketing: bcCustomer.accepts_product_review_abandoned_cart_emails,
      addresses: addresses.map(addr => this.transformAddress(addr)),
      billingAddress: defaultBilling ? this.transformAddress(defaultBilling) : null,
      shippingAddress: defaultShipping ? this.transformAddress(defaultShipping) : null,
      notes: bcCustomer.notes || '',
      taxExemptCategory: bcCustomer.tax_exempt_category,
      customerGroupId: bcCustomer.customer_group_id,
      storeCredit: parseFloat(bcCustomer.store_credit || 0),
      registrationIpAddress: bcCustomer.registration_ip_address,
      createdAt: bcCustomer.date_created,
      updatedAt: bcCustomer.date_modified
    };
  }

  transformAddress(bcAddress) {
    return {
      firstName: bcAddress.first_name,
      lastName: bcAddress.last_name,
      company: bcAddress.company,
      address1: bcAddress.street_1,
      address2: bcAddress.street_2,
      city: bcAddress.city,
      state: bcAddress.state,
      postcode: bcAddress.zip,
      country: bcAddress.country_iso2,
      phone: bcAddress.phone
    };
  }
}
```

## Rate Limiting and Performance Optimization

```javascript
class BigCommerceRateLimiter {
  constructor(requestsPerHour = 60000) {
    this.requestsPerHour = requestsPerHour;
    this.requests = [];
  }

  async executeRequest(requestFn) {
    await this.throttle();

    const startTime = Date.now();
    try {
      const result = await requestFn();
      this.requests.push({ timestamp: startTime, success: true });
      return result;
    } catch (error) {
      this.requests.push({ timestamp: startTime, success: false });
      throw error;
    }
  }

  async throttle() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    // Clean old requests
    this.requests = this.requests.filter(req => req.timestamp > hourAgo);

    if (this.requests.length >= this.requestsPerHour) {
      const oldestRequest = Math.min(...this.requests.map(r => r.timestamp));
      const waitTime = (60 * 60 * 1000) - (now - oldestRequest);
      await this.sleep(waitTime);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Complete Migration Script

```javascript
const BigCommerceMigrationRunner = require('./bigcommerce-migration-runner');

async function runBigCommerceMigration() {
  const runner = new BigCommerceMigrationRunner({
    bigcommerce: {
      storeHash: process.env.BC_STORE_HASH,
      clientId: process.env.BC_CLIENT_ID,
      accessToken: process.env.BC_ACCESS_TOKEN
    },
    commercefull: {
      baseURL: process.env.COMMERCEFULL_URL,
      apiKey: process.env.COMMERCEFULL_API_KEY
    },
    options: {
      batchSize: 50,
      concurrency: 2,
      continueOnError: true
    }
  });

  try {
    console.log('Starting BigCommerce to CommerceFull migration...');

    // Phase 1: Foundation data
    await runner.migrateCategories();
    await runner.migrateAttributes();

    // Phase 2: Products
    await runner.migrateProducts();

    // Phase 3: Customers
    await runner.migrateCustomers();

    // Phase 4: Orders
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

runBigCommerceMigration();
```

## Post-Migration Validation

### API-Based Validation

```javascript
const BigCommerceValidation = {
  async validateProductCounts(bcApi, cfApi) {
    const bcCount = await bcApi.getProducts({ limit: 1 }).then(res => res.meta.pagination.total);
    const cfCount = await cfApi.products.count();

    return {
      bigcommerce: bcCount,
      commercefull: cfCount,
      difference: Math.abs(bcCount - cfCount)
    };
  },

  async validateCustomerCounts(bcApi, cfApi) {
    const bcCount = await bcApi.getCustomers({ limit: 1 }).then(res => res.meta.pagination.total);
    const cfCount = await cfApi.customers.count();

    return {
      bigcommerce: bcCount,
      commercefull: cfCount,
      difference: Math.abs(bcCount - cfCount)
    };
  },

  async validateOrderTotals(bcApi, cfApi) {
    // For orders, we might need to compare date ranges due to API limitations
    const recentOrders = await bcApi.getOrders({
      limit: 250,
      'date_created:min': '2023-01-01'
    });

    const bcTotal = recentOrders.reduce((sum, order) => sum + parseFloat(order.total_inc_tax), 0);

    const cfOrders = await cfApi.orders.list({
      createdAfter: '2023-01-01',
      limit: 1000
    });

    const cfTotal = cfOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      bigcommerce: bcTotal,
      commercefull: cfTotal,
      difference: Math.abs(bcTotal - cfTotal)
    };
  }
};
```

## Troubleshooting Common Issues

### API Rate Limiting

```javascript
// Implement exponential backoff
class ExponentialBackoff {
  constructor(baseDelay = 1000, maxDelay = 60000) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  async executeWithBackoff(operation, maxRetries = 5) {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        if (error.status === 429) {
          const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
          console.log(`Rate limited, waiting ${delay}ms...`);
          await this.sleep(delay);
          attempt++;
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Operation failed after ${maxRetries} attempts`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Product Modifier Complexity

```javascript
// Handle complex product modifiers
class ModifierTransformer {
  transformComplexModifiers(modifiers) {
    const attributes = [];
    const variants = [];

    for (const modifier of modifiers) {
      if (modifier.type === 'select') {
        attributes.push(this.transformSelectModifier(modifier));
      } else if (modifier.type === 'checkbox') {
        attributes.push(this.transformCheckboxModifier(modifier));
      } else if (modifier.type === 'number') {
        attributes.push(this.transformNumberModifier(modifier));
      }
    }

    return { attributes, variants };
  }

  transformSelectModifier(modifier) {
    return {
      name: modifier.display_name,
      type: 'select',
      options: modifier.option_values.map(option => ({
        label: option.label,
        value: option.value,
        priceAdjustment: option.adjusters?.price?.adjuster_value || 0
      }))
    };
  }
}
```

This comprehensive guide addresses BigCommerce's API-based architecture, providing strategies for handling rate limits, complex product modifiers, and efficient data extraction from their platform.
