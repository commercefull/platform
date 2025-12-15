/**
 * Seed dynamic attribute test data with fixed UUIDs for integration testing
 * @param { import('knex').Knex } knex
 */

// Fixed UUIDs for consistent testing
const PRODUCT_TYPE_SIMPLE_ID = '30000000-0000-0000-0000-000000000001';
const PRODUCT_TYPE_CONFIGURABLE_ID = '30000000-0000-0000-0000-000000000002';
const PRODUCT_TYPE_VIRTUAL_ID = '30000000-0000-0000-0000-000000000003';

const ATTRIBUTE_SET_DEFAULT_ID = '40000000-0000-0000-0000-000000000001';
const ATTRIBUTE_SET_APPAREL_ID = '40000000-0000-0000-0000-000000000002';
const ATTRIBUTE_SET_ELECTRONICS_ID = '40000000-0000-0000-0000-000000000003';

const ATTRIBUTE_COLOR_ID = '50000000-0000-0000-0000-000000000001';
const ATTRIBUTE_SIZE_ID = '50000000-0000-0000-0000-000000000002';
const ATTRIBUTE_MATERIAL_ID = '50000000-0000-0000-0000-000000000003';
const ATTRIBUTE_WEIGHT_ID = '50000000-0000-0000-0000-000000000004';
const ATTRIBUTE_BRAND_ID = '50000000-0000-0000-0000-000000000005';
const ATTRIBUTE_SCREEN_SIZE_ID = '50000000-0000-0000-0000-000000000006';
const ATTRIBUTE_RAM_ID = '50000000-0000-0000-0000-000000000007';
const ATTRIBUTE_STORAGE_ID = '50000000-0000-0000-0000-000000000008';

const ATTRIBUTE_VALUE_RED_ID = '60000000-0000-0000-0000-000000000001';
const ATTRIBUTE_VALUE_BLUE_ID = '60000000-0000-0000-0000-000000000002';
const ATTRIBUTE_VALUE_BLACK_ID = '60000000-0000-0000-0000-000000000003';
const ATTRIBUTE_VALUE_WHITE_ID = '60000000-0000-0000-0000-000000000004';
const ATTRIBUTE_VALUE_SIZE_XS_ID = '60000000-0000-0000-0000-000000000010';
const ATTRIBUTE_VALUE_SIZE_S_ID = '60000000-0000-0000-0000-000000000011';
const ATTRIBUTE_VALUE_SIZE_M_ID = '60000000-0000-0000-0000-000000000012';
const ATTRIBUTE_VALUE_SIZE_L_ID = '60000000-0000-0000-0000-000000000013';
const ATTRIBUTE_VALUE_SIZE_XL_ID = '60000000-0000-0000-0000-000000000014';

const ATTRIBUTE_GROUP_BASIC_ID = '70000000-0000-0000-0000-000000000001';
const ATTRIBUTE_GROUP_PHYSICAL_ID = '70000000-0000-0000-0000-000000000002';
const ATTRIBUTE_GROUP_TECH_ID = '70000000-0000-0000-0000-000000000003';

// Test product IDs (from existing seed)
const TEST_PRODUCT_1_ID = '10000000-0000-0000-0000-000000000001';
const TEST_PRODUCT_2_ID = '10000000-0000-0000-0000-000000000002';
const TEST_PRODUCT_3_ID = '10000000-0000-0000-0000-000000000003';

exports.seed = async function(knex) {
  // Clean up existing test data
  await exports.down(knex);
  
  // ==================== PRODUCT TYPES ====================
  // Note: productType table only has: productTypeId, name, slug, createdAt, updatedAt
  await knex('productType').insert([
    {
      productTypeId: PRODUCT_TYPE_SIMPLE_ID,
      name: 'Simple Product Test',
      slug: 'simple-test'
    },
    {
      productTypeId: PRODUCT_TYPE_CONFIGURABLE_ID,
      name: 'Configurable Product Test',
      slug: 'configurable-test'
    },
    {
      productTypeId: PRODUCT_TYPE_VIRTUAL_ID,
      name: 'Virtual Product Test',
      slug: 'virtual-test'
    }
  ]).onConflict('productTypeId').merge();

  // ==================== ATTRIBUTE GROUPS ====================
  await knex('productAttributeGroup').insert([
    {
      productAttributeGroupId: ATTRIBUTE_GROUP_BASIC_ID,
      name: 'Basic Attributes',
      code: 'basic-test',
      description: 'Basic product attributes for testing',
      position: 10,
      isVisible: true,
      isComparable: true,
      isGlobal: true
    },
    {
      productAttributeGroupId: ATTRIBUTE_GROUP_PHYSICAL_ID,
      name: 'Physical Properties',
      code: 'physical-test',
      description: 'Physical properties for testing',
      position: 20,
      isVisible: true,
      isComparable: true,
      isGlobal: true
    },
    {
      productAttributeGroupId: ATTRIBUTE_GROUP_TECH_ID,
      name: 'Technical Specs',
      code: 'tech-test',
      description: 'Technical specifications for electronics',
      position: 30,
      isVisible: true,
      isComparable: true,
      isGlobal: true
    }
  ]).onConflict('productAttributeGroupId').merge();

  // ==================== ATTRIBUTES ====================
  await knex('productAttribute').insert([
    {
      productAttributeId: ATTRIBUTE_COLOR_ID,
      name: 'Color',
      code: 'color-test',
      description: 'Product color for testing',
      groupId: ATTRIBUTE_GROUP_BASIC_ID,
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
      position: 10,
      isGlobal: true
    },
    {
      productAttributeId: ATTRIBUTE_SIZE_ID,
      name: 'Size',
      code: 'size-test',
      description: 'Product size for testing',
      groupId: ATTRIBUTE_GROUP_BASIC_ID,
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
      position: 20,
      isGlobal: true
    },
    {
      productAttributeId: ATTRIBUTE_MATERIAL_ID,
      name: 'Material',
      code: 'material-test',
      description: 'Product material for testing',
      groupId: ATTRIBUTE_GROUP_PHYSICAL_ID,
      type: 'text',
      inputType: 'text',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: true,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      useForConfigurations: false,
      position: 10,
      isGlobal: true
    },
    {
      productAttributeId: ATTRIBUTE_WEIGHT_ID,
      name: 'Weight (g)',
      code: 'weight-test',
      description: 'Product weight in grams for testing',
      groupId: ATTRIBUTE_GROUP_PHYSICAL_ID,
      type: 'number',
      inputType: 'number',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: false,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      useForConfigurations: false,
      position: 20,
      validationRules: JSON.stringify({ minValue: 0, maxValue: 100000 }),
      isGlobal: true
    },
    {
      productAttributeId: ATTRIBUTE_BRAND_ID,
      name: 'Brand',
      code: 'brand-test',
      description: 'Product brand for testing',
      groupId: ATTRIBUTE_GROUP_BASIC_ID,
      type: 'text',
      inputType: 'text',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: true,
      isFilterable: true,
      isComparable: false,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      useForConfigurations: false,
      position: 30,
      isGlobal: true
    },
    {
      productAttributeId: ATTRIBUTE_SCREEN_SIZE_ID,
      name: 'Screen Size',
      code: 'screen-size-test',
      description: 'Screen size in inches for electronics',
      groupId: ATTRIBUTE_GROUP_TECH_ID,
      type: 'number',
      inputType: 'number',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: false,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      useForConfigurations: false,
      position: 10,
      validationRules: JSON.stringify({ minValue: 1, maxValue: 100 }),
      isGlobal: true
    },
    {
      productAttributeId: ATTRIBUTE_RAM_ID,
      name: 'RAM',
      code: 'ram-test',
      description: 'RAM in GB for electronics',
      groupId: ATTRIBUTE_GROUP_TECH_ID,
      type: 'select',
      inputType: 'select',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: false,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: true,
      useForConfigurations: true,
      position: 20,
      isGlobal: true
    },
    {
      productAttributeId: ATTRIBUTE_STORAGE_ID,
      name: 'Storage',
      code: 'storage-test',
      description: 'Storage capacity for electronics',
      groupId: ATTRIBUTE_GROUP_TECH_ID,
      type: 'select',
      inputType: 'select',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: false,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: true,
      useForConfigurations: true,
      position: 30,
      isGlobal: true
    }
  ]).onConflict('productAttributeId').merge();

  // ==================== ATTRIBUTE VALUES ====================
  await knex('productAttributeValue').insert([
    // Colors
    { productAttributeValueId: ATTRIBUTE_VALUE_RED_ID, attributeId: ATTRIBUTE_COLOR_ID, value: 'red', displayValue: 'Red', position: 10, isDefault: false },
    { productAttributeValueId: ATTRIBUTE_VALUE_BLUE_ID, attributeId: ATTRIBUTE_COLOR_ID, value: 'blue', displayValue: 'Blue', position: 20, isDefault: false },
    { productAttributeValueId: ATTRIBUTE_VALUE_BLACK_ID, attributeId: ATTRIBUTE_COLOR_ID, value: 'black', displayValue: 'Black', position: 30, isDefault: true },
    { productAttributeValueId: ATTRIBUTE_VALUE_WHITE_ID, attributeId: ATTRIBUTE_COLOR_ID, value: 'white', displayValue: 'White', position: 40, isDefault: false },
    // Sizes
    { productAttributeValueId: ATTRIBUTE_VALUE_SIZE_XS_ID, attributeId: ATTRIBUTE_SIZE_ID, value: 'xs', displayValue: 'XS', position: 10, isDefault: false },
    { productAttributeValueId: ATTRIBUTE_VALUE_SIZE_S_ID, attributeId: ATTRIBUTE_SIZE_ID, value: 's', displayValue: 'S', position: 20, isDefault: false },
    { productAttributeValueId: ATTRIBUTE_VALUE_SIZE_M_ID, attributeId: ATTRIBUTE_SIZE_ID, value: 'm', displayValue: 'M', position: 30, isDefault: true },
    { productAttributeValueId: ATTRIBUTE_VALUE_SIZE_L_ID, attributeId: ATTRIBUTE_SIZE_ID, value: 'l', displayValue: 'L', position: 40, isDefault: false },
    { productAttributeValueId: ATTRIBUTE_VALUE_SIZE_XL_ID, attributeId: ATTRIBUTE_SIZE_ID, value: 'xl', displayValue: 'XL', position: 50, isDefault: false },
    // RAM options
    { attributeId: ATTRIBUTE_RAM_ID, value: '4', displayValue: '4 GB', position: 10, isDefault: false },
    { attributeId: ATTRIBUTE_RAM_ID, value: '8', displayValue: '8 GB', position: 20, isDefault: true },
    { attributeId: ATTRIBUTE_RAM_ID, value: '16', displayValue: '16 GB', position: 30, isDefault: false },
    { attributeId: ATTRIBUTE_RAM_ID, value: '32', displayValue: '32 GB', position: 40, isDefault: false },
    // Storage options
    { attributeId: ATTRIBUTE_STORAGE_ID, value: '128', displayValue: '128 GB', position: 10, isDefault: false },
    { attributeId: ATTRIBUTE_STORAGE_ID, value: '256', displayValue: '256 GB', position: 20, isDefault: true },
    { attributeId: ATTRIBUTE_STORAGE_ID, value: '512', displayValue: '512 GB', position: 30, isDefault: false },
    { attributeId: ATTRIBUTE_STORAGE_ID, value: '1024', displayValue: '1 TB', position: 40, isDefault: false }
  ]).onConflict('productAttributeValueId').ignore();

  // ==================== ATTRIBUTE SETS ====================
  await knex('productAttributeSet').insert([
    {
      productAttributeSetId: ATTRIBUTE_SET_DEFAULT_ID,
      productTypeId: PRODUCT_TYPE_SIMPLE_ID,
      name: 'Default',
      code: 'default-test',
      description: 'Default attribute set for simple products',
      isActive: true,
      isGlobal: true
    },
    {
      productAttributeSetId: ATTRIBUTE_SET_APPAREL_ID,
      productTypeId: PRODUCT_TYPE_CONFIGURABLE_ID,
      name: 'Apparel',
      code: 'apparel-test',
      description: 'Attribute set for clothing and apparel',
      isActive: true,
      isGlobal: true
    },
    {
      productAttributeSetId: ATTRIBUTE_SET_ELECTRONICS_ID,
      productTypeId: PRODUCT_TYPE_CONFIGURABLE_ID,
      name: 'Electronics',
      code: 'electronics-test',
      description: 'Attribute set for electronic products',
      isActive: true,
      isGlobal: true
    }
  ]).onConflict('productAttributeSetId').merge();

  // ==================== ATTRIBUTE SET MAPPINGS ====================
  await knex('productAttributeSetMapping').insert([
    // Default set - basic attributes
    { attributeSetId: ATTRIBUTE_SET_DEFAULT_ID, attributeId: ATTRIBUTE_COLOR_ID, position: 10, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_DEFAULT_ID, attributeId: ATTRIBUTE_MATERIAL_ID, position: 20, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_DEFAULT_ID, attributeId: ATTRIBUTE_WEIGHT_ID, position: 30, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_DEFAULT_ID, attributeId: ATTRIBUTE_BRAND_ID, position: 40, isRequired: false },
    // Apparel set - color, size, material
    { attributeSetId: ATTRIBUTE_SET_APPAREL_ID, attributeId: ATTRIBUTE_COLOR_ID, position: 10, isRequired: true },
    { attributeSetId: ATTRIBUTE_SET_APPAREL_ID, attributeId: ATTRIBUTE_SIZE_ID, position: 20, isRequired: true },
    { attributeSetId: ATTRIBUTE_SET_APPAREL_ID, attributeId: ATTRIBUTE_MATERIAL_ID, position: 30, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_APPAREL_ID, attributeId: ATTRIBUTE_WEIGHT_ID, position: 40, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_APPAREL_ID, attributeId: ATTRIBUTE_BRAND_ID, position: 50, isRequired: false },
    // Electronics set - tech specs
    { attributeSetId: ATTRIBUTE_SET_ELECTRONICS_ID, attributeId: ATTRIBUTE_COLOR_ID, position: 10, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_ELECTRONICS_ID, attributeId: ATTRIBUTE_BRAND_ID, position: 20, isRequired: true },
    { attributeSetId: ATTRIBUTE_SET_ELECTRONICS_ID, attributeId: ATTRIBUTE_SCREEN_SIZE_ID, position: 30, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_ELECTRONICS_ID, attributeId: ATTRIBUTE_RAM_ID, position: 40, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_ELECTRONICS_ID, attributeId: ATTRIBUTE_STORAGE_ID, position: 50, isRequired: false },
    { attributeSetId: ATTRIBUTE_SET_ELECTRONICS_ID, attributeId: ATTRIBUTE_WEIGHT_ID, position: 60, isRequired: false }
  ]);

  // ==================== PRODUCT ATTRIBUTE VALUES (assign to test products) ====================
  // Note: productAttributeValueMap has: productAttributeValueMapId, productId, productVariantId, 
  // attributeId, value, valueText, valueNumeric, valueBoolean, valueJson, valueDate, isSystem, language
  // Check if test products exist before assigning attributes
  const testProducts = await knex('product')
    .whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID])
    .select('productId');

  if (testProducts.length > 0) {
    const productIds = testProducts.map(p => p.productId);
    
    const productAttributeData = [];
    
    if (productIds.includes(TEST_PRODUCT_1_ID)) {
      productAttributeData.push(
        { productId: TEST_PRODUCT_1_ID, attributeId: ATTRIBUTE_COLOR_ID, value: 'blue', valueText: 'Blue' },
        { productId: TEST_PRODUCT_1_ID, attributeId: ATTRIBUTE_SIZE_ID, value: 'm', valueText: 'M' },
        { productId: TEST_PRODUCT_1_ID, attributeId: ATTRIBUTE_MATERIAL_ID, value: 'Cotton', valueText: 'Cotton' },
        { productId: TEST_PRODUCT_1_ID, attributeId: ATTRIBUTE_WEIGHT_ID, value: '250', valueNumeric: 250 },
        { productId: TEST_PRODUCT_1_ID, attributeId: ATTRIBUTE_BRAND_ID, value: 'TestBrand', valueText: 'TestBrand' }
      );
    }
    
    if (productIds.includes(TEST_PRODUCT_2_ID)) {
      productAttributeData.push(
        { productId: TEST_PRODUCT_2_ID, attributeId: ATTRIBUTE_COLOR_ID, value: 'red', valueText: 'Red' },
        { productId: TEST_PRODUCT_2_ID, attributeId: ATTRIBUTE_SIZE_ID, value: 'l', valueText: 'L' },
        { productId: TEST_PRODUCT_2_ID, attributeId: ATTRIBUTE_MATERIAL_ID, value: 'Polyester', valueText: 'Polyester' },
        { productId: TEST_PRODUCT_2_ID, attributeId: ATTRIBUTE_WEIGHT_ID, value: '180', valueNumeric: 180 }
      );
    }
    
    if (productIds.includes(TEST_PRODUCT_3_ID)) {
      productAttributeData.push(
        { productId: TEST_PRODUCT_3_ID, attributeId: ATTRIBUTE_COLOR_ID, value: 'black', valueText: 'Black' },
        { productId: TEST_PRODUCT_3_ID, attributeId: ATTRIBUTE_BRAND_ID, value: 'TechBrand', valueText: 'TechBrand' },
        { productId: TEST_PRODUCT_3_ID, attributeId: ATTRIBUTE_SCREEN_SIZE_ID, value: '15.6', valueNumeric: 15.6 },
        { productId: TEST_PRODUCT_3_ID, attributeId: ATTRIBUTE_RAM_ID, value: '16', valueNumeric: 16 },
        { productId: TEST_PRODUCT_3_ID, attributeId: ATTRIBUTE_STORAGE_ID, value: '512', valueNumeric: 512 }
      );
    }
    
    if (productAttributeData.length > 0) {
      // Insert without conflict handling since there's no unique constraint on productId+attributeId
      for (const data of productAttributeData) {
        await knex('productAttributeValueMap')
          .insert(data)
          .onConflict()
          .ignore();
      }
    }
  }
};

exports.down = async function(knex) {
  // Clean up in reverse order
  await knex('productAttributeValueMap').whereIn('attributeId', [
    ATTRIBUTE_COLOR_ID, ATTRIBUTE_SIZE_ID, ATTRIBUTE_MATERIAL_ID, 
    ATTRIBUTE_WEIGHT_ID, ATTRIBUTE_BRAND_ID, ATTRIBUTE_SCREEN_SIZE_ID,
    ATTRIBUTE_RAM_ID, ATTRIBUTE_STORAGE_ID
  ]).delete();
  
  await knex('productAttributeSetMapping').whereIn('attributeSetId', [
    ATTRIBUTE_SET_DEFAULT_ID, ATTRIBUTE_SET_APPAREL_ID, ATTRIBUTE_SET_ELECTRONICS_ID
  ]).delete();
  
  await knex('productAttributeSet').whereIn('productAttributeSetId', [
    ATTRIBUTE_SET_DEFAULT_ID, ATTRIBUTE_SET_APPAREL_ID, ATTRIBUTE_SET_ELECTRONICS_ID
  ]).delete();
  
  await knex('productAttributeValue').whereIn('attributeId', [
    ATTRIBUTE_COLOR_ID, ATTRIBUTE_SIZE_ID, ATTRIBUTE_RAM_ID, ATTRIBUTE_STORAGE_ID
  ]).delete();
  
  await knex('productAttribute').whereIn('productAttributeId', [
    ATTRIBUTE_COLOR_ID, ATTRIBUTE_SIZE_ID, ATTRIBUTE_MATERIAL_ID,
    ATTRIBUTE_WEIGHT_ID, ATTRIBUTE_BRAND_ID, ATTRIBUTE_SCREEN_SIZE_ID,
    ATTRIBUTE_RAM_ID, ATTRIBUTE_STORAGE_ID
  ]).delete();
  
  await knex('productAttributeGroup').whereIn('productAttributeGroupId', [
    ATTRIBUTE_GROUP_BASIC_ID, ATTRIBUTE_GROUP_PHYSICAL_ID, ATTRIBUTE_GROUP_TECH_ID
  ]).delete();
  
  await knex('productType').whereIn('productTypeId', [
    PRODUCT_TYPE_SIMPLE_ID, PRODUCT_TYPE_CONFIGURABLE_ID, PRODUCT_TYPE_VIRTUAL_ID
  ]).delete();
};

// Export IDs for use in tests
module.exports.PRODUCT_TYPE_SIMPLE_ID = PRODUCT_TYPE_SIMPLE_ID;
module.exports.PRODUCT_TYPE_CONFIGURABLE_ID = PRODUCT_TYPE_CONFIGURABLE_ID;
module.exports.PRODUCT_TYPE_VIRTUAL_ID = PRODUCT_TYPE_VIRTUAL_ID;
module.exports.ATTRIBUTE_SET_DEFAULT_ID = ATTRIBUTE_SET_DEFAULT_ID;
module.exports.ATTRIBUTE_SET_APPAREL_ID = ATTRIBUTE_SET_APPAREL_ID;
module.exports.ATTRIBUTE_SET_ELECTRONICS_ID = ATTRIBUTE_SET_ELECTRONICS_ID;
module.exports.ATTRIBUTE_COLOR_ID = ATTRIBUTE_COLOR_ID;
module.exports.ATTRIBUTE_SIZE_ID = ATTRIBUTE_SIZE_ID;
module.exports.ATTRIBUTE_MATERIAL_ID = ATTRIBUTE_MATERIAL_ID;
module.exports.ATTRIBUTE_WEIGHT_ID = ATTRIBUTE_WEIGHT_ID;
module.exports.ATTRIBUTE_BRAND_ID = ATTRIBUTE_BRAND_ID;
module.exports.ATTRIBUTE_SCREEN_SIZE_ID = ATTRIBUTE_SCREEN_SIZE_ID;
module.exports.ATTRIBUTE_RAM_ID = ATTRIBUTE_RAM_ID;
module.exports.ATTRIBUTE_STORAGE_ID = ATTRIBUTE_STORAGE_ID;
module.exports.ATTRIBUTE_VALUE_RED_ID = ATTRIBUTE_VALUE_RED_ID;
module.exports.ATTRIBUTE_VALUE_BLUE_ID = ATTRIBUTE_VALUE_BLUE_ID;
module.exports.ATTRIBUTE_VALUE_BLACK_ID = ATTRIBUTE_VALUE_BLACK_ID;
module.exports.ATTRIBUTE_VALUE_WHITE_ID = ATTRIBUTE_VALUE_WHITE_ID;
module.exports.ATTRIBUTE_VALUE_SIZE_M_ID = ATTRIBUTE_VALUE_SIZE_M_ID;
module.exports.ATTRIBUTE_GROUP_BASIC_ID = ATTRIBUTE_GROUP_BASIC_ID;
module.exports.ATTRIBUTE_GROUP_PHYSICAL_ID = ATTRIBUTE_GROUP_PHYSICAL_ID;
module.exports.ATTRIBUTE_GROUP_TECH_ID = ATTRIBUTE_GROUP_TECH_ID;
