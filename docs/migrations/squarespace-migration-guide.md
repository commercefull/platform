# Squarespace E-commerce Migration Guide

## Overview

This guide provides detailed instructions for migrating from Squarespace E-commerce to CommerceFull, addressing the platform's limited API access and manual export requirements.

## Prerequisites

- Squarespace admin access
- CommerceFull API credentials
- Access to Squarespace commerce panel
- CSV import/export tools
- Manual data extraction capabilities

## Squarespace Data Architecture

### API Limitations
- Very limited REST API access
- No bulk data export APIs
- No programmatic product/order access
- Manual CSV exports only
- Commerce API in beta with limited functionality

### Key Challenges
- No automated API access for core commerce data
- Manual data extraction required
- Limited historical data access
- Complex product configuration export
- Media asset migration complexity

## Preparation Phase

### 1. Data Export from Squarespace

#### Manual CSV Exports

Squarespace provides CSV export functionality for key data:

**Products Export:**
1. Go to Commerce → Inventory
2. Click "Export" → "Products"
3. Download the CSV file

**Orders Export:**
1. Go to Commerce → Orders
2. Use filters to select date ranges
3. Click "Export" → "Orders"
4. Download the CSV file

**Customers Export:**
1. Go to Commerce → Customers
2. Click "Export" → "Customers"
3. Download the CSV file

#### Content Export

**Pages and Content:**
- Manual copy/paste approach for static content
- Use browser developer tools to extract HTML
- Screenshot-based content preservation

**Media Assets:**
- Download images manually from Squarespace media library
- Use browser network tab to identify asset URLs
- Bulk download tools for media assets

### 2. Data Assessment

```javascript
const assessSquarespaceData = (csvFiles) => {
  const assessment = {
    products: {
      count: csvFiles.products ? csvFiles.products.length : 0,
      categories: new Set(),
      variants: 0,
      mediaFiles: 0
    },
    orders: {
      count: csvFiles.orders ? csvFiles.orders.length : 0,
      dateRange: {},
      totalValue: 0
    },
    customers: {
      count: csvFiles.customers ? csvFiles.customers.length : 0,
      withAddresses: 0
    }
  };

  // Analyze products
  if (csvFiles.products) {
    for (const product of csvFiles.products) {
      if (product.category) {
        assessment.products.categories.add(product.category);
      }
      if (product.variantCount) {
        assessment.products.variants += parseInt(product.variantCount);
      }
      if (product.images) {
        assessment.products.mediaFiles += product.images.split(',').length;
      }
    }
  }

  // Analyze orders
  if (csvFiles.orders) {
    const dates = csvFiles.orders.map(order => new Date(order.created_date));
    assessment.orders.dateRange = {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates))
    };
    assessment.orders.totalValue = csvFiles.orders.reduce(
      (sum, order) => sum + parseFloat(order.total_price || 0), 0
    );
  }

  // Analyze customers
  if (csvFiles.customers) {
    assessment.customers.withAddresses = csvFiles.customers.filter(
      customer => customer.shipping_address_1 || customer.billing_address_1
    ).length;
  }

  return assessment;
};
```

## Migration Execution

### Phase 1: Foundation Data Setup

#### 1.1 Categories from Product CSV

```javascript
class SquarespaceCategoryMigrator {
  async migrateCategoriesFromCSV(productsCSV, cf) {
    // Extract unique categories from products
    const categories = new Set();

    for (const product of productsCSV) {
      if (product.category) {
        categories.add(product.category);
      }
      if (product.secondary_category) {
        categories.add(product.secondary_category);
      }
    }

    const categoryMap = new Map();

    for (const categoryName of categories) {
      if (!categoryName) continue;

      const category = await cf.categories.create({
        name: categoryName,
        slug: this.generateSlug(categoryName),
        description: '',
        isActive: true
      });

      categoryMap.set(categoryName, category.id);
    }

    return categoryMap;
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
```

#### 1.2 Product Attributes Setup

```javascript
class SquarespaceAttributeSetup {
  async setupBasicAttributes(cf) {
    // Create standard e-commerce attributes
    const attributes = [
      {
        name: 'Size',
        code: 'size',
        type: 'select',
        group: 'Physical'
      },
      {
        name: 'Color',
        code: 'color',
        type: 'select',
        group: 'Visual'
      },
      {
        name: 'Material',
        code: 'material',
        type: 'text',
        group: 'Technical'
      },
      {
        name: 'Brand',
        code: 'brand',
        type: 'text',
        group: 'General'
      }
    ];

    // Create attribute groups first
    const groups = {};
    for (const attr of attributes) {
      if (!groups[attr.group]) {
        const group = await cf.productAttributeGroups.create({
          name: attr.group,
          code: attr.group.toLowerCase(),
          description: `${attr.group} product attributes`,
          position: 1,
          isComparable: true,
          isGlobal: true
        });
        groups[attr.group] = group.id;
      }
    }

    // Create attributes
    for (const attr of attributes) {
      await cf.productAttributes.create({
        groupId: groups[attr.group],
        name: attr.name,
        code: attr.code,
        description: attr.name,
        type: attr.type,
        inputType: attr.type,
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
        position: 1
      });
    }
  }
}
```

### Phase 2: Products Migration

#### 2.1 CSV Product Processing

```javascript
const csv = require('csv-parser');
const fs = require('fs');

class SquarespaceProductMigrator {
  async migrateProductsFromCSV(csvPath, categoryMap, cf) {
    const products = [];
    const variants = new Map();

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Process each product row
          const productData = this.parseProductRow(row);
          products.push(productData);

          // Handle variants if present
          if (row.variant_sku) {
            if (!variants.has(row.product_id)) {
              variants.set(row.product_id, []);
            }
            variants.get(row.product_id).push(this.parseVariantRow(row));
          }
        })
        .on('end', async () => {
          try {
            // Process products in batches
            await this.processProducts(products, variants, categoryMap, cf);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  parseProductRow(row) {
    return {
      externalId: row.product_id,
      name: row.product_name,
      description: row.description,
      shortDescription: row.short_description || row.description?.substring(0, 200),
      sku: row.sku,
      price: parseFloat(row.price || 0),
      salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
      cost: row.cost ? parseFloat(row.cost) : null,
      weight: parseFloat(row.weight || 0),
      stockQuantity: parseInt(row.stock_quantity || 0),
      stockStatus: this.mapStockStatus(row),
      isVisible: row.visible === 'true' || row.visible === '1',
      categories: row.category ? [row.category] : [],
      tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
      images: row.images ? row.images.split(',').map(url => url.trim()) : [],
      attributes: this.parseProductAttributes(row),
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      createdAt: row.created_date ? new Date(row.created_date) : new Date(),
      updatedAt: row.updated_date ? new Date(row.updated_date) : new Date()
    };
  }

  parseVariantRow(row) {
    return {
      sku: row.variant_sku,
      price: parseFloat(row.variant_price || row.price || 0),
      salePrice: row.variant_sale_price ? parseFloat(row.variant_sale_price) : null,
      stockQuantity: parseInt(row.variant_stock_quantity || 0),
      attributes: this.parseVariantAttributes(row),
      isActive: row.variant_visible !== 'false'
    };
  }

  mapStockStatus(row) {
    if (row.unlimited_stock === 'true' || row.unlimited_stock === '1') return 'instock';
    if (parseInt(row.stock_quantity || 0) > 0) return 'instock';
    return 'outofstock';
  }

  parseProductAttributes(row) {
    const attributes = [];

    if (row.brand) {
      attributes.push({ code: 'brand', value: row.brand });
    }
    if (row.material) {
      attributes.push({ code: 'material', value: row.material });
    }

    return attributes;
  }

  parseVariantAttributes(row) {
    const attributes = [];

    if (row.variant_size) {
      attributes.push({ code: 'size', value: row.variant_size });
    }
    if (row.variant_color) {
      attributes.push({ code: 'color', value: row.variant_color });
    }

    return attributes;
  }

  async processProducts(products, variants, categoryMap, cf) {
    for (const product of products) {
      try {
        // Create the product
        const cfProduct = await cf.products.create({
          productId: generateUUID(),
          name: product.name,
          slug: this.generateSlug(product.name),
          description: product.description,
          shortDescription: product.shortDescription,
          sku: product.sku,
          type: variants.has(product.externalId) ? 'configurable' : 'simple',
          status: product.isVisible ? 'published' : 'draft',
          visibility: 'public',
          price: product.price,
          salePrice: product.salePrice,
          cost: product.cost,
          weight: product.weight,
          stockQuantity: product.stockQuantity,
          stockStatus: product.stockStatus,
          backorders: 'no',
          manageStock: true,
          categories: product.categories.map(cat => categoryMap.get(cat)).filter(Boolean),
          tags: product.tags,
          attributes: product.attributes,
          images: product.images.map((url, index) => ({
            url: url,
            alt: product.name,
            position: index,
            isMain: index === 0
          })),
          seo: {
            title: product.seoTitle,
            description: product.seoDescription
          },
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString()
        });

        // Add variants if any
        if (variants.has(product.externalId)) {
          const productVariants = variants.get(product.externalId);
          for (const variant of productVariants) {
            await cf.productVariants.create(cfProduct.id, {
              variantId: generateUUID(),
              sku: variant.sku,
              price: variant.price,
              salePrice: variant.salePrice,
              stockQuantity: variant.stockQuantity,
              attributes: variant.attributes,
              isActive: variant.isActive
            });
          }
        }

        

      } catch (error) {
        
      }
    }
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

#### 3.1 CSV Customer Processing

```javascript
class SquarespaceCustomerMigrator {
  async migrateCustomersFromCSV(csvPath, cf) {
    const customers = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          customers.push(this.parseCustomerRow(row));
        })
        .on('end', async () => {
          try {
            await this.processCustomers(customers, cf);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  parseCustomerRow(row) {
    return {
      externalId: row.customer_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      billingAddress: {
        firstName: row.first_name,
        lastName: row.last_name,
        company: row.billing_company,
        address1: row.billing_address_1,
        address2: row.billing_address_2,
        city: row.billing_city,
        state: row.billing_state,
        postcode: row.billing_zip,
        country: row.billing_country
      },
      shippingAddress: {
        firstName: row.first_name,
        lastName: row.last_name,
        company: row.shipping_company,
        address1: row.shipping_address_1,
        address2: row.shipping_address_2,
        city: row.shipping_city,
        state: row.shipping_state,
        postcode: row.shipping_zip,
        country: row.shipping_country
      },
      acceptsMarketing: row.accepts_marketing === 'true' || row.accepts_marketing === '1',
      isActive: row.is_active !== 'false',
      createdAt: row.created_date ? new Date(row.created_date) : new Date(),
      updatedAt: row.updated_date ? new Date(row.updated_date) : new Date()
    };
  }

  async processCustomers(customers, cf) {
    for (const customer of customers) {
      try {
        await cf.customers.create({
          customerId: generateUUID(),
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          billingAddress: customer.billingAddress.address1 ? customer.billingAddress : null,
          shippingAddress: customer.shippingAddress.address1 ? customer.shippingAddress : null,
          isActive: customer.isActive,
          acceptsMarketing: customer.acceptsMarketing,
          createdAt: customer.createdAt.toISOString(),
          updatedAt: customer.updatedAt.toISOString()
        });

        

      } catch (error) {
        
      }
    }
  }
}
```

### Phase 4: Orders Migration

#### 4.1 CSV Order Processing

```javascript
class SquarespaceOrderMigrator {
  async migrateOrdersFromCSV(csvPath, customerMap, productMap, cf) {
    const orders = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          orders.push(this.parseOrderRow(row));
        })
        .on('end', async () => {
          try {
            await this.processOrders(orders, customerMap, productMap, cf);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  parseOrderRow(row) {
    return {
      externalId: row.order_id,
      orderNumber: row.order_number,
      customerEmail: row.customer_email,
      status: row.fulfillment_status,
      paymentStatus: row.payment_status,
      subtotal: parseFloat(row.subtotal_price || 0),
      shippingTotal: parseFloat(row.shipping_price || 0),
      taxTotal: parseFloat(row.tax_price || 0),
      discountTotal: parseFloat(row.discount_price || 0),
      total: parseFloat(row.total_price || 0),
      currency: row.currency || 'USD',
      paymentMethod: row.payment_method,
      shippingMethod: row.shipping_method,
      customerNote: row.customer_note,
      billingAddress: {
        firstName: row.billing_first_name,
        lastName: row.billing_last_name,
        company: row.billing_company,
        address1: row.billing_address_1,
        address2: row.billing_address_2,
        city: row.billing_city,
        state: row.billing_state,
        postcode: row.billing_zip,
        country: row.billing_country
      },
      shippingAddress: {
        firstName: row.shipping_first_name,
        lastName: row.shipping_last_name,
        company: row.shipping_company,
        address1: row.shipping_address_1,
        address2: row.shipping_address_2,
        city: row.shipping_city,
        state: row.shipping_state,
        postcode: row.shipping_zip,
        country: row.shipping_country
      },
      lineItems: this.parseLineItems(row),
      createdAt: row.created_date ? new Date(row.created_date) : new Date(),
      updatedAt: row.updated_date ? new Date(row.updated_date) : new Date()
    };
  }

  parseLineItems(row) {
    // Squarespace CSV may have line items in separate columns or JSON
    const items = [];

    // Check for item columns (item_1_sku, item_1_name, etc.)
    let itemIndex = 1;
    while (row[`item_${itemIndex}_sku`]) {
      items.push({
        sku: row[`item_${itemIndex}_sku`],
        name: row[`item_${itemIndex}_name`],
        quantity: parseInt(row[`item_${itemIndex}_quantity`] || 1),
        price: parseFloat(row[`item_${itemIndex}_price`] || 0),
        total: parseFloat(row[`item_${itemIndex}_total`] || 0)
      });
      itemIndex++;
    }

    return items;
  }

  async processOrders(orders, customerMap, productMap, cf) {
    for (const order of orders) {
      try {
        // Find customer ID
        let customerId = null;
        if (order.customerEmail) {
          // This would require a pre-built customer email to ID map
          customerId = customerMap.get(order.customerEmail);
        }

        const cfOrder = await cf.orders.create({
          orderId: generateUUID(),
          orderNumber: order.orderNumber,
          externalId: order.externalId,
          status: this.mapOrderStatus(order.status, order.paymentStatus),
          customerId: customerId,
          billingAddress: order.billingAddress,
          shippingAddress: order.shippingAddress,
          lineItems: order.lineItems.map(item => ({
            productId: productMap.get(item.sku) || null,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          })),
          shippingTotal: order.shippingTotal,
          taxTotal: order.taxTotal,
          discountTotal: order.discountTotal,
          total: order.total,
          currency: order.currency,
          paymentMethod: order.paymentMethod,
          customerNote: order.customerNote,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString()
        });

        

      } catch (error) {
        
      }
    }
  }

  mapOrderStatus(fulfillmentStatus, paymentStatus) {
    if (paymentStatus === 'refunded') return 'refunded';
    if (paymentStatus === 'failed') return 'cancelled';
    if (fulfillmentStatus === 'fulfilled') return 'completed';
    if (fulfillmentStatus === 'in_progress') return 'processing';
    return 'pending';
  }
}
```

## Complete Migration Script

```javascript
const SquarespaceMigrationRunner = require('./squarespace-migration-runner');
const fs = require('fs');

async function runSquarespaceMigration() {
  // Prepare CSV file paths
  const csvFiles = {
    products: './exports/products.csv',
    customers: './exports/customers.csv',
    orders: './exports/orders.csv'
  };

  // Check if files exist
  for (const [type, path] of Object.entries(csvFiles)) {
    if (!fs.existsSync(path)) {
      
      
      return;
    }
  }

  const runner = new SquarespaceMigrationRunner({
    commercefull: {
      baseURL: process.env.COMMERCEFULL_URL,
      apiKey: process.env.COMMERCEFULL_API_KEY
    },
    csvFiles: csvFiles,
    options: {
      batchSize: 100,
      continueOnError: true
    }
  });

  try {
    
    

    // Phase 1: Setup foundation data
    await runner.setupAttributes();

    // Phase 2: Migrate categories from products
    const categoryMap = await runner.migrateCategories();

    // Phase 3: Migrate products
    const productMap = await runner.migrateProducts(categoryMap);

    // Phase 4: Migrate customers
    const customerMap = await runner.migrateCustomers();

    // Phase 5: Migrate orders
    await runner.migrateOrders(customerMap, productMap);

    
    

  } catch (error) {
    
  }
}

runSquarespaceMigration();
```

## Media Asset Migration

### Manual Media Download Strategy

```javascript
class SquarespaceMediaMigrator {
  constructor(mediaUrls, outputDir = './media') {
    this.mediaUrls = mediaUrls;
    this.outputDir = outputDir;
    this.downloaded = new Set();
  }

  async downloadAllMedia() {
    const https = require('https');
    const fs = require('fs').promises;
    const path = require('path');

    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    for (const url of this.mediaUrls) {
      try {
        await this.downloadMedia(url, this.outputDir);
        this.downloaded.add(url);
      } catch (error) {
        
      }
    }

    return Array.from(this.downloaded);
  }

  async downloadMedia(url, outputDir) {
    const https = require('https');
    const fs = require('fs');
    const path = require('path');

    return new Promise((resolve, reject) => {
      const filename = path.basename(new URL(url).pathname);
      const filepath = path.join(outputDir, filename);

      const file = fs.createWriteStream(filepath);

      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve(filepath);
        });
      }).on('error', (error) => {
        fs.unlink(filepath, () => {}); // Delete partial file
        reject(error);
      });
    });
  }

  // After download, upload to CommerceFull
  async uploadToCommerceFull(cf, localFiles) {
    for (const localFile of localFiles) {
      try {
        const media = await cf.media.upload(localFile);
        
      } catch (error) {
        
      }
    }
  }
}
```

## Content Migration

### Manual Content Extraction

Since Squarespace has limited API access for content, manual extraction is required:

```javascript
class SquarespaceContentMigrator {
  // Manual process - extract content from browser

  async migratePages(manualContent, cf) {
    for (const page of manualContent.pages) {
      await cf.pages.create({
        title: page.title,
        slug: this.generateSlug(page.title),
        content: page.content,
        published: page.published,
        seo: {
          title: page.seoTitle,
          description: page.seoDescription
        }
      });
    }
  }

  async migrateBlogPosts(manualContent, cf) {
    for (const post of manualContent.blogPosts) {
      await cf.blogPosts.create({
        title: post.title,
        slug: this.generateSlug(post.title),
        content: post.content,
        excerpt: post.excerpt,
        published: post.published,
        publishedAt: post.publishDate,
        tags: post.tags,
        seo: {
          title: post.seoTitle,
          description: post.seoDescription
        }
      });
    }
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
```

## Post-Migration Validation

### CSV-Based Validation

```javascript
const SquarespaceValidation = {
  async validateProductCounts(csvData, cfApi) {
    const csvCount = csvData.products ? csvData.products.length : 0;
    const cfCount = await cfApi.products.count();

    return {
      squarespace: csvCount,
      commercefull: cfCount,
      difference: Math.abs(csvCount - cfCount)
    };
  },

  async validateOrderTotals(csvData, cfApi) {
    const csvTotal = csvData.orders ?
      csvData.orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) : 0;

    const cfOrders = await cfApi.orders.list({ limit: 1000 });
    const cfTotal = cfOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      squarespace: csvTotal,
      commercefull: cfTotal,
      difference: Math.abs(csvTotal - cfTotal)
    };
  },

  async validateDataIntegrity(csvData, cfApi) {
    // Spot check sample records
    const sampleProducts = csvData.products?.slice(0, 5) || [];
    const cfProducts = await cfApi.products.list({ limit: 5 });

    const integrityChecks = sampleProducts.map((csvProduct, index) => {
      const cfProduct = cfProducts[index];
      if (!cfProduct) return { product: csvProduct.product_name, status: 'missing' };

      return {
        product: csvProduct.product_name,
        priceMatch: parseFloat(csvProduct.price) === cfProduct.price,
        skuMatch: csvProduct.sku === cfProduct.sku,
        nameMatch: csvProduct.product_name === cfProduct.name
      };
    });

    return integrityChecks;
  }
};
```

## Limitations and Workarounds

### API Limitations Workarounds

1. **No Programmatic Access**: Use CSV exports and manual processes
2. **Limited Historical Data**: Export data in date ranges, combine manually
3. **No Real-time Sync**: Implement manual sync processes post-migration
4. **Complex Product Options**: Pre-process CSV data to handle variants

### Manual Processes Required

1. **Content Extraction**: Copy/paste from Squarespace editor
2. **Media Downloads**: Manual download from media library
3. **SEO Settings**: Extract meta tags manually
4. **Custom Code**: Identify and migrate custom functionality

### Performance Considerations

1. **Large CSV Files**: Process in chunks to avoid memory issues
2. **Rate Limiting**: Not applicable due to CSV approach
3. **Error Recovery**: Implement checkpoint system for resumable migration
4. **Validation**: Comprehensive post-migration checks due to manual processes

This guide addresses Squarespace's API limitations by focusing on CSV-based migration approaches, manual content extraction, and comprehensive validation strategies for successful migration to CommerceFull.
