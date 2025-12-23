# PrestaShop to CommerceFull Migration Guide

## Overview

This guide provides detailed instructions for migrating from PrestaShop to CommerceFull, addressing the complexities of PrestaShop's database structure and multi-language capabilities.

## Prerequisites

- PrestaShop database access (MySQL/MariaDB)
- PrestaShop filesystem access for media files
- CommerceFull API credentials
- PHP/Node.js environment for migration scripts

## PrestaShop Data Architecture

### Core Tables

- `ps_product` - Main product table
- `ps_product_lang` - Multi-language product data
- `ps_customer` - Customer accounts
- `ps_orders` - Order headers
- `ps_order_detail` - Order line items
- `ps_category` - Product categories
- `ps_attribute` - Product attributes

### Key Challenges

- Multi-language content (product descriptions, categories)
- Complex product combinations (variants)
- Multi-shop configurations
- Custom modules and overrides
- File-based media storage

## Preparation Phase

### 1. Database Connection Setup

```php
<?php
class PrestaShopDatabase {
    private $pdo;

    public function __construct($config) {
        $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset=utf8";
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

    public function getLocalizedValue($table, $field, $id, $idLang = 1) {
        $langTable = $table . '_lang';
        $stmt = $this->pdo->prepare("
            SELECT {$field} FROM {$langTable}
            WHERE id_{$table} = ? AND id_lang = ?
        ");
        $stmt->execute([$id, $idLang]);
        $result = $stmt->fetch();
        return $result ? $result[$field] : null;
    }
}
```

```javascript
const mysql = require('mysql2/promise');

class PrestaShopExtractor {
  constructor(config) {
    this.pool = mysql.createPool({
      host: config.host,
      user: config.username,
      password: config.password,
      database: config.database,
      charset: 'utf8',
      tablePrefix: config.tablePrefix || 'ps_',
    });
    this.tablePrefix = config.tablePrefix || 'ps_';
  }

  async getLocalizedValue(table, field, id, idLang = 1) {
    const langTable = `${this.tablePrefix}${table}_lang`;
    const [rows] = await this.pool.execute(
      `
      SELECT ${field} FROM ${langTable}
      WHERE id_${table} = ? AND id_lang = ?
    `,
      [id, idLang],
    );

    return rows.length > 0 ? rows[0][field] : null;
  }
}
```

### 2. Data Assessment

```javascript
const assessPrestaShopData = async db => {
  const tablePrefix = 'ps_'; // Adjust based on your installation

  const assessment = {
    products: await db.query(`SELECT COUNT(*) as count FROM ${tablePrefix}product WHERE active = 1`),
    combinations: await db.query(`SELECT COUNT(*) as count FROM ${tablePrefix}product_attribute`),
    categories: await db.query(`SELECT COUNT(*) as count FROM ${tablePrefix}category WHERE active = 1`),
    customers: await db.query(`SELECT COUNT(*) as count FROM ${tablePrefix}customer`),
    orders: await db.query(`SELECT COUNT(*) as count FROM ${tablePrefix}orders`),
    languages: await db.query(`SELECT COUNT(*) as count FROM ${tablePrefix}lang WHERE active = 1`),
    shops: await db.query(`SELECT COUNT(*) as count FROM ${tablePrefix}shop`),
  };

  // Get product type breakdown
  const productTypes = await db.query(`
    SELECT
      CASE
        WHEN cache_has_attachments = 1 THEN 'downloadable'
        WHEN is_virtual = 1 THEN 'virtual'
        WHEN EXISTS(SELECT 1 FROM ${tablePrefix}product_attribute pa WHERE pa.id_product = p.id_product) THEN 'configurable'
        ELSE 'simple'
      END as type,
      COUNT(*) as count
    FROM ${tablePrefix}product p
    WHERE active = 1
    GROUP BY
      CASE
        WHEN cache_has_attachments = 1 THEN 'downloadable'
        WHEN is_virtual = 1 THEN 'virtual'
        WHEN EXISTS(SELECT 1 FROM ${tablePrefix}product_attribute pa WHERE pa.id_product = p.id_product) THEN 'configurable'
        ELSE 'simple'
      END
  `);

  assessment.productTypes = productTypes;

  return assessment;
};
```

## Migration Execution

### Phase 1: Foundation Data

#### 1.1 Categories Migration

```javascript
class PrestaShopCategoryMigrator {
  async migrateCategories(db, cf, defaultLangId = 1) {
    const categories = await db.query(
      `
      SELECT c.id_category, c.id_parent, c.active, c.position,
             cl.name, cl.description, cl.meta_title, cl.meta_description
      FROM ps_category c
      LEFT JOIN ps_category_lang cl ON c.id_category = cl.id_category AND cl.id_lang = ?
      WHERE c.active = 1
      ORDER BY c.level_depth, c.id_parent, c.position
    `,
      [defaultLangId],
    );

    const categoryMap = new Map();

    for (const cat of categories) {
      // Skip root category
      if (cat.id_category === 1) continue;

      const category = await cf.categories.create({
        name: cat.name || `Category ${cat.id_category}`,
        slug: this.generateSlug(cat.name || `category-${cat.id_category}`),
        description: cat.description,
        parentId: cat.id_parent > 1 ? categoryMap.get(cat.id_parent) : null,
        isActive: cat.active === 1,
        position: cat.position,
        metaTitle: cat.meta_title,
        metaDescription: cat.meta_description,
      });

      categoryMap.set(cat.id_category, category.id);
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

#### 1.2 Product Attributes Migration

```javascript
class PrestaShopAttributeMigrator {
  async migrateAttributes(db, cf, defaultLangId = 1) {
    // Get attribute groups
    const attributeGroups = await db.query(
      `
      SELECT ag.id_attribute_group, agl.name, agl.public_name, ag.position
      FROM ps_attribute_group ag
      LEFT JOIN ps_attribute_group_lang agl ON ag.id_attribute_group = agl.id_attribute_group AND agl.id_lang = ?
      ORDER BY ag.position
    `,
      [defaultLangId],
    );

    for (const group of attributeGroups) {
      // Create attribute group in CommerceFull
      const cfGroup = await cf.productAttributeGroups.create({
        name: group.public_name || group.name,
        code: group.name.toLowerCase().replace(/\s+/g, '_'),
        description: `PrestaShop attribute group: ${group.name}`,
        position: group.position,
        isComparable: true,
        isGlobal: true,
      });

      // Get attributes in this group
      const attributes = await db.query(
        `
        SELECT a.id_attribute, al.name, a.position
        FROM ps_attribute a
        LEFT JOIN ps_attribute_lang al ON a.id_attribute = al.id_attribute AND al.id_lang = ?
        WHERE a.id_attribute_group = ?
        ORDER BY a.position
      `,
        [defaultLangId, group.id_attribute_group],
      );

      for (const attr of attributes) {
        await cf.productAttributes.create({
          groupId: cfGroup.id,
          name: attr.name,
          code: attr.name.toLowerCase().replace(/\s+/g, '_'),
          description: attr.name,
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
          position: attr.position,
        });
      }
    }
  }
}
```

### Phase 2: Products Migration

#### 2.1 Product Data Extraction

```javascript
class PrestaShopProductExtractor {
  async extractProducts(db, limit = 1000, offset = 0, defaultLangId = 1) {
    const products = await db.query(
      `
      SELECT p.id_product, p.reference, p.price, p.wholesale_price, p.weight,
             p.quantity, p.minimal_quantity, p.active, p.available_for_order,
             p.show_price, p.visibility, p.condition, p.id_tax_rules_group,
             p.width, p.height, p.depth, p.cache_has_attachments, p.is_virtual,
             pl.name, pl.description, pl.description_short, pl.meta_title,
             pl.meta_description, pl.link_rewrite
      FROM ps_product p
      LEFT JOIN ps_product_lang pl ON p.id_product = pl.id_product AND pl.id_lang = ?
      WHERE p.active = 1
      ORDER BY p.id_product
      LIMIT ? OFFSET ?
    `,
      [defaultLangId, limit, offset],
    );

    const enrichedProducts = [];

    for (const product of products) {
      const categories = await this.extractProductCategories(db, product.id_product);
      const combinations = await this.extractProductCombinations(db, product.id_product, defaultLangId);
      const images = await this.extractProductImages(db, product.id_product);
      const features = await this.extractProductFeatures(db, product.id_product, defaultLangId);

      enrichedProducts.push({
        ...product,
        categories,
        combinations,
        images,
        features,
      });
    }

    return enrichedProducts;
  }

  async extractProductCategories(db, productId) {
    return await db.query(
      `
      SELECT c.id_category, cl.name
      FROM ps_category_product cp
      JOIN ps_category c ON cp.id_category = c.id_category
      LEFT JOIN ps_category_lang cl ON c.id_category = cl.id_category AND cl.id_lang = 1
      WHERE cp.id_product = ?
    `,
      [productId],
    );
  }

  async extractProductCombinations(db, productId, defaultLangId) {
    const combinations = await db.query(
      `
      SELECT pa.id_product_attribute, pa.reference, pa.price, pa.weight,
             pa.quantity, pa.minimal_quantity, pa.available_date,
             GROUP_CONCAT(CONCAT(a.id_attribute, ':', al.name) SEPARATOR '|') as attributes
      FROM ps_product_attribute pa
      LEFT JOIN ps_product_attribute_combination pac ON pa.id_product_attribute = pac.id_product_attribute
      LEFT JOIN ps_attribute a ON pac.id_attribute = a.id_attribute
      LEFT JOIN ps_attribute_lang al ON a.id_attribute = al.id_attribute AND al.id_lang = ?
      WHERE pa.id_product = ?
      GROUP BY pa.id_product_attribute
    `,
      [defaultLangId, productId],
    );

    return combinations.map(combo => ({
      ...combo,
      attributes: combo.attributes
        ? combo.attributes.split('|').map(attr => {
            const [id, name] = attr.split(':');
            return { id: parseInt(id), name };
          })
        : [],
    }));
  }

  async extractProductImages(db, productId) {
    return await db.query(
      `
      SELECT pi.id_image, pi.position, pil.legend
      FROM ps_image pi
      LEFT JOIN ps_image_lang pil ON pi.id_image = pil.id_image AND pil.id_lang = 1
      WHERE pi.id_product = ?
      ORDER BY pi.position
    `,
      [productId],
    );
  }

  async extractProductFeatures(db, productId, defaultLangId) {
    return await db.query(
      `
      SELECT fl.name as feature_name, fvl.value as feature_value
      FROM ps_feature_product fp
      JOIN ps_feature_lang fl ON fp.id_feature = fl.id_feature AND fl.id_lang = ?
      JOIN ps_feature_value_lang fvl ON fp.id_feature_value = fvl.id_feature_value AND fvl.id_lang = ?
      WHERE fp.id_product = ?
    `,
      [defaultLangId, defaultLangId, productId],
    );
  }
}
```

#### 2.2 Product Transformation

```javascript
class PrestaShopProductTransformer {
  transformProduct(psProduct, categoryMap) {
    const hasCombinations = psProduct.combinations && psProduct.combinations.length > 0;

    return {
      productId: generateUUID(),
      name: psProduct.name,
      slug: psProduct.link_rewrite || this.generateSlug(psProduct.name),
      description: psProduct.description,
      shortDescription: psProduct.description_short,
      sku: psProduct.reference,
      type: this.mapProductType(psProduct, hasCombinations),
      status: psProduct.active ? 'published' : 'draft',
      visibility: this.mapVisibility(psProduct.visibility),
      price: parseFloat(psProduct.price),
      regularPrice: parseFloat(psProduct.price),
      cost: parseFloat(psProduct.wholesale_price || 0),
      weight: parseFloat(psProduct.weight || 0),
      dimensions: {
        length: parseFloat(psProduct.depth || 0),
        width: parseFloat(psProduct.width || 0),
        height: parseFloat(psProduct.height || 0),
      },
      stockQuantity: parseInt(psProduct.quantity || 0),
      stockStatus: psProduct.quantity > 0 ? 'instock' : 'outofstock',
      backorders: psProduct.available_for_order ? 'yes' : 'no',
      manageStock: true,
      categories: psProduct.categories?.map(cat => categoryMap.get(cat.id_category)).filter(Boolean) || [],
      attributes: this.transformFeatures(psProduct.features),
      images: this.transformImages(psProduct.images),
      variants: hasCombinations ? this.transformCombinations(psProduct.combinations) : [],
      seo: {
        title: psProduct.meta_title,
        description: psProduct.meta_description,
      },
      condition: psProduct.condition,
      isVirtual: psProduct.is_virtual === '1',
      isDownloadable: psProduct.cache_has_attachments === '1',
      createdAt: psProduct.date_add,
      updatedAt: psProduct.date_upd,
    };
  }

  mapProductType(psProduct, hasCombinations) {
    if (psProduct.cache_has_attachments === '1') return 'downloadable';
    if (psProduct.is_virtual === '1') return 'virtual';
    if (hasCombinations) return 'configurable';
    return 'simple';
  }

  mapVisibility(visibility) {
    const visibilityMap = {
      both: 'public',
      catalog: 'catalog',
      search: 'search',
      none: 'hidden',
    };
    return visibilityMap[visibility] || 'public';
  }

  transformFeatures(features) {
    return (
      features?.map(feature => ({
        name: feature.feature_name,
        value: feature.feature_value,
        isVisible: true,
      })) || []
    );
  }

  transformImages(images) {
    return (
      images?.map((image, index) => ({
        url: `/img/p/${image.id_product}/${image.id_image}.jpg`,
        alt: image.legend || '',
        position: image.position,
        isMain: index === 0,
      })) || []
    );
  }

  transformCombinations(combinations) {
    return (
      combinations?.map(combo => ({
        variantId: generateUUID(),
        sku: combo.reference || combo.id_product_attribute.toString(),
        price: parseFloat(combo.price || 0),
        stockQuantity: parseInt(combo.quantity || 0),
        weight: parseFloat(combo.weight || 0),
        attributes: combo.attributes,
        isActive: true,
      })) || []
    );
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
class PrestaShopCustomerExtractor {
  async extractCustomers(db, limit = 1000, offset = 0, defaultLangId = 1) {
    const customers = await db.query(
      `
      SELECT c.id_customer, c.email, c.passwd, c.firstname, c.lastname,
             c.birthday, c.active, c.date_add, c.date_upd, c.id_gender,
             c.company, c.newsletter, c.optin,
             a.address1, a.address2, a.city, a.postcode, a.phone, a.phone_mobile,
             s.name as state, co.iso_code as country
      FROM ps_customer c
      LEFT JOIN ps_address a ON c.id_customer = a.id_customer AND a.active = 1 AND a.deleted = 0
      LEFT JOIN ps_state s ON a.id_state = s.id_state
      LEFT JOIN ps_country co ON a.id_country = co.id_country
      ORDER BY c.id_customer
      LIMIT ? OFFSET ?
    `,
      [limit, offset],
    );

    return customers;
  }

  async extractCustomerOrders(db, customerId) {
    return await db.query(
      `
      SELECT id_order, reference, total_paid, date_add
      FROM ps_orders
      WHERE id_customer = ?
      ORDER BY date_add DESC
    `,
      [customerId],
    );
  }
}
```

#### 3.2 Customer Transformation

```javascript
class PrestaShopCustomerTransformer {
  transformCustomer(psCustomer) {
    return {
      customerId: generateUUID(),
      email: psCustomer.email,
      firstName: psCustomer.firstname,
      lastName: psCustomer.lastname,
      phone: psCustomer.phone || psCustomer.phone_mobile,
      dateOfBirth: psCustomer.birthday && psCustomer.birthday !== '0000-00-00' ? psCustomer.birthday : null,
      gender: this.mapGender(psCustomer.id_gender),
      billingAddress: psCustomer.address1
        ? {
            firstName: psCustomer.firstname,
            lastName: psCustomer.lastname,
            company: psCustomer.company,
            address1: psCustomer.address1,
            address2: psCustomer.address2,
            city: psCustomer.city,
            state: psCustomer.state,
            postcode: psCustomer.postcode,
            country: psCustomer.country || 'US',
          }
        : null,
      shippingAddress: psCustomer.address1
        ? {
            firstName: psCustomer.firstname,
            lastName: psCustomer.lastname,
            company: psCustomer.company,
            address1: psCustomer.address1,
            address2: psCustomer.address2,
            city: psCustomer.city,
            state: psCustomer.state,
            postcode: psCustomer.postcode,
            country: psCustomer.country || 'US',
          }
        : null,
      isActive: psCustomer.active === 1,
      acceptsMarketing: psCustomer.newsletter === 1,
      notes: psCustomer.note || '',
      createdAt: psCustomer.date_add,
      updatedAt: psCustomer.date_upd,
    };
  }

  mapGender(genderId) {
    const genderMap = {
      1: 'Male',
      2: 'Female',
    };
    return genderMap[genderId] || null;
  }
}
```

## Complete Migration Script

```javascript
const PrestaShopMigrationRunner = require('./prestashop-migration-runner');

async function runPrestaShopMigration() {
  const runner = new PrestaShopMigrationRunner({
    prestashop: {
      host: process.env.PS_DB_HOST,
      database: process.env.PS_DB_NAME,
      username: process.env.PS_DB_USER,
      password: process.env.PS_DB_PASSWORD,
      tablePrefix: 'ps_',
    },
    commercefull: {
      baseURL: process.env.COMMERCEFULL_URL,
      apiKey: process.env.COMMERCEFULL_API_KEY,
    },
    options: {
      batchSize: 500,
      concurrency: 3,
      continueOnError: true,
      defaultLanguageId: 1,
    },
  });

  try {
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

    console.log(runner.monitor.generateReport());
  } catch (error) {
    console.log('Partial results:', runner.monitor.generateReport());
  }
}

runPrestaShopMigration();
```

## Handling Multi-Language Content

```javascript
class MultiLanguageHandler {
  constructor(languages) {
    this.languages = languages;
    this.defaultLanguageId = 1;
  }

  async migrateLocalizedContent(contentType, extractor, transformer) {
    const results = {};

    for (const lang of this.languages) {
      const localizedContent = await extractor.extractLocalized(contentType, lang.id_lang);
      const transformedContent = transformer.transformLocalized(localizedContent, lang);

      if (!results[contentType]) results[contentType] = {};
      results[contentType][lang.locale] = transformedContent;
    }

    return results;
  }

  getLocalizedValue(content, field, languageCode) {
    const localized = content[languageCode];
    return localized ? localized[field] : content[this.getDefaultLanguageCode()][field];
  }

  getDefaultLanguageCode() {
    const defaultLang = this.languages.find(lang => lang.id_lang === this.defaultLanguageId);
    return defaultLang ? defaultLang.locale : 'en';
  }
}
```

## Performance Optimization

### Batch Processing for Large Catalogs

```javascript
class BatchProcessor {
  constructor(batchSize = 1000) {
    this.batchSize = batchSize;
  }

  async processLargeDataset(dataset, processor) {
    const total = dataset.length;
    let processed = 0;

    while (processed < total) {
      const batch = dataset.slice(processed, processed + this.batchSize);
      await processor(batch);

      processed += batch.length;

      // Prevent memory issues
      if (global.gc) global.gc();
    }
  }

  async processWithCursor(db, queryBuilder, processor) {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await queryBuilder(offset, this.batchSize);
      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      await processor(batch);
      offset += this.batchSize;
    }
  }
}
```

## Post-Migration Validation

### Data Integrity Checks

```javascript
const PrestaShopValidation = {
  async validateProductCounts(psDb, cfApi) {
    const psCount = await psDb.query('SELECT COUNT(*) as count FROM ps_product WHERE active = 1');
    const cfCount = await cfApi.products.count();

    return {
      prestashop: psCount[0].count,
      commercefull: cfCount,
      difference: Math.abs(psCount[0].count - cfCount),
    };
  },

  async validateCombinationCounts(psDb, cfApi) {
    const psCount = await psDb.query('SELECT COUNT(*) as count FROM ps_product_attribute');
    const cfVariants = await cfApi.products.list({ type: 'configurable' });
    const cfCount = cfVariants.reduce((sum, product) => sum + (product.variants?.length || 0), 0);

    return {
      prestashop: psCount[0].count,
      commercefull: cfCount,
    };
  },

  async validateCategoryCounts(psDb, cfApi) {
    const psCount = await psDb.query('SELECT COUNT(*) as count FROM ps_category WHERE active = 1 AND id_category > 1');
    const cfCount = await cfApi.categories.count();

    return {
      prestashop: psCount[0].count,
      commercefull: cfCount,
    };
  },
};
```

## Troubleshooting Common Issues

### Character Encoding Problems

```javascript
// Handle PrestaShop's mixed encoding
function fixEncoding(text) {
  if (!text) return text;

  // Convert common encoding issues
  return text
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã®/g, 'î')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã»/g, 'û')
    .replace(/Å"/g, '™')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"');
}
```

### Complex Product Combinations

```javascript
// Handle PrestaShop's complex attribute combinations
class CombinationHandler {
  async resolveCombinations(db, productId) {
    // Get all combinations for a product
    const combinations = await db.query(
      `
      SELECT pa.*, pac.id_attribute, a.id_attribute_group
      FROM ps_product_attribute pa
      JOIN ps_product_attribute_combination pac ON pa.id_product_attribute = pac.id_product_attribute
      JOIN ps_attribute a ON pac.id_attribute = a.id_attribute
      WHERE pa.id_product = ?
      ORDER BY pa.id_product_attribute, a.id_attribute_group
    `,
      [productId],
    );

    // Group by combination
    const grouped = combinations.reduce((acc, combo) => {
      if (!acc[combo.id_product_attribute]) {
        acc[combo.id_product_attribute] = {
          id: combo.id_product_attribute,
          attributes: [],
        };
      }
      acc[combo.id_product_attribute].attributes.push({
        groupId: combo.id_attribute_group,
        attributeId: combo.id_attribute,
      });
      return acc;
    }, {});

    return Object.values(grouped);
  }

  validateCombinations(combinations) {
    // Ensure all combinations have the same number of attributes
    const attributeCounts = combinations.map(c => c.attributes.length);
    const maxCount = Math.max(...attributeCounts);
    const minCount = Math.min(...attributeCounts);

    return maxCount === minCount;
  }
}
```

This comprehensive guide addresses PrestaShop's database-driven architecture, multi-language capabilities, and complex product combination system, providing efficient strategies for migrating to CommerceFull's normalized structure.
