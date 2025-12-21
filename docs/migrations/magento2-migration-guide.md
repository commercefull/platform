# Magento 2 to CommerceFull Migration Guide

## Overview

This guide provides detailed instructions for migrating from Magento 2 to CommerceFull, addressing the complexities of Magento's EAV (Entity-Attribute-Value) data model and modular architecture.

## Prerequisites

- Magento 2 database access (MySQL/MariaDB)
- Magento 2 codebase access for custom modules
- CommerceFull API credentials
- PHP environment for extraction scripts
- Node.js environment for transformation and loading

## Magento 2 Data Architecture

### Core Tables Structure
- `catalog_product_entity` - Main product table
- `catalog_product_entity_*` - EAV attribute tables
- `eav_attribute` - Attribute definitions
- `customer_entity` - Customer data
- `sales_order` - Order headers
- `sales_order_item` - Order line items

### Key Challenges
- EAV (Entity-Attribute-Value) model complexity
- Multi-store configurations
- Complex product types (configurable, bundle, grouped)
- Custom attributes and extensions
- Index tables vs. raw data tables

## Preparation Phase

### 1. Database Connection Setup

```php
<?php
class MagentoDatabase {
    private $pdo;

    public function __construct($config) {
        $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset=utf8";
        $this->pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false // For large datasets
        ]);
    }

    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function getEavValue($entityId, $attributeCode, $entityType = 'catalog_product') {
        // Get attribute ID first
        $attrStmt = $this->pdo->prepare("
            SELECT ea.attribute_id
            FROM eav_attribute ea
            JOIN eav_entity_type et ON ea.entity_type_id = et.entity_type_id
            WHERE ea.attribute_code = ? AND et.entity_type_code = ?
        ");
        $attrStmt->execute([$attributeCode, $entityType]);
        $attr = $attrStmt->fetch();

        if (!$attr) return null;

        // Get value based on backend type
        $valueStmt = $this->pdo->prepare("
            SELECT backend_type FROM eav_attribute WHERE attribute_id = ?
        ");
        $valueStmt->execute([$attr['attribute_id']]);
        $backendType = $valueStmt->fetch()['backend_type'];

        $tableName = "catalog_product_entity_{$backendType}";
        $valueStmt = $this->pdo->prepare("
            SELECT value FROM {$tableName}
            WHERE entity_id = ? AND attribute_id = ?
        ");
        $valueStmt->execute([$entityId, $attr['attribute_id']]);
        $result = $valueStmt->fetch();

        return $result ? $result['value'] : null;
    }
}
```

```javascript
const mysql = require('mysql2/promise');

class MagentoExtractor {
  constructor(config) {
    this.pool = mysql.createPool({
      host: config.host,
      user: config.username,
      password: config.password,
      database: config.database,
      charset: 'utf8',
      acquireTimeout: 60000,
      timeout: 60000
    });
  }

  async getEavValue(entityId, attributeCode, entityType = 'catalog_product') {
    const [attrRows] = await this.pool.execute(`
      SELECT ea.attribute_id, ea.backend_type
      FROM eav_attribute ea
      JOIN eav_entity_type et ON ea.entity_type_id = et.entity_type_id
      WHERE ea.attribute_code = ? AND et.entity_type_code = ?
    `, [attributeCode, entityType]);

    if (attrRows.length === 0) return null;

    const { attribute_id, backend_type } = attrRows[0];
    const tableName = `catalog_product_entity_${backend_type}`;

    const [valueRows] = await this.pool.execute(`
      SELECT value FROM ${tableName}
      WHERE entity_id = ? AND attribute_id = ?
    `, [entityId, attribute_id]);

    return valueRows.length > 0 ? valueRows[0].value : null;
  }
}
```

### 2. Data Assessment

```javascript
const assessMagentoData = async (db) => {
  const assessment = {
    products: await db.query('SELECT COUNT(*) as count FROM catalog_product_entity WHERE type_id IN ("simple", "configurable", "bundle", "grouped")'),
    categories: await db.query('SELECT COUNT(*) as count FROM catalog_category_entity WHERE level > 1'),
    customers: await db.query('SELECT COUNT(*) as count FROM customer_entity'),
    orders: await db.query('SELECT COUNT(*) as count FROM sales_order'),
    attributes: await db.query('SELECT COUNT(*) as count FROM eav_attribute WHERE entity_type_id = (SELECT entity_type_id FROM eav_entity_type WHERE entity_type_code = "catalog_product")'),
    stores: await db.query('SELECT COUNT(*) as count FROM store WHERE store_id > 0'),
    websites: await db.query('SELECT COUNT(*) as count FROM store_website')
  };

  // Get product type breakdown
  const productTypes = await db.query(`
    SELECT type_id, COUNT(*) as count
    FROM catalog_product_entity
    WHERE type_id IN ('simple', 'configurable', 'bundle', 'grouped')
    GROUP BY type_id
  `);

  assessment.productTypes = productTypes;

  return assessment;
};
```

## Migration Execution

### Phase 1: Foundation Data

#### 1.1 Product Attributes Migration

```javascript
class MagentoAttributeMigrator {
  async migrateAttributes(db, cf) {
    // Get all product attributes
    const attributes = await db.query(`
      SELECT ea.attribute_id, ea.attribute_code, ea.frontend_label,
             ea.backend_type, ea.frontend_input, ea.is_required,
             ea.is_searchable, ea.is_filterable, ea.is_comparable,
             ea.is_visible_on_front, ea.used_in_product_listing,
             ea.used_for_sort_by, ea.is_user_defined,
             ea.attribute_set_id, eas.attribute_set_name
      FROM eav_attribute ea
      JOIN eav_attribute_set eas ON ea.attribute_set_id = eas.attribute_set_id
      JOIN eav_entity_type et ON ea.entity_type_id = et.entity_type_id
      WHERE et.entity_type_code = 'catalog_product'
      AND ea.is_user_defined = 1
      ORDER BY ea.attribute_set_id, ea.sort_order
    `);

    // Group by attribute set
    const attributeSets = {};
    for (const attr of attributes) {
      if (!attributeSets[attr.attribute_set_id]) {
        attributeSets[attr.attribute_set_id] = {
          name: attr.attribute_set_name,
          attributes: []
        };
      }
      attributeSets[attr.attribute_set_id].attributes.push(attr);
    }

    // Create attribute groups in CommerceFull
    for (const [setId, setData] of Object.entries(attributeSets)) {
      // Create group
      const group = await cf.productAttributeGroups.create({
        name: setData.name,
        code: setData.name.toLowerCase().replace(/\s+/g, '_'),
        description: `Magento attribute set: ${setData.name}`,
        position: 1,
        isComparable: true,
        isGlobal: true
      });

      // Create attributes in this group
      for (const attr of setData.attributes) {
        const attribute = await cf.productAttributes.create({
          groupId: group.id,
          name: attr.frontend_label || attr.attribute_code,
          code: attr.attribute_code,
          description: `Migrated from Magento: ${attr.attribute_code}`,
          type: this.mapAttributeType(attr.frontend_input, attr.backend_type),
          inputType: this.mapInputType(attr.frontend_input),
          isRequired: attr.is_required === 1,
          isUnique: false,
          isSystem: false,
          isSearchable: attr.is_searchable === 1,
          isFilterable: attr.is_filterable === 1,
          isComparable: attr.is_comparable === 1,
          isVisibleOnFront: attr.is_visible_on_front === 1,
          isUsedInProductListing: attr.used_in_product_listing === 1,
          useForVariants: this.isVariantAttribute(attr.attribute_code),
          useForConfigurations: false,
          position: attr.sort_order || 0
        });

        // Store mapping for later use
        this.attributeMap[attr.attribute_id] = attribute.id;
      }
    }
  }

  mapAttributeType(frontendInput, backendType) {
    const typeMapping = {
      'text': 'text',
      'textarea': 'text',
      'select': 'select',
      'multiselect': 'select',
      'boolean': 'boolean',
      'price': 'number',
      'weight': 'number',
      'date': 'date',
      'datetime': 'datetime'
    };

    if (backendType === 'decimal') return 'number';
    if (backendType === 'int') return 'number';

    return typeMapping[frontendInput] || 'text';
  }

  mapInputType(frontendInput) {
    const inputMapping = {
      'text': 'text',
      'textarea': 'textarea',
      'select': 'select',
      'multiselect': 'multiselect',
      'boolean': 'checkbox',
      'price': 'number',
      'weight': 'number',
      'date': 'date',
      'datetime': 'datetime'
    };

    return inputMapping[frontendInput] || 'text';
  }

  isVariantAttribute(attributeCode) {
    // Common variant attributes in Magento
    const variantAttributes = ['color', 'size', 'material', 'style'];
    return variantAttributes.includes(attributeCode.toLowerCase());
  }
}
```

#### 1.2 Categories Migration

```javascript
class MagentoCategoryMigrator {
  async migrateCategories(db, cf) {
    // Get all categories except root
    const categories = await db.query(`
      SELECT cce.entity_id, cce.parent_id, cce.level, cce.position,
             ccev.value as name,
             url_rewrite.request_path as url_path
      FROM catalog_category_entity cce
      LEFT JOIN catalog_category_entity_varchar ccev ON cce.entity_id = ccev.entity_id
        AND ccev.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'name' AND entity_type_id = 3)
      LEFT JOIN url_rewrite ON url_rewrite.entity_id = cce.entity_id
        AND url_rewrite.entity_type = 'category'
      WHERE cce.level > 1
      ORDER BY cce.level, cce.parent_id, cce.position
    `);

    const categoryMap = new Map();

    for (const cat of categories) {
      const category = await cf.categories.create({
        name: cat.name || `Category ${cat.entity_id}`,
        slug: this.generateSlug(cat.name || `category-${cat.entity_id}`),
        description: '', // Would need additional query for description
        parentId: cat.parent_id > 1 ? categoryMap.get(cat.parent_id) : null,
        isActive: true,
        position: cat.position,
        metaTitle: cat.name,
        metaDescription: cat.name
      });

      categoryMap.set(cat.entity_id, category.id);
    }

    return categoryMap;
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

### Phase 2: Products Migration

#### 2.1 Product Data Extraction

```javascript
class MagentoProductExtractor {
  async extractProducts(db, limit = 1000, offset = 0) {
    const products = await db.query(`
      SELECT cpe.entity_id, cpe.sku, cpe.type_id, cpe.attribute_set_id,
             cpe.created_at, cpe.updated_at,
             cps.stock_status, cps.qty as stock_quantity,
             cpev.value as name,
             cped.value as description,
             cpes.value as short_description,
             cpew.value as weight,
             cisp.price, cisp.final_price, cisp.min_price, cisp.max_price
      FROM catalog_product_entity cpe
      LEFT JOIN cataloginventory_stock_status cps ON cpe.entity_id = cps.product_id
      LEFT JOIN catalog_product_entity_varchar cpev ON cpe.entity_id = cpev.entity_id
        AND cpev.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'name' AND entity_type_id = 4)
      LEFT JOIN catalog_product_entity_text cped ON cpe.entity_id = cped.entity_id
        AND cped.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'description' AND entity_type_id = 4)
      LEFT JOIN catalog_product_entity_text cpes ON cpe.entity_id = cpes.entity_id
        AND cpes.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'short_description' AND entity_type_id = 4)
      LEFT JOIN catalog_product_entity_decimal cpew ON cpe.entity_id = cpew.entity_id
        AND cpew.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'weight' AND entity_type_id = 4)
      LEFT JOIN catalog_product_index_price cisp ON cpe.entity_id = cisp.entity_id
      WHERE cpe.type_id IN ('simple', 'configurable', 'bundle', 'grouped')
      ORDER BY cpe.entity_id
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const enrichedProducts = [];

    for (const product of products) {
      const categories = await this.extractProductCategories(db, product.entity_id);
      const attributes = await this.extractProductAttributes(db, product.entity_id);
      const images = await this.extractProductImages(db, product.entity_id);
      const variants = product.type_id === 'configurable' ?
        await this.extractProductVariants(db, product.entity_id) : [];

      enrichedProducts.push({
        ...product,
        categories,
        attributes,
        images,
        variants
      });
    }

    return enrichedProducts;
  }

  async extractProductCategories(db, productId) {
    return await db.query(`
      SELECT cc.entity_id, cc.parent_id, ccev.value as name
      FROM catalog_category_product ccp
      JOIN catalog_category_entity cc ON ccp.category_id = cc.entity_id
      LEFT JOIN catalog_category_entity_varchar ccev ON cc.entity_id = ccev.entity_id
        AND ccev.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'name' AND entity_type_id = 3)
      WHERE ccp.product_id = ?
    `, [productId]);
  }

  async extractProductAttributes(db, productId) {
    // Get all EAV attributes for this product
    const attributes = await db.query(`
      SELECT ea.attribute_code, ea.frontend_label,
             CASE ea.backend_type
               WHEN 'varchar' THEN cpev.value
               WHEN 'text' THEN cpet.value
               WHEN 'decimal' THEN cped.value
               WHEN 'int' THEN cpei.value
               WHEN 'datetime' THEN cpedt.value
             END as value
      FROM eav_attribute ea
      LEFT JOIN catalog_product_entity_varchar cpev ON ea.attribute_id = cpev.attribute_id AND cpev.entity_id = ?
      LEFT JOIN catalog_product_entity_text cpet ON ea.attribute_id = cpet.attribute_id AND cpet.entity_id = ?
      LEFT JOIN catalog_product_entity_decimal cped ON ea.attribute_id = cped.attribute_id AND cped.entity_id = ?
      LEFT JOIN catalog_product_entity_int cpei ON ea.attribute_id = cpei.attribute_id AND cpei.entity_id = ?
      LEFT JOIN catalog_product_entity_datetime cpedt ON ea.attribute_id = cpedt.attribute_id AND cpedt.entity_id = ?
      WHERE ea.entity_type_id = (SELECT entity_type_id FROM eav_entity_type WHERE entity_type_code = 'catalog_product')
      AND ea.is_user_defined = 1
      AND (cpev.value IS NOT NULL OR cpet.value IS NOT NULL OR cped.value IS NOT NULL
           OR cpei.value IS NOT NULL OR cpedt.value IS NOT NULL)
    `, [productId, productId, productId, productId, productId]);

    return attributes.filter(attr => attr.value !== null);
  }

  async extractProductImages(db, productId) {
    return await db.query(`
      SELECT cpg.value as url, cpg.label, cpg.position,
             cpev.value as alt_text
      FROM catalog_product_entity_media_gallery cpg
      JOIN catalog_product_entity_media_gallery_value cpgv ON cpg.value_id = cpgv.value_id
      LEFT JOIN catalog_product_entity_media_gallery_value_to_entity cpgvte ON cpgv.value_id = cpgvte.value_id
      LEFT JOIN catalog_product_entity_varchar cpev ON cpgvte.entity_id = cpev.entity_id
        AND cpev.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'media_gallery' AND entity_type_id = 4)
      WHERE cpgvte.entity_id = ?
      ORDER BY cpg.position
    `, [productId]);
  }

  async extractProductVariants(db, configurableProductId) {
    // Get simple products associated with this configurable
    const variants = await db.query(`
      SELECT cpe.entity_id, cpe.sku, cpr.parent_id,
             GROUP_CONCAT(DISTINCT cpev.value ORDER BY ea.attribute_code) as variant_options,
             cps.qty as stock_quantity, cisp.final_price as price
      FROM catalog_product_relation cpr
      JOIN catalog_product_entity cpe ON cpr.child_id = cpe.entity_id
      LEFT JOIN catalog_product_super_link cpsl ON cpe.entity_id = cpsl.product_id
      LEFT JOIN cataloginventory_stock_status cps ON cpe.entity_id = cps.product_id
      LEFT JOIN catalog_product_index_price cisp ON cpe.entity_id = cisp.entity_id
      LEFT JOIN catalog_product_super_attribute cpsa ON cpsa.product_id = cpr.parent_id
      LEFT JOIN eav_attribute ea ON cpsa.attribute_id = ea.attribute_id
      LEFT JOIN catalog_product_entity_varchar cpev ON cpe.entity_id = cpev.entity_id
        AND cpev.attribute_id = cpsa.attribute_id
      WHERE cpr.parent_id = ?
      GROUP BY cpe.entity_id, cpe.sku, cpr.parent_id, cps.qty, cisp.final_price
    `, [configurableProductId]);

    return variants;
  }
}
```

#### 2.2 Product Transformation

```javascript
class MagentoProductTransformer {
  transformProduct(magentoProduct, categoryMap, attributeMap) {
    return {
      productId: generateUUID(),
      name: magentoProduct.name,
      slug: this.generateSlug(magentoProduct.name),
      description: magentoProduct.description,
      shortDescription: magentoProduct.short_description,
      sku: magentoProduct.sku,
      type: this.mapProductType(magentoProduct.type_id),
      status: 'published', // Magento products are typically active
      visibility: 'public',
      price: parseFloat(magentoProduct.price || 0),
      regularPrice: parseFloat(magentoProduct.final_price || magentoProduct.price || 0),
      salePrice: magentoProduct.final_price !== magentoProduct.price ?
        parseFloat(magentoProduct.final_price) : null,
      cost: null, // Would need additional attribute
      weight: parseFloat(magentoProduct.weight || 0),
      dimensions: null, // Would need additional attributes
      stockQuantity: parseInt(magentoProduct.stock_quantity || 0),
      stockStatus: magentoProduct.stock_status === '1' ? 'instock' : 'outofstock',
      backorders: 'no', // Default
      manageStock: true,
      categories: magentoProduct.categories.map(cat => categoryMap.get(cat.entity_id)).filter(Boolean),
      tags: [], // Magento doesn't have tags by default
      attributes: this.transformAttributes(magentoProduct.attributes, attributeMap),
      images: this.transformImages(magentoProduct.images),
      variants: magentoProduct.variants ? this.transformVariants(magentoProduct.variants) : [],
      seo: {
        title: magentoProduct.name,
        description: magentoProduct.short_description,
        focusKeyword: magentoProduct.name.split(' ')[0]
      },
      createdAt: magentoProduct.created_at,
      updatedAt: magentoProduct.updated_at
    };
  }

  mapProductType(magentoType) {
    const typeMapping = {
      'simple': 'simple',
      'configurable': 'configurable',
      'bundle': 'bundle',
      'grouped': 'grouped',
      'virtual': 'virtual',
      'downloadable': 'downloadable'
    };
    return typeMapping[magentoType] || 'simple';
  }

  transformAttributes(attributes, attributeMap) {
    return attributes.map(attr => ({
      attributeId: attributeMap.get(attr.attribute_code),
      name: attr.frontend_label || attr.attribute_code,
      value: attr.value,
      isVisible: true,
      isForVariations: this.isVariationAttribute(attr.attribute_code)
    })).filter(attr => attr.attributeId);
  }

  transformImages(images) {
    return images.map(img => ({
      url: img.url,
      alt: img.alt_text || img.label || '',
      position: parseInt(img.position || 0),
      isMain: parseInt(img.position || 0) === 1
    }));
  }

  transformVariants(variants) {
    return variants.map(variant => ({
      variantId: generateUUID(),
      sku: variant.sku,
      price: parseFloat(variant.price || 0),
      stockQuantity: parseInt(variant.stock_quantity || 0),
      attributes: this.parseVariantOptions(variant.variant_options),
      isActive: true
    }));
  }

  parseVariantOptions(optionsString) {
    if (!optionsString) return [];
    // Parse the GROUP_CONCAT result
    return optionsString.split(',').map(option => ({
      name: 'variant_option',
      value: option.trim()
    }));
  }

  isVariationAttribute(attributeCode) {
    // Common variation attributes in Magento
    const variationAttrs = ['color', 'size', 'material', 'style', 'length', 'width'];
    return variationAttrs.includes(attributeCode.toLowerCase());
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

#### 3.1 Customer Data Extraction

```javascript
class MagentoCustomerExtractor {
  async extractCustomers(db, limit = 1000, offset = 0) {
    const customers = await db.query(`
      SELECT ce.entity_id, ce.email, ce.created_at, ce.updated_at,
             cev.value as firstname, cel.value as lastname,
             cedob.value as dob, ceg.value as gender,
             ce.is_active, ce.created_in, ce.group_id
      FROM customer_entity ce
      LEFT JOIN customer_entity_varchar cev ON ce.entity_id = cev.entity_id
        AND cev.attribute_id = (SELECT attribute_id FROM eav_attribute
                               WHERE attribute_code = 'firstname' AND entity_type_id = 1)
      LEFT JOIN customer_entity_varchar cel ON ce.entity_id = cel.entity_id
        AND cel.attribute_id = (SELECT attribute_id FROM eav_attribute
                               WHERE attribute_code = 'lastname' AND entity_type_id = 1)
      LEFT JOIN customer_entity_datetime cedob ON ce.entity_id = cedob.entity_id
        AND cedob.attribute_id = (SELECT attribute_id FROM eav_attribute
                                 WHERE attribute_code = 'dob' AND entity_type_id = 1)
      LEFT JOIN customer_entity_int ceg ON ce.entity_id = ceg.entity_id
        AND ceg.attribute_id = (SELECT attribute_id FROM eav_attribute
                               WHERE attribute_code = 'gender' AND entity_type_id = 1)
      ORDER BY ce.entity_id
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const enrichedCustomers = [];

    for (const customer of customers) {
      const addresses = await this.extractCustomerAddresses(db, customer.entity_id);
      const orders = await this.extractCustomerOrders(db, customer.entity_id);

      enrichedCustomers.push({
        ...customer,
        addresses,
        orderCount: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.grand_total), 0)
      });
    }

    return enrichedCustomers;
  }

  async extractCustomerAddresses(db, customerId) {
    const addresses = await db.query(`
      SELECT ca.entity_id, ca.city, ca.country_id, ca.region, ca.postcode,
             ca.street, ca.telephone, ca.fax, ca.is_default_billing, ca.is_default_shipping,
             cavf.value as firstname, cavl.value as lastname, cavc.value as company
      FROM customer_address_entity ca
      LEFT JOIN customer_address_entity_varchar cavf ON ca.entity_id = cavf.entity_id
        AND cavf.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'firstname' AND entity_type_id = 2)
      LEFT JOIN customer_address_entity_varchar cavl ON ca.entity_id = cavl.entity_id
        AND cavl.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'lastname' AND entity_type_id = 2)
      LEFT JOIN customer_address_entity_varchar cavc ON ca.entity_id = cavc.entity_id
        AND cavc.attribute_id = (SELECT attribute_id FROM eav_attribute
                                WHERE attribute_code = 'company' AND entity_type_id = 2)
      WHERE ca.parent_id = ?
    `, [customerId]);

    return addresses.map(addr => ({
      id: addr.entity_id,
      firstName: addr.firstname,
      lastName: addr.lastname,
      company: addr.company,
      street: addr.street ? addr.street.split('\n') : [],
      city: addr.city,
      region: addr.region,
      postcode: addr.postcode,
      country: addr.country_id,
      telephone: addr.telephone,
      isDefaultBilling: addr.is_default_billing === '1',
      isDefaultShipping: addr.is_default_shipping === '1'
    }));
  }

  async extractCustomerOrders(db, customerId) {
    return await db.query(`
      SELECT entity_id, increment_id, created_at, grand_total, status
      FROM sales_order
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [customerId]);
  }
}
```

#### 3.2 Customer Transformation

```javascript
class MagentoCustomerTransformer {
  transformCustomer(magentoCustomer) {
    const addresses = magentoCustomer.addresses;
    const defaultBilling = addresses.find(addr => addr.isDefaultBilling);
    const defaultShipping = addresses.find(addr => addr.isDefaultShipping);

    return {
      customerId: generateUUID(),
      email: magentoCustomer.email,
      firstName: magentoCustomer.firstname,
      lastName: magentoCustomer.lastname,
      phone: defaultBilling?.telephone || defaultShipping?.telephone || '',
      dateOfBirth: magentoCustomer.dob ? new Date(magentoCustomer.dob).toISOString().split('T')[0] : null,
      gender: this.mapGender(magentoCustomer.gender),
      billingAddress: defaultBilling ? this.transformAddress(defaultBilling) : null,
      shippingAddress: defaultShipping ? this.transformAddress(defaultShipping) : null,
      isActive: magentoCustomer.is_active === '1',
      emailVerified: true, // Magento customers are typically verified
      acceptsMarketing: false, // Would need additional attribute
      tags: [],
      notes: `Migrated from Magento. Customer Group ID: ${magentoCustomer.group_id}`,
      lifetimeValue: magentoCustomer.totalSpent,
      orderCount: magentoCustomer.orderCount,
      createdAt: magentoCustomer.created_at,
      updatedAt: magentoCustomer.updated_at
    };
  }

  mapGender(genderValue) {
    const genderMap = {
      '1': 'Male',
      '2': 'Female',
      '3': 'Not Specified'
    };
    return genderMap[genderValue] || null;
  }

  transformAddress(magentoAddress) {
    return {
      firstName: magentoAddress.firstName,
      lastName: magentoAddress.lastName,
      company: magentoAddress.company,
      address1: magentoAddress.street[0] || '',
      address2: magentoAddress.street[1] || '',
      city: magentoAddress.city,
      state: magentoAddress.region,
      postcode: magentoAddress.postcode,
      country: magentoAddress.country
    };
  }
}
```

## Complete Migration Script

```javascript
const MagentoMigrationRunner = require('./magento-migration-runner');

async function runMagentoMigration() {
  const runner = new MagentoMigrationRunner({
    magento: {
      host: process.env.MAGENTO_DB_HOST,
      database: process.env.MAGENTO_DB_NAME,
      username: process.env.MAGENTO_DB_USER,
      password: process.env.MAGENTO_DB_PASSWORD
    },
    commercefull: {
      baseURL: process.env.COMMERCEFULL_URL,
      apiKey: process.env.COMMERCEFULL_API_KEY
    },
    options: {
      batchSize: 100,
      concurrency: 3,
      continueOnError: true,
      tablePrefix: '' // Magento 2 default table prefix
    }
  });

  try {
    console.log('Starting Magento 2 to CommerceFull migration...');

    // Phase 1: Foundation data
    await runner.migrateAttributes();
    await runner.migrateCategories();
    await runner.migrateTaxRules();

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

runMagentoMigration();
```

## EAV Data Handling Optimization

```javascript
class EavOptimizer {
  // Pre-load attribute metadata to avoid repeated queries
  async preloadAttributeMetadata(db) {
    const attributes = await db.query(`
      SELECT ea.attribute_id, ea.attribute_code, ea.backend_type,
             ea.entity_type_id, et.entity_type_code
      FROM eav_attribute ea
      JOIN eav_entity_type et ON ea.entity_type_id = et.entity_type_id
    `);

    this.attributeMap = new Map();
    this.tableMap = new Map();

    for (const attr of attributes) {
      this.attributeMap.set(`${attr.entity_type_code}.${attr.attribute_code}`, {
        id: attr.attribute_id,
        type: attr.backend_type,
        table: `catalog_product_entity_${attr.backend_type}`
      });
    }

    return this.attributeMap;
  }

  // Batch EAV value retrieval
  async getEavValuesBatch(db, entityIds, attributeCodes, entityType = 'catalog_product') {
    if (entityIds.length === 0) return {};

    const placeholders = entityIds.map(() => '?').join(',');
    const results = {};

    for (const attrCode of attributeCodes) {
      const attrInfo = this.attributeMap.get(`${entityType}.${attrCode}`);
      if (!attrInfo) continue;

      const values = await db.query(`
        SELECT entity_id, value
        FROM ${attrInfo.table}
        WHERE entity_id IN (${placeholders})
        AND attribute_id = ?
      `, [...entityIds, attrInfo.id]);

      for (const value of values) {
        if (!results[value.entity_id]) results[value.entity_id] = {};
        results[value.entity_id][attrCode] = value.value;
      }
    }

    return results;
  }
}
```

## Post-Migration Validation

### EAV Data Integrity Checks

```javascript
const MagentoValidation = {
  async validateProductCounts(magentoDb, cfApi) {
    const magentoCount = await magentoDb.query('SELECT COUNT(*) as count FROM catalog_product_entity');
    const cfCount = await cfApi.products.count();

    return {
      magento: magentoCount[0].count,
      commercefull: cfCount,
      difference: Math.abs(magentoCount[0].count - cfCount)
    };
  },

  async validateEavAttributes(magentoDb, cfApi) {
    // Check if critical attributes were migrated
    const magentoAttrs = await magentoDb.query(`
      SELECT COUNT(*) as count FROM eav_attribute
      WHERE attribute_code IN ('name', 'price', 'sku', 'status')
      AND entity_type_id = (SELECT entity_type_id FROM eav_entity_type WHERE entity_type_code = 'catalog_product')
    `);

    const cfAttrs = await cfApi.productAttributes.list();
    const criticalAttrs = cfAttrs.filter(attr =>
      ['name', 'price', 'sku', 'status'].includes(attr.code)
    );

    return {
      magento: magentoAttrs[0].count,
      commercefull: criticalAttrs.length
    };
  },

  async validateConfigurableProducts(magentoDb, cfApi) {
    const magentoConfigurables = await magentoDb.query(`
      SELECT COUNT(*) as count FROM catalog_product_entity WHERE type_id = 'configurable'
    `);

    const cfConfigurables = await cfApi.products.list({ type: 'configurable' });

    return {
      magento: magentoConfigurables[0].count,
      commercefull: cfConfigurables.length
    };
  }
};
```

## Troubleshooting EAV Issues

### Handling Complex EAV Queries

```javascript
// For products with many attributes, use temporary tables
class EavQueryOptimizer {
  async createProductAttributeTempTable(db) {
    await db.query(`
      CREATE TEMPORARY TABLE product_attributes_temp AS
      SELECT
        cpe.entity_id,
        MAX(CASE WHEN ea.attribute_code = 'name' THEN cpev.value END) as name,
        MAX(CASE WHEN ea.attribute_code = 'sku' THEN cpev.value END) as sku,
        MAX(CASE WHEN ea.attribute_code = 'price' THEN cped.value END) as price,
        MAX(CASE WHEN ea.attribute_code = 'special_price' THEN cped.value END) as special_price,
        MAX(CASE WHEN ea.attribute_code = 'status' THEN cpei.value END) as status
      FROM catalog_product_entity cpe
      LEFT JOIN eav_attribute ea ON ea.entity_type_id = 4
      LEFT JOIN catalog_product_entity_varchar cpev ON cpe.entity_id = cpev.entity_id AND ea.attribute_id = cpev.attribute_id
      LEFT JOIN catalog_product_entity_decimal cped ON cpe.entity_id = cped.entity_id AND ea.attribute_id = cped.attribute_id
      LEFT JOIN catalog_product_entity_int cpei ON cpe.entity_id = cpei.entity_id AND ea.attribute_id = cpei.attribute_id
      GROUP BY cpe.entity_id
    `);
  }

  async getProductsWithAttributes(db, limit, offset) {
    return await db.query(`
      SELECT * FROM product_attributes_temp
      ORDER BY entity_id
      LIMIT ? OFFSET ?
    `, [limit, offset]);
  }
}
```

This comprehensive guide addresses the unique challenges of Magento 2's EAV architecture, providing efficient strategies for extracting and transforming complex product, customer, and order data into CommerceFull's normalized structure.
