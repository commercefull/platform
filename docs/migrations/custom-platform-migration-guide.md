# Custom E-Commerce Platform Migration Guide

## Overview

This guide provides a framework for migrating from custom-built or proprietary e-commerce platforms to CommerceFull. Since custom platforms vary significantly, this guide focuses on assessment, data mapping, and implementation strategies.

## Prerequisites

- Database access to source system
- Source code access (if available)
- API documentation or endpoint inventory
- CommerceFull API credentials
- Database schema documentation

## Assessment Phase

### 1. Source System Analysis

#### Database Schema Analysis

```sql
-- Extract all tables and their relationships
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END as key_type,
    CASE WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY' ELSE '' END as constraint_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema = 'your_database'
ORDER BY t.table_name, c.ordinal_position;
```

#### Data Volume Assessment

```javascript
const dataAssessment = {
  async assessTableSizes(db) {
    const tables = [
      'products', 'customers', 'orders', 'categories',
      'inventory', 'users', 'content', 'media'
    ];

    const results = {};

    for (const table of tables) {
      try {
        const count = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const size = await db.query(`
          SELECT
            table_name,
            round(((data_length + index_length) / 1024 / 1024), 2) as size_mb
          FROM information_schema.tables
          WHERE table_name = ?
        `, [table]);

        results[table] = {
          count: count[0].count,
          sizeMB: size[0]?.size_mb || 0
        };
      } catch (error) {
        results[table] = { error: error.message };
      }
    }

    return results;
  },

  async analyzeDataTypes(db) {
    const dataTypes = await db.query(`
      SELECT
        data_type,
        COUNT(*) as count,
        GROUP_CONCAT(DISTINCT table_name SEPARATOR ', ') as tables
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      GROUP BY data_type
      ORDER BY count DESC
    `);

    return dataTypes;
  },

  async identifyRelationships(db) {
    const relationships = await db.query(`
      SELECT
        tc.table_name as child_table,
        kcu.column_name as child_column,
        tc.constraint_name,
        kcu.referenced_table_name as parent_table,
        kcu.referenced_column_name as parent_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = DATABASE()
      ORDER BY tc.table_name
    `);

    return relationships;
  }
};
```

### 2. Business Logic Extraction

#### Custom Field Analysis

```javascript
class CustomFieldAnalyzer {
  async analyzeCustomFields(db) {
    // Look for common patterns of custom fields
    const patterns = [
      { pattern: '%custom%', description: 'Custom fields' },
      { pattern: '%meta%', description: 'Meta fields' },
      { pattern: '%attribute%', description: 'Attribute fields' },
      { pattern: '%property%', description: 'Property fields' },
      { pattern: '%option%', description: 'Option fields' }
    ];

    const results = {};

    for (const { pattern, description } of patterns) {
      const fields = await db.query(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND column_name LIKE ?
        ORDER BY table_name, column_name
      `, [pattern]);

      if (fields.length > 0) {
        results[description] = fields;
      }
    }

    return results;
  }

  async analyzeJSONFields(db) {
    // Look for JSON/text fields that might contain serialized data
    const jsonFields = await db.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND data_type IN ('json', 'text', 'mediumtext', 'longtext')
      AND column_name NOT IN ('description', 'content', 'body', 'notes')
    `);

    return jsonFields;
  }

  async sampleJSONContent(db, table, column, limit = 5) {
    const samples = await db.query(`
      SELECT ${column} as content
      FROM ${table}
      WHERE ${column} IS NOT NULL
      AND ${column} != ''
      LIMIT ?
    `, [limit]);

    return samples.map(row => {
      try {
        return JSON.parse(row.content);
      } catch (e) {
        return { raw: row.content.substring(0, 200) };
      }
    });
  }
}
```

### 3. API and Integration Analysis

#### Endpoint Inventory

```javascript
class APIAnalyzer {
  async analyzeAPIs(sourceSystem) {
    // If source system has APIs, analyze them
    const endpoints = {
      products: await this.testEndpoint('/api/products'),
      customers: await this.testEndpoint('/api/customers'),
      orders: await this.testEndpoint('/api/orders'),
      categories: await this.testEndpoint('/api/categories')
    };

    return {
      available: Object.entries(endpoints).filter(([_, available]) => available),
      unavailable: Object.entries(endpoints).filter(([_, available]) => !available)
    };
  }

  async testEndpoint(url) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async analyzeRateLimits() {
    // Test rate limits if APIs exist
    const tests = [];
    const concurrency = 10;

    for (let i = 0; i < concurrency; i++) {
      tests.push(this.testConcurrentRequests());
    }

    const results = await Promise.allSettled(tests);
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return {
      concurrentRequests: concurrency,
      successfulRequests: successCount,
      rateLimited: concurrency - successCount
    };
  }
}
```

## Data Mapping Strategy

### 1. Entity Relationship Mapping

```javascript
class EntityMapper {
  constructor() {
    this.mappings = {
      products: {
        sourceTable: 'products',
        targetEntity: 'product',
        fieldMappings: {
          'id': 'productId',
          'name': 'name',
          'description': 'description',
          'price': 'price',
          'sku': 'sku',
          'created_at': 'createdAt',
          'updated_at': 'updatedAt'
        },
        relationships: {
          categories: { table: 'product_categories', fk: 'product_id' },
          images: { table: 'product_images', fk: 'product_id' },
          variants: { table: 'product_variants', fk: 'product_id' }
        }
      },
      customers: {
        sourceTable: 'users',
        targetEntity: 'customer',
        fieldMappings: {
          'id': 'customerId',
          'email': 'email',
          'first_name': 'firstName',
          'last_name': 'lastName',
          'created_at': 'createdAt'
        },
        relationships: {
          addresses: { table: 'user_addresses', fk: 'user_id' },
          orders: { table: 'orders', fk: 'customer_id' }
        }
      }
    };
  }

  generateMappingConfiguration(sourceSchema) {
    const config = {};

    for (const [entity, mapping] of Object.entries(this.mappings)) {
      config[entity] = this.adaptMappingToSchema(mapping, sourceSchema);
    }

    return config;
  }

  adaptMappingToSchema(mapping, schema) {
    const adapted = { ...mapping };

    // Adjust field mappings based on actual schema
    for (const [sourceField, targetField] of Object.entries(mapping.fieldMappings)) {
      if (!schema[mapping.sourceTable]?.includes(sourceField)) {
        // Find closest match or mark as missing
        const closest = this.findClosestField(sourceField, schema[mapping.sourceTable]);
        if (closest) {
          adapted.fieldMappings[closest] = targetField;
          delete adapted.fieldMappings[sourceField];
        }
      }
    }

    return adapted;
  }

  findClosestField(targetField, availableFields) {
    // Simple string similarity matching
    const target = targetField.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const field of availableFields) {
      const score = this.calculateSimilarity(target, field.toLowerCase());
      if (score > bestScore && score > 0.6) {
        bestMatch = field;
        bestScore = score;
      }
    }

    return bestMatch;
  }

  calculateSimilarity(str1, str2) {
    // Levenshtein distance based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
```

### 2. Dynamic Transformation Engine

```javascript
class DynamicTransformer {
  constructor(mappingConfig) {
    this.config = mappingConfig;
    this.transformers = {
      string: (value) => String(value || ''),
      number: (value) => parseFloat(value) || 0,
      boolean: (value) => Boolean(value),
      date: (value) => new Date(value).toISOString(),
      json: (value) => {
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (e) {
          return null;
        }
      }
    };
  }

  transform(entityType, sourceData) {
    const config = this.config[entityType];
    if (!config) {
      throw new Error(`No mapping configuration for entity type: ${entityType}`);
    }

    const result = {};

    // Transform direct field mappings
    for (const [sourceField, targetField] of Object.entries(config.fieldMappings)) {
      if (sourceData[sourceField] !== undefined) {
        const transformer = this.getTransformerForField(config, sourceField);
        result[targetField] = transformer(sourceData[sourceField]);
      }
    }

    // Transform relationships
    for (const [relationName, relationConfig] of Object.entries(config.relationships || {})) {
      if (sourceData[relationName]) {
        result[relationName] = this.transformRelation(relationConfig, sourceData[relationName]);
      }
    }

    return result;
  }

  getTransformerForField(config, fieldName) {
    // Look for field-specific transformer in config
    if (config.fieldTransformers && config.fieldTransformers[fieldName]) {
      return config.fieldTransformers[fieldName];
    }

    // Infer transformer from field name patterns
    if (fieldName.includes('price') || fieldName.includes('cost') || fieldName.includes('weight')) {
      return this.transformers.number;
    }
    if (fieldName.includes('date') || fieldName.includes('created') || fieldName.includes('updated')) {
      return this.transformers.date;
    }
    if (fieldName.includes('active') || fieldName.includes('enabled') || fieldName.includes('visible')) {
      return this.transformers.boolean;
    }

    return this.transformers.string;
  }

  transformRelation(relationConfig, relationData) {
    if (Array.isArray(relationData)) {
      return relationData.map(item => this.transformSimpleRelation(relationConfig, item));
    } else {
      return this.transformSimpleRelation(relationConfig, relationData);
    }
  }

  transformSimpleRelation(relationConfig, data) {
    const result = {};

    for (const [sourceField, targetField] of Object.entries(relationConfig.fieldMappings || {})) {
      if (data[sourceField] !== undefined) {
        result[targetField] = data[sourceField];
      }
    }

    return result;
  }
}
```

## Migration Implementation

### 1. Generic Migration Framework

```javascript
class GenericMigrationFramework {
  constructor(sourceConfig, targetConfig) {
    this.source = this.createSourceConnector(sourceConfig);
    this.target = this.createTargetConnector(targetConfig);
    this.mapper = new DynamicEntityMapper();
    this.transformer = new DynamicTransformer();
    this.validator = new DataValidator();
  }

  async migrate(entityType, options = {}) {
    const {
      batchSize = 1000,
      concurrency = 3,
      validate = true,
      continueOnError = false
    } = options;

    

    // Analyze source data
    const sourceSchema = await this.source.analyzeSchema(entityType);
    const mappingConfig = this.mapper.generateMapping(sourceSchema);

    // Migrate in batches
    let offset = 0;
    let migrated = 0;
    let errors = 0;

    while (true) {
      const batch = await this.source.extractBatch(entityType, offset, batchSize);

      if (batch.length === 0) break;

      // Process batch with concurrency control
      const results = await this.processBatchConcurrently(
        batch,
        entityType,
        mappingConfig,
        concurrency,
        validate
      );

      migrated += results.successful;
      errors += results.errors;

      if (!continueOnError && results.errors > 0) {
        throw new Error(`Migration failed with ${results.errors} errors`);
      }

      offset += batchSize;
      console.log(`Processed ${migrated} ${entityType} (${errors} errors)`);
    }

    return { migrated, errors };
  }

  async processBatchConcurrently(batch, entityType, mappingConfig, concurrency, validate) {
    const chunks = this.chunkArray(batch, Math.ceil(batch.length / concurrency));
    const results = { successful: 0, errors: 0 };

    for (const chunk of chunks) {
      const promises = chunk.map(async (item) => {
        try {
          const transformed = this.transformer.transform(entityType, item);

          if (validate) {
            const validation = await this.validator.validate(entityType, transformed);
            if (!validation.valid) {
              throw new ValidationError(validation.errors);
            }
          }

          await this.target.load(entityType, transformed);
          return { success: true };
        } catch (error) {
          
          return { success: false, error };
        }
      });

      const chunkResults = await Promise.all(promises);

      results.successful += chunkResults.filter(r => r.success).length;
      results.errors += chunkResults.filter(r => !r.success).length;
    }

    return results;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  createSourceConnector(config) {
    // Factory method for different source types
    switch (config.type) {
      case 'mysql':
      case 'postgresql':
        return new DatabaseConnector(config);
      case 'api':
        return new APIConnector(config);
      case 'csv':
        return new CSVConnector(config);
      default:
        throw new Error(`Unsupported source type: ${config.type}`);
    }
  }

  createTargetConnector(config) {
    // Always CommerceFull API for target
    return new CommerceFullConnector(config);
  }
}
```

### 2. Error Handling and Recovery

```javascript
class MigrationErrorHandler {
  constructor() {
    this.errors = new Map();
    this.recoveryStrategies = new Map();
  }

  registerRecoveryStrategy(entityType, strategy) {
    this.recoveryStrategies.set(entityType, strategy);
  }

  async handleError(entityType, data, error) {
    const errorKey = `${entityType}:${error.code || error.message}`;

    if (!this.errors.has(errorKey)) {
      this.errors.set(errorKey, {
        count: 0,
        samples: [],
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }

    const errorInfo = this.errors.get(errorKey);
    errorInfo.count++;
    errorInfo.lastSeen = new Date();

    if (errorInfo.samples.length < 5) {
      errorInfo.samples.push({
        data,
        error: error.message,
        timestamp: new Date()
      });
    }

    // Try recovery strategy
    const recoveryStrategy = this.recoveryStrategies.get(entityType);
    if (recoveryStrategy) {
      try {
        const recoveredData = await recoveryStrategy(data, error);
        return recoveredData;
      } catch (recoveryError) {
        // Recovery failed, log and continue
        
      }
    }

    throw error;
  }

  generateErrorReport() {
    const report = {
      summary: {
        totalErrors: 0,
        uniqueErrorTypes: this.errors.size,
        generatedAt: new Date()
      },
      errors: []
    };

    for (const [errorKey, errorInfo] of this.errors) {
      report.summary.totalErrors += errorInfo.count;
      report.errors.push({
        type: errorKey,
        count: errorInfo.count,
        firstSeen: errorInfo.firstSeen,
        lastSeen: errorInfo.lastSeen,
        samples: errorInfo.samples
      });
    }

    report.errors.sort((a, b) => b.count - a.count);
    return report;
  }
}
```

### 3. Data Validation Framework

```javascript
class DataValidator {
  constructor() {
    this.rules = new Map();
    this.setupDefaultRules();
  }

  setupDefaultRules() {
    // Product validation rules
    this.rules.set('product', {
      name: (value) => value && value.length > 0 && value.length <= 255,
      price: (value) => typeof value === 'number' && value >= 0,
      sku: (value) => !value || (typeof value === 'string' && value.length <= 100),
      description: (value) => !value || typeof value === 'string'
    });

    // Customer validation rules
    this.rules.set('customer', {
      email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return value && emailRegex.test(value);
      },
      firstName: (value) => value && value.length > 0 && value.length <= 100,
      lastName: (value) => value && value.length > 0 && value.length <= 100
    });

    // Order validation rules
    this.rules.set('order', {
      total: (value) => typeof value === 'number' && value >= 0,
      customerId: (value) => value && typeof value === 'string',
      status: (value) => ['pending', 'processing', 'completed', 'cancelled'].includes(value)
    });
  }

  addCustomRule(entityType, field, rule) {
    if (!this.rules.has(entityType)) {
      this.rules.set(entityType, {});
    }

    this.rules.get(entityType)[field] = rule;
  }

  async validate(entityType, data) {
    const rules = this.rules.get(entityType);
    if (!rules) {
      return { valid: true, errors: [] };
    }

    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      if (data[field] !== undefined && data[field] !== null) {
        try {
          const isValid = await rule(data[field]);
          if (!isValid) {
            errors.push({
              field,
              value: data[field],
              message: `Validation failed for field ${field}`
            });
          }
        } catch (error) {
          errors.push({
            field,
            value: data[field],
            message: `Validation error for field ${field}: ${error.message}`
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## Performance Optimization

### 1. Parallel Processing

```javascript
class ParallelProcessor {
  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    this.active = 0;
    this.queue = [];
    this.results = [];
  }

  async process(items, processor) {
    return new Promise((resolve, reject) => {
      let index = 0;

      const next = async () => {
        if (index >= items.length && this.active === 0) {
          resolve(this.results);
          return;
        }

        while (this.active < this.concurrency && index < items.length) {
          const item = items[index++];
          this.active++;

          try {
            const result = await processor(item);
            this.results.push({ success: true, result, index: index - 1 });
          } catch (error) {
            this.results.push({ success: false, error, index: index - 1 });
          } finally {
            this.active--;
            setImmediate(next);
          }
        }
      };

      next();
    });
  }

  async processWithRateLimit(items, processor, requestsPerSecond = 10) {
    const delay = 1000 / requestsPerSecond;
    let lastRequestTime = 0;

    const rateLimitedProcessor = async (item) => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      if (timeSinceLastRequest < delay) {
        await this.sleep(delay - timeSinceLastRequest);
      }

      lastRequestTime = Date.now();
      return processor(item);
    };

    return this.process(items, rateLimitedProcessor);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Memory Management

```javascript
class MemoryEfficientMigrator {
  constructor(options = {}) {
    this.options = {
      batchSize: 1000,
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      gcInterval: 10000, // 10 seconds
      ...options
    };

    this.lastGC = Date.now();
  }

  async migrateLargeDataset(extractor, transformer, loader) {
    let hasMore = true;
    let offset = 0;
    const results = { processed: 0, errors: 0 };

    while (hasMore) {
      // Check memory usage
      await this.checkMemoryUsage();

      // Extract batch
      const rawData = await extractor.extractBatch(offset, this.options.batchSize);

      if (rawData.length === 0) {
        hasMore = false;
        break;
      }

      // Transform batch
      const transformedData = [];
      for (const item of rawData) {
        try {
          const transformed = await transformer.transform(item);
          transformedData.push(transformed);
        } catch (error) {
          results.errors++;
          
        }
      }

      // Load batch
      const loadResults = await loader.loadBatch(transformedData);
      results.processed += loadResults.successful;
      results.errors += loadResults.errors;

      offset += this.options.batchSize;

      console.log(`Processed ${results.processed} records (${results.errors} errors)`);

      // Force cleanup
      await this.forceCleanup();
    }

    return results;
  }

  async checkMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const heapUsed = usage.heapUsed;

      if (heapUsed > this.options.maxMemoryUsage) {
        console.warn(`High memory usage: ${Math.round(heapUsed / 1024 / 1024)}MB`);
        await this.forceGC();
      }
    }
  }

  async forceGC() {
    const now = Date.now();
    if (now - this.lastGC > this.options.gcInterval) {
      if (global.gc) {
        global.gc();
        this.lastGC = now;
      }
    }
  }

  async forceCleanup() {
    // Clear any cached data
    if (global.gc) {
      global.gc();
    }
  }
}
```

## Complete Migration Script

```javascript
const GenericMigrationRunner = require('./generic-migration-runner');

async function runCustomMigration() {
  const runner = new GenericMigrationRunner({
    source: {
      type: 'mysql', // or 'postgresql', 'api', 'csv'
      host: process.env.SOURCE_DB_HOST,
      database: process.env.SOURCE_DB_NAME,
      username: process.env.SOURCE_DB_USER,
      password: process.env.SOURCE_DB_PASSWORD
    },
    target: {
      baseURL: process.env.COMMERCEFULL_URL,
      apiKey: process.env.COMMERCEFULL_API_KEY
    },
    options: {
      batchSize: 500,
      concurrency: 3,
      validate: true,
      continueOnError: true
    }
  });

  try {
    

    // Analyze source system
    await runner.analyzeSource();

    // Generate mapping configuration
    await runner.generateMappings();

    // Phase 1: Foundation data
    await runner.migrate('categories');
    await runner.migrate('attributes');

    // Phase 2: Products
    await runner.migrate('products');

    // Phase 3: Customers
    await runner.migrate('customers');

    // Phase 4: Orders
    await runner.migrate('orders');

    // Phase 5: Content
    await runner.migrate('content');

    
    console.log(runner.generateReport());

  } catch (error) {
    
    console.log('Partial results:', runner.generateReport());
    console.log('Error details:', runner.errorHandler.generateErrorReport());
  }
}

runCustomMigration();
```

## Post-Migration Validation

### Automated Validation Suite

```javascript
const ValidationSuite = {
  async runFullValidation(sourceDb, targetApi) {
    const results = {
      products: await this.validateProducts(sourceDb, targetApi),
      customers: await this.validateCustomers(sourceDb, targetApi),
      orders: await this.validateOrders(sourceDb, targetApi),
      categories: await this.validateCategories(sourceDb, targetApi)
    };

    return {
      overall: this.calculateOverallScore(results),
      details: results,
      recommendations: this.generateRecommendations(results)
    };
  },

  async validateProducts(sourceDb, targetApi) {
    const sourceCount = await sourceDb.query('SELECT COUNT(*) as count FROM products');
    const targetCount = await targetApi.products.count();

    const sampleSource = await sourceDb.query('SELECT id, name, sku, price FROM products LIMIT 10');
    const sampleTarget = await targetApi.products.list({ limit: 10 });

    return {
      countMatch: sourceCount[0].count === targetCount,
      sourceCount: sourceCount[0].count,
      targetCount,
      sampleValidation: this.validateSamples(sampleSource, sampleTarget, ['name', 'sku', 'price'])
    };
  },

  validateSamples(sourceSamples, targetSamples, fields) {
    const results = [];

    for (let i = 0; i < Math.min(sourceSamples.length, targetSamples.length); i++) {
      const source = sourceSamples[i];
      const target = targetSamples[i];

      const fieldResults = {};
      for (const field of fields) {
        fieldResults[field] = source[field] === target[field];
      }

      results.push({
        index: i,
        allMatch: Object.values(fieldResults).every(match => match),
        fieldResults
      });
    }

    return results;
  },

  calculateOverallScore(results) {
    const scores = Object.values(results).map(r => {
      let score = 0;
      if (r.countMatch) score += 50;
      if (r.sampleValidation) {
        const validSamples = r.sampleValidation.filter(s => s.allMatch).length;
        score += (validSamples / r.sampleValidation.length) * 50;
      }
      return score;
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  },

  generateRecommendations(results) {
    const recommendations = [];

    if (!results.products.countMatch) {
      recommendations.push('Product counts do not match - investigate missing or duplicate products');
    }

    if (!results.customers.countMatch) {
      recommendations.push('Customer counts do not match - check customer import process');
    }

    const failedSamples = Object.entries(results)
      .filter(([_, result]) => result.sampleValidation)
      .flatMap(([type, result]) => result.sampleValidation.filter(s => !s.allMatch))
      .length;

    if (failedSamples > 0) {
      recommendations.push(`${failedSamples} sample records have validation errors - review transformation logic`);
    }

    return recommendations;
  }
};
```

This comprehensive guide provides a flexible framework for migrating from any custom e-commerce platform to CommerceFull, with dynamic mapping, extensive error handling, and performance optimization strategies.
