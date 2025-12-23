# Shopify to CommerceFull Migration Guide

## Overview

This guide provides detailed instructions for migrating from Shopify to CommerceFull, covering data extraction, transformation, and loading processes.

## Prerequisites

- Shopify Admin API access token
- CommerceFull API credentials
- Node.js environment for migration scripts
- Database access for both platforms

## Migration Scope

### Data Entities

- **Products**: Including variants, images, inventory
- **Customers**: Profiles, addresses, order history
- **Orders**: Complete order data with line items
- **Content**: Blog posts, pages, redirects
- **Discounts**: Price rules, discount codes
- **Inventory**: Stock levels, locations

### Limitations

- Shopify API rate limits (40 requests per minute for basic plan)
- Historical data availability (limited to 2 years for some endpoints)
- Webhook dependencies and custom app data

## Preparation Phase

### 1. Shopify API Setup

```javascript
const Shopify = require('shopify-api-node');

const shopify = new Shopify({
  shopName: 'your-store.myshopify.com',
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_ACCESS_TOKEN,
  autoLimit: true, // Handles rate limiting automatically
});
```

### 2. CommerceFull API Setup

```javascript
const CommerceFullAPI = require('./commercefull-client');

const cf = new CommerceFullAPI({
  baseURL: process.env.COMMERCEFULL_URL,
  apiKey: process.env.COMMERCEFULL_API_KEY,
});
```

### 3. Data Assessment

```javascript
const assessment = {
  products: await shopify.product.count(),
  customers: await shopify.customer.count(),
  orders: await shopify.order.count(),
  blogs: await shopify.blog.count(),
  pages: await shopify.page.count(),
};
```

## Migration Execution

### Phase 1: Foundation Data

#### 1.1 Product Types Migration

```javascript
const migrateProductTypes = async () => {
  // Shopify doesn't have explicit product types like CommerceFull
  // Map Shopify product types to CommerceFull equivalents
  const productTypeMapping = {
    physical: 'Simple Product',
    digital: 'Downloadable Product',
    service: 'Virtual Product',
  };

  // These are typically pre-seeded in CommerceFull
};
```

#### 1.2 Tax Categories Migration

```javascript
const migrateTaxCategories = async () => {
  // Extract Shopify tax rates
  const countries = await shopify.country.list();

  for (const country of countries) {
    for (const province of country.provinces) {
      if (province.tax) {
        await cf.taxCategories.create({
          name: `${country.name} - ${province.name}`,
          rate: province.tax,
          country: country.code,
          region: province.code,
        });
      }
    }
  }
};
```

### Phase 2: Products Migration

#### 2.1 Product Extraction

```javascript
class ShopifyProductExtractor {
  async extractAll() {
    const products = [];
    let params = { limit: 250 };

    do {
      const response = await shopify.product.list(params);
      products.push(...response);
      params = response.nextPageParameters;
    } while (params);

    return products;
  }

  async extractProduct(productId) {
    return await shopify.product.get(productId);
  }

  async extractVariants(productId) {
    const variants = await shopify.productVariant.list(productId);
    return variants;
  }

  async extractImages(productId) {
    const images = await shopify.productImage.list(productId);
    return images;
  }
}
```

#### 2.2 Product Transformation

```javascript
class ShopifyToCommerceFullTransformer {
  transformProduct(shopifyProduct) {
    return {
      productId: generateUUID(),
      name: shopifyProduct.title,
      slug: this.generateSlug(shopifyProduct.handle),
      description: shopifyProduct.body_html,
      shortDescription: this.extractShortDescription(shopifyProduct.body_html),
      sku: shopifyProduct.variants[0]?.sku,
      type: this.mapProductType(shopifyProduct.product_type),
      status: shopifyProduct.status === 'active' ? 'published' : 'draft',
      visibility: 'public',
      price: parseFloat(shopifyProduct.variants[0]?.price),
      compareAtPrice: parseFloat(shopifyProduct.variants[0]?.compare_at_price),
      cost: parseFloat(shopifyProduct.variants[0]?.cost),
      weight: parseFloat(shopifyProduct.variants[0]?.weight),
      weightUnit: shopifyProduct.variants[0]?.weight_unit,
      dimensions: {
        length: parseFloat(shopifyProduct.variants[0]?.length),
        width: parseFloat(shopifyProduct.variants[0]?.width),
        height: parseFloat(shopifyProduct.variants[0]?.height),
      },
      tags: shopifyProduct.tags?.split(',').map(tag => tag.trim()),
      categories: this.transformCollections(shopifyProduct.collections),
      images: this.transformImages(shopifyProduct.images),
      variants: this.transformVariants(shopifyProduct.variants),
      metafields: this.transformMetafields(shopifyProduct.metafields),
      seo: {
        title: shopifyProduct.metafields?.find(mf => mf.key === 'title_tag')?.value,
        description: shopifyProduct.metafields?.find(mf => mf.key === 'description_tag')?.value,
      },
      createdAt: new Date(shopifyProduct.created_at).toISOString(),
      updatedAt: new Date(shopifyProduct.updated_at).toISOString(),
    };
  }

  mapProductType(shopifyType) {
    const typeMapping = {
      physical: 'simple',
      digital: 'downloadable',
      service: 'virtual',
    };
    return typeMapping[shopifyType?.toLowerCase()] || 'simple';
  }

  generateSlug(handle) {
    return (
      handle
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || ''
    );
  }

  extractShortDescription(html) {
    // Extract first paragraph or truncate HTML
    const text = html?.replace(/<[^>]*>/g, '') || '';
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  transformCollections(collections) {
    return (
      collections?.map(collection => ({
        id: collection.id,
        name: collection.title,
        slug: this.generateSlug(collection.handle),
      })) || []
    );
  }

  transformImages(images) {
    return (
      images?.map(image => ({
        url: image.src,
        alt: image.alt || '',
        position: image.position,
        width: image.width,
        height: image.height,
      })) || []
    );
  }

  transformVariants(variants) {
    return (
      variants?.map(variant => ({
        variantId: generateUUID(),
        sku: variant.sku,
        price: parseFloat(variant.price),
        compareAtPrice: parseFloat(variant.compare_at_price),
        cost: parseFloat(variant.cost),
        inventory: {
          quantity: variant.inventory_quantity,
          policy: variant.inventory_policy,
          management: variant.inventory_management,
        },
        weight: parseFloat(variant.weight),
        weightUnit: variant.weight_unit,
        dimensions: {
          length: parseFloat(variant.length),
          width: parseFloat(variant.width),
          height: parseFloat(variant.height),
        },
        options: this.parseVariantOptions(variant),
        barcode: variant.barcode,
        taxable: variant.taxable,
      })) || []
    );
  }

  parseVariantOptions(variant) {
    const options = [];
    if (variant.option1) options.push({ name: 'option1', value: variant.option1 });
    if (variant.option2) options.push({ name: 'option2', value: variant.option2 });
    if (variant.option3) options.push({ name: 'option3', value: variant.option3 });
    return options;
  }

  transformMetafields(metafields) {
    return (
      metafields?.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {}) || {}
    );
  }
}
```

#### 2.3 Product Loading

```javascript
class CommerceFullProductLoader {
  async load(product) {
    try {
      // Create the product
      const createdProduct = await cf.products.create(product);

      // Load variants if any
      if (product.variants && product.variants.length > 1) {
        for (const variant of product.variants) {
          await cf.productVariants.create(createdProduct.id, variant);
        }
      }

      // Load images
      if (product.images) {
        for (const image of product.images) {
          await cf.productImages.create(createdProduct.id, image);
        }
      }

      return createdProduct;
    } catch (error) {
      throw error;
    }
  }

  async loadBatch(products) {
    const results = [];
    for (const product of products) {
      try {
        const result = await this.load(product);
        results.push({ success: true, product: result });
      } catch (error) {
        results.push({ success: false, product, error });
      }
    }
    return results;
  }
}
```

### Phase 3: Customers Migration

#### 3.1 Customer Extraction

```javascript
class ShopifyCustomerExtractor {
  async extractAll() {
    const customers = [];
    let params = { limit: 250 };

    do {
      const response = await shopify.customer.list(params);
      customers.push(...response);
      params = response.nextPageParameters;
    } while (params);

    return customers;
  }

  async extractCustomer(customerId) {
    return await shopify.customer.get(customerId);
  }

  async extractAddresses(customerId) {
    return await shopify.customerAddress.list(customerId);
  }

  async extractOrders(customerId) {
    return await shopify.order.list({ customer_id: customerId });
  }
}
```

#### 3.2 Customer Transformation

```javascript
class ShopifyCustomerTransformer {
  transformCustomer(shopifyCustomer) {
    return {
      customerId: generateUUID(),
      email: shopifyCustomer.email,
      firstName: shopifyCustomer.first_name,
      lastName: shopifyCustomer.last_name,
      phone: shopifyCustomer.phone,
      acceptsMarketing: shopifyCustomer.accepts_marketing,
      marketingOptInLevel: shopifyCustomer.marketing_opt_in_level,
      taxExempt: shopifyCustomer.tax_exempt,
      verifiedEmail: shopifyCustomer.verified_email,
      tags: shopifyCustomer.tags?.split(',').map(tag => tag.trim()),
      note: shopifyCustomer.note,
      addresses: this.transformAddresses(shopifyCustomer.addresses),
      defaultAddress: shopifyCustomer.default_address ? this.transformAddress(shopifyCustomer.default_address) : null,
      metafields: this.transformMetafields(shopifyCustomer.metafields),
      createdAt: new Date(shopifyCustomer.created_at).toISOString(),
      updatedAt: new Date(shopifyCustomer.updated_at).toISOString(),
    };
  }

  transformAddresses(addresses) {
    return addresses?.map(address => this.transformAddress(address)) || [];
  }

  transformAddress(shopifyAddress) {
    return {
      firstName: shopifyAddress.first_name,
      lastName: shopifyAddress.last_name,
      company: shopifyAddress.company,
      address1: shopifyAddress.address1,
      address2: shopifyAddress.address2,
      city: shopifyAddress.city,
      province: shopifyAddress.province,
      provinceCode: shopifyAddress.province_code,
      country: shopifyAddress.country,
      countryCode: shopifyAddress.country_code,
      zip: shopifyAddress.zip,
      phone: shopifyAddress.phone,
      isDefault: shopifyAddress.default || false,
    };
  }

  transformMetafields(metafields) {
    return (
      metafields?.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {}) || {}
    );
  }
}
```

### Phase 4: Orders Migration

#### 4.1 Order Extraction

```javascript
class ShopifyOrderExtractor {
  async extractAll() {
    const orders = [];
    let params = { limit: 250, status: 'any' };

    do {
      const response = await shopify.order.list(params);
      orders.push(...response);
      params = response.nextPageParameters;
    } while (params);

    return orders;
  }

  async extractOrder(orderId) {
    return await shopify.order.get(orderId);
  }

  async extractFulfillments(orderId) {
    return await shopify.fulfillment.list(orderId);
  }

  async extractRefunds(orderId) {
    return await shopify.refund.list(orderId);
  }
}
```

#### 4.2 Order Transformation

```javascript
class ShopifyOrderTransformer {
  transformOrder(shopifyOrder) {
    return {
      orderId: generateUUID(),
      orderNumber: shopifyOrder.name?.replace('#', ''),
      externalId: shopifyOrder.id.toString(),
      status: this.mapOrderStatus(shopifyOrder.fulfillment_status, shopifyOrder.financial_status),
      customerId: this.findCommerceFullCustomerId(shopifyOrder.customer?.id),
      billingAddress: this.transformAddress(shopifyOrder.billing_address),
      shippingAddress: this.transformAddress(shopifyOrder.shipping_address),
      lineItems: this.transformLineItems(shopifyOrder.line_items),
      shippingLines: this.transformShippingLines(shopifyOrder.shipping_lines),
      taxLines: this.transformTaxLines(shopifyOrder.tax_lines),
      discountCodes: this.transformDiscountCodes(shopifyOrder.discount_codes),
      subtotal: parseFloat(shopifyOrder.subtotal_price),
      totalTax: parseFloat(shopifyOrder.total_tax),
      totalShipping: parseFloat(shopifyOrder.total_shipping_price_set?.shop_money?.amount || 0),
      total: parseFloat(shopifyOrder.total_price),
      currency: shopifyOrder.currency,
      paymentMethod: this.mapPaymentMethod(shopifyOrder.payment_gateway_names),
      notes: shopifyOrder.note,
      tags: shopifyOrder.tags?.split(',').map(tag => tag.trim()),
      metafields: this.transformMetafields(shopifyOrder.metafields),
      createdAt: new Date(shopifyOrder.created_at).toISOString(),
      updatedAt: new Date(shopifyOrder.updated_at).toISOString(),
    };
  }

  mapOrderStatus(fulfillmentStatus, financialStatus) {
    if (financialStatus === 'refunded') return 'refunded';
    if (financialStatus === 'voided') return 'cancelled';
    if (fulfillmentStatus === 'fulfilled') return 'completed';
    if (fulfillmentStatus === 'partial') return 'partially_shipped';
    if (fulfillmentStatus === null) return 'pending';
    return 'processing';
  }

  transformLineItems(lineItems) {
    return (
      lineItems?.map(item => ({
        productId: this.findCommerceFullProductId(item.product_id),
        variantId: this.findCommerceFullVariantId(item.variant_id),
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.total_price),
        properties: item.properties,
        fulfillmentStatus: item.fulfillment_status,
      })) || []
    );
  }

  transformShippingLines(shippingLines) {
    return (
      shippingLines?.map(line => ({
        title: line.title,
        price: parseFloat(line.price),
        carrier: line.carrier_identifier,
        method: line.code,
      })) || []
    );
  }

  transformTaxLines(taxLines) {
    return (
      taxLines?.map(line => ({
        title: line.title,
        rate: parseFloat(line.rate),
        price: parseFloat(line.price),
      })) || []
    );
  }

  transformDiscountCodes(discountCodes) {
    return (
      discountCodes?.map(code => ({
        code: code.code,
        amount: parseFloat(code.amount),
        type: code.type,
      })) || []
    );
  }

  mapPaymentMethod(gatewayNames) {
    if (!gatewayNames || gatewayNames.length === 0) return 'unknown';
    return gatewayNames[0];
  }

  transformAddress(shopifyAddress) {
    if (!shopifyAddress) return null;
    return {
      firstName: shopifyAddress.first_name,
      lastName: shopifyAddress.last_name,
      company: shopifyAddress.company,
      address1: shopifyAddress.address1,
      address2: shopifyAddress.address2,
      city: shopifyAddress.city,
      province: shopifyAddress.province,
      country: shopifyAddress.country,
      zip: shopifyAddress.zip,
      phone: shopifyAddress.phone,
    };
  }

  transformMetafields(metafields) {
    return (
      metafields?.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {}) || {}
    );
  }
}
```

## Content Migration

### Blog Posts and Articles

```javascript
class ShopifyContentMigrator {
  async migrateBlogs() {
    const blogs = await shopify.blog.list();

    for (const blog of blogs) {
      const articles = await shopify.article.list(blog.id);

      for (const article of articles) {
        await cf.blogPosts.create({
          title: article.title,
          slug: this.generateSlug(article.handle),
          content: article.body_html,
          excerpt: article.summary,
          author: article.author?.name,
          tags: article.tags,
          published: article.published,
          publishedAt: article.published_at,
          featuredImage: article.image?.src,
          seo: {
            title: article.metafields?.find(mf => mf.key === 'title_tag')?.value,
            description: article.metafields?.find(mf => mf.key === 'description_tag')?.value,
          },
        });
      }
    }
  }

  async migratePages() {
    const pages = await shopify.page.list();

    for (const page of pages) {
      await cf.pages.create({
        title: page.title,
        slug: this.generateSlug(page.handle),
        content: page.body_html,
        published: page.published,
        seo: {
          title: page.metafields?.find(mf => mf.key === 'title_tag')?.value,
          description: page.metafields?.find(mf => mf.key === 'description_tag')?.value,
        },
      });
    }
  }
}
```

## Rate Limiting and Error Handling

```javascript
class ShopifyAPIManager {
  constructor() {
    this.rateLimit = {
      requests: 0,
      resetTime: Date.now() + 60000,
      limit: 40, // Basic plan limit
    };
  }

  async executeWithRetry(operation, maxRetries = 3) {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.checkRateLimit();
        const result = await operation();
        this.recordRequest();
        return result;
      } catch (error) {
        if (error.status === 429) {
          const retryAfter = error.headers['retry-after'] || 60;

          await this.sleep(retryAfter * 1000);
          attempt++;
        } else if (error.status >= 500) {
          // Server error, retry
          await this.sleep(Math.pow(2, attempt) * 1000);
          attempt++;
        } else {
          // Client error, don't retry
          throw error;
        }
      }
    }

    throw new Error(`Operation failed after ${maxRetries} attempts`);
  }

  async checkRateLimit() {
    const now = Date.now();

    if (now > this.rateLimit.resetTime) {
      this.rateLimit.requests = 0;
      this.rateLimit.resetTime = now + 60000;
    }

    if (this.rateLimit.requests >= this.rateLimit.limit) {
      const waitTime = this.rateLimit.resetTime - now;
      await this.sleep(waitTime);
    }
  }

  recordRequest() {
    this.rateLimit.requests++;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Migration Monitoring and Logging

```javascript
class MigrationMonitor {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      entities: new Map(),
      errors: [],
    };
  }

  startEntity(entityType) {
    this.stats.entities.set(entityType, {
      processed: 0,
      errors: 0,
      startTime: Date.now(),
    });
  }

  recordSuccess(entityType) {
    const entityStats = this.stats.entities.get(entityType);
    if (entityStats) {
      entityStats.processed++;
    }
  }

  recordError(entityType, error, data) {
    const entityStats = this.stats.entities.get(entityType);
    if (entityStats) {
      entityStats.errors++;
    }

    this.stats.errors.push({
      entityType,
      error: error.message,
      data,
      timestamp: new Date(),
    });
  }

  getProgress(entityType) {
    const entityStats = this.stats.entities.get(entityType);
    if (!entityStats) return null;

    const elapsed = Date.now() - entityStats.startTime;
    const rate = entityStats.processed / (elapsed / 1000); // items per second

    return {
      processed: entityStats.processed,
      errors: entityStats.errors,
      rate,
      estimatedTimeRemaining: 'TBD', // Would need total count
    };
  }

  generateReport() {
    const totalTime = Date.now() - this.stats.startTime;

    return {
      duration: totalTime,
      entities: Array.from(this.stats.entities.entries()).map(([type, stats]) => ({
        type,
        processed: stats.processed,
        errors: stats.errors,
        successRate: stats.processed / (stats.processed + stats.errors),
      })),
      totalErrors: this.stats.errors.length,
      errorSummary: this.summarizeErrors(),
    };
  }

  summarizeErrors() {
    const errorGroups = {};

    for (const error of this.stats.errors) {
      const key = `${error.entityType}:${error.error}`;
      if (!errorGroups[key]) {
        errorGroups[key] = { count: 0, samples: [] };
      }
      errorGroups[key].count++;
      if (errorGroups[key].samples.length < 3) {
        errorGroups[key].samples.push(error);
      }
    }

    return errorGroups;
  }
}
```

## Complete Migration Script

```javascript
const ShopifyMigrationRunner = require('./shopify-migration-runner');

async function runShopifyMigration() {
  const runner = new ShopifyMigrationRunner({
    shopify: {
      shopName: process.env.SHOPIFY_SHOP_NAME,
      apiKey: process.env.SHOPIFY_API_KEY,
      password: process.env.SHOPIFY_ACCESS_TOKEN,
    },
    commercefull: {
      baseURL: process.env.COMMERCEFULL_URL,
      apiKey: process.env.COMMERCEFULL_API_KEY,
    },
    options: {
      batchSize: 50,
      concurrency: 3,
      continueOnError: true,
    },
  });

  try {
    // Phase 1: Foundation data
    await runner.migrateProductTypes();
    await runner.migrateTaxCategories();

    // Phase 2: Products
    await runner.migrateProducts();

    // Phase 3: Customers
    await runner.migrateCustomers();

    // Phase 4: Orders
    await runner.migrateOrders();

    // Phase 5: Content
    await runner.migrateContent();

    console.log(runner.monitor.generateReport());
  } catch (error) {
    console.log('Partial results:', runner.monitor.generateReport());
  }
}

runShopifyMigration();
```

## Post-Migration Validation

### Data Integrity Checks

```javascript
const validation = {
  async validateProductCounts() {
    const shopifyCount = await shopify.product.count();
    const commercefullCount = await cf.products.count();

    return {
      shopify: shopifyCount,
      commercefull: commercefullCount,
      difference: Math.abs(shopifyCount - commercefullCount),
    };
  },

  async validateCustomerCounts() {
    const shopifyCount = await shopify.customer.count();
    const commercefullCount = await cf.customers.count();

    return {
      shopify: shopifyCount,
      commercefull: commercefullCount,
      difference: Math.abs(shopifyCount - commercefullCount),
    };
  },

  async validateOrderTotals() {
    const shopifyOrders = await shopify.order.list({ limit: 250 });
    const commercefullOrders = await cf.orders.list({ limit: 250 });

    const shopifyTotal = shopifyOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
    const commercefullTotal = commercefullOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      shopifyTotal,
      commercefullTotal,
      difference: Math.abs(shopifyTotal - commercefullTotal),
    };
  },
};
```

## Troubleshooting

### Common Issues

1. **Rate Limiting**
   - Solution: Implement exponential backoff and respect API limits

2. **Large Product Catalogs**
   - Solution: Use batching and pagination, consider delta migrations

3. **Complex Product Variants**
   - Solution: Pre-analyze variant structures and handle edge cases

4. **Historical Data Limitations**
   - Solution: Archive old Shopify data separately if needed beyond API limits

5. **Metafield Complexity**
   - Solution: Create mapping rules for custom metafields

### Performance Optimization

- Use bulk operations where possible
- Implement parallel processing for independent entities
- Cache frequently accessed reference data
- Monitor memory usage for large datasets

This guide provides a comprehensive framework for migrating from Shopify to CommerceFull. Adjust the scripts based on your specific Shopify store configuration and CommerceFull setup requirements.
