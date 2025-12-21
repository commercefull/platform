# WooCommerce to CommerceFull Migration Guide

## Overview

This guide provides comprehensive instructions for migrating from WooCommerce to CommerceFull, focusing on the complexities of WordPress-based e-commerce data structures.

## Prerequisites

- WordPress database access (MySQL/MariaDB)
- WooCommerce database tables access
- CommerceFull API credentials
- PHP environment for data extraction scripts
- Node.js environment for transformation and loading

## WooCommerce Data Architecture

### Core Tables
- `wp_posts` - Products, pages, posts
- `wp_postmeta` - Product metadata and custom fields
- `wp_users` - Customer accounts
- `wp_usermeta` - Customer metadata
- `wp_woocommerce_order_items` - Order line items
- `wp_woocommerce_order_itemmeta` - Order item metadata

### Key Challenges
- Meta field storage (key-value pairs)
- Product variation relationships
- Custom field proliferation
- Mixed data types in meta storage

## Preparation Phase

### 1. Database Connection Setup

```php
<?php
class WooCommerceDatabase {
    private $pdo;

    public function __construct($config) {
        $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4";
        $this->pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    }

    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
}
```

```javascript
const mysql = require('mysql2/promise');

class WooCommerceExtractor {
  constructor(config) {
    this.pool = mysql.createPool({
      host: config.host,
      user: config.username,
      password: config.password,
      database: config.database,
      charset: 'utf8mb4'
    });
  }

  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }
}
```

### 2. Data Assessment

```javascript
const assessWooCommerceData = async (db) => {
  const assessment = {
    products: await db.query('SELECT COUNT(*) as count FROM wp_posts WHERE post_type = "product"'),
    variations: await db.query('SELECT COUNT(*) as count FROM wp_posts WHERE post_type = "product_variation"'),
    categories: await db.query('SELECT COUNT(*) as count FROM wp_terms t JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id WHERE tt.taxonomy = "product_cat"'),
    customers: await db.query('SELECT COUNT(*) as count FROM wp_users'),
    orders: await db.query('SELECT COUNT(*) as count FROM wp_posts WHERE post_type = "shop_order"'),
    attributes: await db.query('SELECT COUNT(*) as count FROM wp_terms t JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id WHERE tt.taxonomy LIKE "pa_%"')
  };

  return assessment;
};
```

## Migration Execution

### Phase 1: Foundation Data

#### 1.1 Product Attributes Migration

```javascript
class WooCommerceAttributeMigrator {
  async migrateAttributes(db, cf) {
    // Extract WooCommerce product attributes
    const attributes = await db.query(`
      SELECT t.term_id, t.name, t.slug, tt.description
      FROM wp_terms t
      JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
      WHERE tt.taxonomy LIKE 'pa_%'
    `);

    for (const attr of attributes) {
      // Create attribute group first
      const group = await cf.productAttributeGroups.create({
        name: this.formatAttributeName(attr.slug),
        code: attr.slug,
        description: attr.description || '',
        position: 1,
        isComparable: true,
        isGlobal: true
      });

      // Get attribute values/terms
      const terms = await db.query(`
        SELECT name, slug, description
        FROM wp_terms
        WHERE term_id IN (
          SELECT term_id FROM wp_term_taxonomy
          WHERE parent = ? AND taxonomy = ?
        )
      `, [attr.term_id, `pa_${attr.slug}`]);

      // Create the attribute
      await cf.productAttributes.create({
        groupId: group.id,
        name: attr.name,
        code: attr.slug,
        description: attr.description,
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
        position: 1,
        options: terms.map(term => ({
          label: term.name,
          value: term.slug
        }))
      });
    }
  }

  formatAttributeName(slug) {
    return slug.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}
```

#### 1.2 Categories Migration

```javascript
class WooCommerceCategoryMigrator {
  async migrateCategories(db, cf) {
    // Get all product categories with hierarchy
    const categories = await db.query(`
      SELECT t.term_id, t.name, t.slug, tt.parent, tt.description
      FROM wp_terms t
      JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
      WHERE tt.taxonomy = 'product_cat'
      ORDER BY tt.parent, t.term_id
    `);

    const categoryMap = new Map();

    for (const cat of categories) {
      const category = await cf.categories.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentId: cat.parent ? categoryMap.get(cat.parent) : null,
        isActive: true
      });

      categoryMap.set(cat.term_id, category.id);
    }

    return categoryMap;
  }
}
```

### Phase 2: Products Migration

#### 2.1 Product Data Extraction

```javascript
class WooCommerceProductExtractor {
  async extractProducts(db) {
    const products = await db.query(`
      SELECT p.ID, p.post_title, p.post_content, p.post_excerpt,
             p.post_status, p.post_date, p.post_modified
      FROM wp_posts p
      WHERE p.post_type = 'product'
      AND p.post_status IN ('publish', 'draft', 'private')
    `);

    const enrichedProducts = [];

    for (const product of products) {
      const meta = await this.extractProductMeta(db, product.ID);
      const categories = await this.extractProductCategories(db, product.ID);
      const attributes = await this.extractProductAttributes(db, product.ID);
      const images = await this.extractProductImages(db, product.ID);

      enrichedProducts.push({
        ...product,
        meta,
        categories,
        attributes,
        images
      });
    }

    return enrichedProducts;
  }

  async extractProductMeta(db, productId) {
    const meta = await db.query(`
      SELECT meta_key, meta_value
      FROM wp_postmeta
      WHERE post_id = ?
    `, [productId]);

    return meta.reduce((acc, item) => {
      acc[item.meta_key] = item.meta_value;
      return acc;
    }, {});
  }

  async extractProductCategories(db, productId) {
    return await db.query(`
      SELECT t.term_id, t.name, t.slug
      FROM wp_terms t
      JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
      JOIN wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
      WHERE tr.object_id = ? AND tt.taxonomy = 'product_cat'
    `, [productId]);
  }

  async extractProductAttributes(db, productId) {
    return await db.query(`
      SELECT tm.name, tm.slug, pm.meta_value
      FROM wp_postmeta pm
      JOIN wp_terms tm ON pm.meta_value = tm.slug
      WHERE pm.post_id = ?
      AND pm.meta_key LIKE 'attribute_pa_%'
    `, [productId]);
  }

  async extractProductImages(db, productId) {
    const gallery = await db.query(`
      SELECT meta_value
      FROM wp_postmeta
      WHERE post_id = ? AND meta_key = '_product_image_gallery'
    `, [productId]);

    const featured = await db.query(`
      SELECT meta_value
      FROM wp_postmeta
      WHERE post_id = ? AND meta_key = '_thumbnail_id'
    `, [productId]);

    const images = [];

    // Featured image
    if (featured.length > 0) {
      const imageData = await this.getImageData(db, featured[0].meta_value);
      if (imageData) images.push({ ...imageData, isFeatured: true });
    }

    // Gallery images
    if (gallery.length > 0 && gallery[0].meta_value) {
      const galleryIds = gallery[0].meta_value.split(',');
      for (const imageId of galleryIds) {
        const imageData = await this.getImageData(db, imageId);
        if (imageData) images.push(imageData);
      }
    }

    return images;
  }

  async getImageData(db, attachmentId) {
    const image = await db.query(`
      SELECT p.guid, pm.meta_value as alt
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt'
      WHERE p.ID = ?
    `, [attachmentId]);

    return image.length > 0 ? {
      url: image[0].guid,
      alt: image[0].alt || ''
    } : null;
  }
}
```

#### 2.2 Product Transformation

```javascript
class WooCommerceProductTransformer {
  transformProduct(wooProduct, categoryMap) {
    return {
      productId: generateUUID(),
      name: wooProduct.post_title,
      slug: this.generateSlug(wooProduct.post_title),
      description: wooProduct.post_content,
      shortDescription: wooProduct.post_excerpt,
      sku: wooProduct.meta._sku,
      type: this.mapProductType(wooProduct.meta._product_type || 'simple'),
      status: this.mapStatus(wooProduct.post_status),
      visibility: this.mapVisibility(wooProduct.meta._visibility),
      price: parseFloat(wooProduct.meta._price || 0),
      regularPrice: parseFloat(wooProduct.meta._regular_price || 0),
      salePrice: parseFloat(wooProduct.meta._sale_price || 0),
      cost: parseFloat(wooProduct.meta._cost || 0),
      weight: parseFloat(wooProduct.meta._weight || 0),
      length: parseFloat(wooProduct.meta._length || 0),
      width: parseFloat(wooProduct.meta._width || 0),
      height: parseFloat(wooProduct.meta._height || 0),
      stockQuantity: parseInt(wooProduct.meta._stock || 0),
      stockStatus: wooProduct.meta._stock_status || 'instock',
      backorders: wooProduct.meta._backorders || 'no',
      manageStock: wooProduct.meta._manage_stock === 'yes',
      isVirtual: wooProduct.meta._virtual === 'yes',
      isDownloadable: wooProduct.meta._downloadable === 'yes',
      downloadLimit: parseInt(wooProduct.meta._download_limit || -1),
      downloadExpiry: parseInt(wooProduct.meta._download_expiry || -1),
      taxStatus: wooProduct.meta._tax_status || 'taxable',
      taxClass: wooProduct.meta._tax_class || '',
      categories: wooProduct.categories.map(cat => categoryMap.get(cat.term_id)).filter(Boolean),
      tags: this.extractTags(wooProduct.meta),
      attributes: this.transformAttributes(wooProduct.attributes),
      images: wooProduct.images,
      seo: {
        title: wooProduct.meta._yoast_wpseo_title,
        description: wooProduct.meta._yoast_wpseo_metadesc,
        focusKeyword: wooProduct.meta._yoast_wpseo_focuskw
      },
      createdAt: wooProduct.post_date,
      updatedAt: wooProduct.post_modified
    };
  }

  mapProductType(wooType) {
    const typeMapping = {
      'simple': 'simple',
      'variable': 'configurable',
      'grouped': 'grouped',
      'external': 'external'
    };
    return typeMapping[wooType] || 'simple';
  }

  mapStatus(wooStatus) {
    const statusMapping = {
      'publish': 'published',
      'draft': 'draft',
      'private': 'private'
    };
    return statusMapping[wooStatus] || 'draft';
  }

  mapVisibility(wooVisibility) {
    const visibilityMapping = {
      'visible': 'public',
      'catalog': 'catalog',
      'search': 'search',
      'hidden': 'hidden'
    };
    return visibilityMapping[wooVisibility] || 'public';
  }

  extractTags(meta) {
    // Extract WooCommerce tags from meta or other sources
    return []; // Implementation depends on how tags are stored
  }

  transformAttributes(attributes) {
    return attributes.map(attr => ({
      name: attr.name,
      value: attr.meta_value,
      isVisible: true,
      isForVariations: false // Would need additional logic to determine
    }));
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
}
```

### Phase 3: Customers Migration

#### 3.1 Customer Data Extraction

```javascript
class WooCommerceCustomerExtractor {
  async extractCustomers(db) {
    const customers = await db.query(`
      SELECT u.ID, u.user_login, u.user_email, u.user_registered,
             u.display_name, u.user_nicename
      FROM wp_users u
      JOIN wp_usermeta um ON u.ID = um.user_id
      WHERE um.meta_key = 'wp_capabilities'
      AND um.meta_value LIKE '%customer%'
    `);

    const enrichedCustomers = [];

    for (const customer of customers) {
      const meta = await this.extractCustomerMeta(db, customer.ID);
      const addresses = await this.extractCustomerAddresses(db, customer.ID);

      enrichedCustomers.push({
        ...customer,
        meta,
        addresses
      });
    }

    return enrichedCustomers;
  }

  async extractCustomerMeta(db, userId) {
    const meta = await db.query(`
      SELECT meta_key, meta_value
      FROM wp_usermeta
      WHERE user_id = ?
    `, [userId]);

    return meta.reduce((acc, item) => {
      acc[item.meta_key] = item.meta_value;
      return acc;
    }, {});
  }

  async extractCustomerAddresses(db, userId) {
    const billing = await db.query(`
      SELECT meta_key, meta_value
      FROM wp_usermeta
      WHERE user_id = ? AND meta_key LIKE 'billing_%'
    `, [userId]);

    const shipping = await db.query(`
      SELECT meta_key, meta_value
      FROM wp_usermeta
      WHERE user_id = ? AND meta_key LIKE 'shipping_%'
    `, [userId]);

    return {
      billing: this.organizeAddress(billing, 'billing'),
      shipping: this.organizeAddress(shipping, 'shipping')
    };
  }

  organizeAddress(meta, prefix) {
    return meta.reduce((acc, item) => {
      const key = item.meta_key.replace(`${prefix}_`, '');
      acc[key] = item.meta_value;
      return acc;
    }, {});
  }
}
```

#### 3.2 Customer Transformation

```javascript
class WooCommerceCustomerTransformer {
  transformCustomer(wooCustomer) {
    return {
      customerId: generateUUID(),
      email: wooCustomer.user_email,
      username: wooCustomer.user_login,
      firstName: wooCustomer.meta.first_name || '',
      lastName: wooCustomer.meta.last_name || '',
      displayName: wooCustomer.display_name,
      phone: wooCustomer.meta.billing_phone || wooCustomer.meta.shipping_phone || '',
      billingAddress: this.transformAddress(wooCustomer.addresses.billing),
      shippingAddress: this.transformAddress(wooCustomer.addresses.shipping),
      isActive: true,
      emailVerified: true, // WooCommerce customers are typically verified
      acceptsMarketing: wooCustomer.meta.marketing_consent === 'yes',
      dateOfBirth: wooCustomer.meta.date_of_birth || null,
      gender: wooCustomer.meta.gender || null,
      company: wooCustomer.meta.billing_company || wooCustomer.meta.shipping_company || '',
      notes: wooCustomer.meta.customer_notes || '',
      tags: this.extractCustomerTags(wooCustomer.meta),
      createdAt: wooCustomer.user_registered,
      updatedAt: wooCustomer.user_registered
    };
  }

  transformAddress(wooAddress) {
    if (!wooAddress || !wooAddress.address_1) return null;

    return {
      firstName: wooAddress.first_name || '',
      lastName: wooAddress.last_name || '',
      company: wooAddress.company || '',
      address1: wooAddress.address_1 || '',
      address2: wooAddress.address_2 || '',
      city: wooAddress.city || '',
      state: wooAddress.state || '',
      postcode: wooAddress.postcode || '',
      country: wooAddress.country || 'US'
    };
  }

  extractCustomerTags(meta) {
    // Extract any customer tags from meta fields
    const tags = [];

    if (meta.customer_type) tags.push(meta.customer_type);
    if (meta.vip_customer === 'yes') tags.push('VIP');

    return tags;
  }
}
```

### Phase 4: Orders Migration

#### 4.1 Order Data Extraction

```javascript
class WooCommerceOrderExtractor {
  async extractOrders(db) {
    const orders = await db.query(`
      SELECT p.ID, p.post_date, p.post_modified, p.post_status,
             pm.meta_value as order_total
      FROM wp_posts p
      JOIN wp_postmeta pm ON p.ID = pm.post_id
      WHERE p.post_type = 'shop_order'
      AND pm.meta_key = '_order_total'
      ORDER BY p.post_date DESC
    `);

    const enrichedOrders = [];

    for (const order of orders) {
      const meta = await this.extractOrderMeta(db, order.ID);
      const items = await this.extractOrderItems(db, order.ID);
      const addresses = await this.extractOrderAddresses(db, order.ID);

      enrichedOrders.push({
        ...order,
        meta,
        items,
        addresses
      });
    }

    return enrichedOrders;
  }

  async extractOrderMeta(db, orderId) {
    const meta = await db.query(`
      SELECT meta_key, meta_value
      FROM wp_postmeta
      WHERE post_id = ?
    `, [orderId]);

    return meta.reduce((acc, item) => {
      acc[item.meta_key] = item.meta_value;
      return acc;
    }, {});
  }

  async extractOrderItems(db, orderId) {
    const items = await db.query(`
      SELECT oi.order_item_id, oi.order_item_name, oi.order_item_type,
             oim.meta_value as product_id
      FROM wp_woocommerce_order_items oi
      LEFT JOIN wp_woocommerce_order_itemmeta oim ON oi.order_item_id = oim.order_item_id
      WHERE oi.order_id = ? AND oim.meta_key = '_product_id'
    `, [orderId]);

    const enrichedItems = [];

    for (const item of items) {
      const itemMeta = await this.extractOrderItemMeta(db, item.order_item_id);
      enrichedItems.push({
        ...item,
        meta: itemMeta
      });
    }

    return enrichedItems;
  }

  async extractOrderItemMeta(db, orderItemId) {
    const meta = await db.query(`
      SELECT meta_key, meta_value
      FROM wp_woocommerce_order_itemmeta
      WHERE order_item_id = ?
    `, [orderItemId]);

    return meta.reduce((acc, item) => {
      acc[item.meta_key] = item.meta_value;
      return acc;
    }, {});
  }

  async extractOrderAddresses(db, orderId) {
    const addressMeta = await db.query(`
      SELECT meta_key, meta_value
      FROM wp_postmeta
      WHERE post_id = ?
      AND (meta_key LIKE '_billing_%' OR meta_key LIKE '_shipping_%')
    `, [orderId]);

    return addressMeta.reduce((acc, item) => {
      const [, type, field] = item.meta_key.split('_');
      if (!acc[type]) acc[type] = {};
      acc[type][field] = item.meta_value;
      return acc;
    }, {});
  }
}
```

#### 4.2 Order Transformation

```javascript
class WooCommerceOrderTransformer {
  transformOrder(wooOrder, customerMap, productMap) {
    const customerId = customerMap.get(parseInt(wooOrder.meta._customer_user));

    return {
      orderId: generateUUID(),
      orderNumber: wooOrder.ID.toString(),
      externalId: wooOrder.ID.toString(),
      status: this.mapOrderStatus(wooOrder.post_status),
      customerId: customerId || null,
      billingAddress: this.transformAddress(wooOrder.addresses.billing),
      shippingAddress: this.transformAddress(wooOrder.addresses.shipping),
      lineItems: this.transformLineItems(wooOrder.items, productMap),
      shippingTotal: parseFloat(wooOrder.meta._order_shipping || 0),
      taxTotal: parseFloat(wooOrder.meta._order_tax || 0),
      discountTotal: parseFloat(wooOrder.meta._cart_discount || 0),
      total: parseFloat(wooOrder.meta._order_total || 0),
      currency: wooOrder.meta._order_currency || 'USD',
      paymentMethod: wooOrder.meta._payment_method || 'unknown',
      paymentMethodTitle: wooOrder.meta._payment_method_title || '',
      transactionId: wooOrder.meta._transaction_id || null,
      customerNote: wooOrder.meta._customer_note || '',
      orderNotes: [], // Would need separate query
      createdAt: wooOrder.post_date,
      updatedAt: wooOrder.post_modified
    };
  }

  mapOrderStatus(wooStatus) {
    const statusMapping = {
      'wc-pending': 'pending',
      'wc-processing': 'processing',
      'wc-on-hold': 'on_hold',
      'wc-completed': 'completed',
      'wc-cancelled': 'cancelled',
      'wc-refunded': 'refunded',
      'wc-failed': 'failed'
    };
    return statusMapping[wooStatus] || 'pending';
  }

  transformAddress(wooAddress) {
    if (!wooAddress || !wooAddress.address_1) return null;

    return {
      firstName: wooAddress.first_name || '',
      lastName: wooAddress.last_name || '',
      company: wooAddress.company || '',
      address1: wooAddress.address_1 || '',
      address2: wooAddress.address_2 || '',
      city: wooAddress.city || '',
      state: wooAddress.state || '',
      postcode: wooAddress.postcode || '',
      country: wooAddress.country || 'US',
      phone: wooAddress.phone || '',
      email: wooAddress.email || ''
    };
  }

  transformLineItems(orderItems, productMap) {
    return orderItems.map(item => {
      const productId = productMap.get(parseInt(item.meta._product_id));

      return {
        productId: productId || null,
        sku: item.meta._sku || '',
        name: item.order_item_name,
        quantity: parseInt(item.meta._qty || 1),
        price: parseFloat(item.meta._line_total || 0) / parseInt(item.meta._qty || 1),
        total: parseFloat(item.meta._line_total || 0),
        taxTotal: parseFloat(item.meta._line_tax || 0),
        variationId: item.meta._variation_id ? parseInt(item.meta._variation_id) : null
      };
    });
  }
}
```

## Complete Migration Script

```javascript
const WooCommerceMigrationRunner = require('./woocommerce-migration-runner');

async function runWooCommerceMigration() {
  const runner = new WooCommerceMigrationRunner({
    woocommerce: {
      host: process.env.WC_DB_HOST,
      database: process.env.WC_DB_NAME,
      username: process.env.WC_DB_USER,
      password: process.env.WC_DB_PASSWORD
    },
    commercefull: {
      baseURL: process.env.COMMERCEFULL_URL,
      apiKey: process.env.COMMERCEFULL_API_KEY
    },
    options: {
      batchSize: 100,
      concurrency: 2,
      continueOnError: true,
      tablePrefix: 'wp_' // WooCommerce table prefix
    }
  });

  try {
    console.log('Starting WooCommerce to CommerceFull migration...');

    // Phase 1: Foundation data
    await runner.migrateAttributes();
    await runner.migrateCategories();
    await runner.migrateTags();

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

runWooCommerceMigration();
```

## Performance Optimization

### Database Query Optimization

```javascript
class OptimizedWooCommerceExtractor {
  // Single query with JOINs instead of multiple queries
  async extractProductsBatch(db, offset, limit) {
    return await db.query(`
      SELECT
        p.ID, p.post_title, p.post_content, p.post_excerpt,
        p.post_status, p.post_date, p.post_modified,
        -- Product meta in single query
        MAX(CASE WHEN pm.meta_key = '_sku' THEN pm.meta_value END) as _sku,
        MAX(CASE WHEN pm.meta_key = '_price' THEN pm.meta_value END) as _price,
        MAX(CASE WHEN pm.meta_key = '_regular_price' THEN pm.meta_value END) as _regular_price,
        MAX(CASE WHEN pm.meta_key = '_sale_price' THEN pm.meta_value END) as _sale_price,
        MAX(CASE WHEN pm.meta_key = '_stock' THEN pm.meta_value END) as _stock,
        MAX(CASE WHEN pm.meta_key = '_manage_stock' THEN pm.meta_value END) as _manage_stock
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
      WHERE p.post_type = 'product'
      AND p.post_status IN ('publish', 'draft', 'private')
      GROUP BY p.ID
      ORDER BY p.ID
      LIMIT ? OFFSET ?
    `, [limit, offset]);
  }

  // Bulk category assignment
  async getProductCategoriesBulk(db, productIds) {
    if (productIds.length === 0) return [];

    const placeholders = productIds.map(() => '?').join(',');
    return await db.query(`
      SELECT tr.object_id as product_id, t.term_id, t.name, t.slug
      FROM wp_term_relationships tr
      JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
      JOIN wp_terms t ON tt.term_id = t.term_id
      WHERE tr.object_id IN (${placeholders})
      AND tt.taxonomy = 'product_cat'
    `, productIds);
  }
}
```

### Memory Management

```javascript
class MemoryEfficientMigrator {
  constructor() {
    this.batchSize = 50;
    this.processedCount = 0;
  }

  async migrateLargeDataset(extractor, transformer, loader) {
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      // Extract batch
      const rawData = await extractor.extractBatch(offset, this.batchSize);

      if (rawData.length === 0) {
        hasMore = false;
        break;
      }

      // Transform batch
      const transformedData = await transformer.transformBatch(rawData);

      // Load batch
      await loader.loadBatch(transformedData);

      // Update progress and cleanup
      this.processedCount += rawData.length;
      offset += this.batchSize;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      console.log(`Processed ${this.processedCount} records...`);
    }
  }
}
```

## Post-Migration Validation

### Data Integrity Checks

```javascript
const WooCommerceValidation = {
  async validateProductCounts(wooDb, cfApi) {
    const wooCount = await wooDb.query('SELECT COUNT(*) as count FROM wp_posts WHERE post_type = "product"');
    const cfCount = await cfApi.products.count();

    return {
      woocommerce: wooCount[0].count,
      commercefull: cfCount,
      difference: Math.abs(wooCount[0].count - cfCount)
    };
  },

  async validateOrderTotals(wooDb, cfApi) {
    const wooTotal = await wooDb.query('SELECT SUM(meta_value) as total FROM wp_postmeta WHERE meta_key = "_order_total"');
    const cfOrders = await cfApi.orders.list({ limit: 1000 });
    const cfTotal = cfOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      woocommerce: parseFloat(wooTotal[0].total),
      commercefull: cfTotal,
      difference: Math.abs(parseFloat(wooTotal[0].total) - cfTotal)
    };
  },

  async validateCustomerAddresses(wooDb, cfApi) {
    // Compare address counts
    const wooAddresses = await wooDb.query(`
      SELECT COUNT(*) as count FROM wp_usermeta
      WHERE meta_key LIKE 'billing_%' AND meta_value != ''
    `);

    const cfCustomers = await cfApi.customers.list({ limit: 1000 });
    const cfAddressCount = cfCustomers.filter(c => c.billingAddress).length;

    return {
      woocommerce: wooAddresses[0].count,
      commercefull: cfAddressCount
    };
  }
};
```

## Troubleshooting Common Issues

### Meta Field Extraction Problems

```javascript
// Handle serialized PHP data
function unserializePhpData(serialized) {
  // Basic unserializer for common cases
  if (serialized.startsWith('a:')) {
    // Handle arrays
    try {
      // Use a PHP unserialization library or manual parsing
      return JSON.parse(serialized.replace(/a:(\d+):{/, '[').replace(/}/g, ']'));
    } catch (e) {
      console.warn('Could not unserialize:', serialized);
      return null;
    }
  }
  return serialized;
}

// Handle missing meta keys gracefully
function safeGetMeta(meta, key, defaultValue = null) {
  return meta[key] !== undefined ? meta[key] : defaultValue;
}
```

### Character Encoding Issues

```javascript
// Handle UTF-8 encoding problems
function fixEncoding(text) {
  if (!text) return text;

  // Convert common encoding issues
  return text
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, '–')
    .replace(/â€"/g, '—');
}
```

### Performance Issues with Large Catalogs

```javascript
// Implement resumable migration
class ResumableMigration {
  constructor(checkpointFile = 'migration_checkpoint.json') {
    this.checkpointFile = checkpointFile;
    this.checkpoint = this.loadCheckpoint();
  }

  saveCheckpoint(entity, lastId) {
    this.checkpoint[entity] = lastId;
    fs.writeFileSync(this.checkpointFile, JSON.stringify(this.checkpoint, null, 2));
  }

  loadCheckpoint() {
    try {
      return JSON.parse(fs.readFileSync(this.checkpointFile, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  getLastProcessedId(entity) {
    return this.checkpoint[entity] || 0;
  }
}
```

This comprehensive guide covers the complexities of migrating from WooCommerce's WordPress-based architecture to CommerceFull, addressing the unique challenges of meta field storage, product variations, and custom field handling.
