/**
 * Seed test products with fixed UUIDs for integration testing
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  // Fixed UUIDs for test products
  const TEST_PRODUCT_1_ID = '10000000-0000-0000-0000-000000000001';
  const TEST_PRODUCT_2_ID = '10000000-0000-0000-0000-000000000002';
  const TEST_PRODUCT_3_ID = '10000000-0000-0000-0000-000000000003';
  const TEST_VARIANT_1_ID = '20000000-0000-0000-0000-000000000001';
  const TEST_VARIANT_2_ID = '20000000-0000-0000-0000-000000000002';

  // Get required references
  const genericBrand = await knex('productBrand').where({ slug: 'generic' }).first('productBrandId');
  const acmeBrand = await knex('productBrand').where({ slug: 'acme-corporation' }).first('productBrandId');
  const electronicsCategory = await knex('productCategory').where({ slug: 'electronics' }).first('productCategoryId');
  const fashionCategory = await knex('productCategory').where({ slug: 'fashion' }).first('productCategoryId');

  // Clean up existing test data
  await knex('productVariant').whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID]).delete();
  await knex('productCategoryMap').whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID]).delete();
  await knex('productImage').whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID]).delete();
  await knex('product').whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID]).delete();

  // Insert test products
  await knex('product').insert([
    {
      productId: TEST_PRODUCT_1_ID,
      sku: 'TEST-PROD-001',
      name: 'Test Product One',
      slug: 'test-product-one',
      description: 'This is the first test product for integration testing.',
      shortDescription: 'First test product',
      brandId: genericBrand?.productBrandId || null,
      type: 'simple',
      status: 'active',
      visibility: 'visible',
      price: 99.99,
      basePrice: 99.99,
      salePrice: 79.99,
      costPrice: 50.00,
      weight: 500,
      weightUnit: 'g',
      length: 10,
      width: 5,
      height: 2,
      dimensionUnit: 'cm',
      isInventoryManaged: true,
      isFeatured: true,
      isNew: true,
      isBestseller: false,
      hasVariants: false,
      isTaxable: true,
      taxClass: 'standard',
      isVirtual: false,
      isDownloadable: false,
      isSubscription: false
    },
    {
      productId: TEST_PRODUCT_2_ID,
      sku: 'TEST-PROD-002',
      name: 'Test Product Two',
      slug: 'test-product-two',
      description: 'This is the second test product with variants.',
      shortDescription: 'Second test product with variants',
      brandId: acmeBrand?.productBrandId || genericBrand?.productBrandId || null,
      type: 'configurable',
      status: 'active',
      visibility: 'visible',
      price: 149.99,
      basePrice: 149.99,
      salePrice: null,
      costPrice: 75.00,
      weight: 1000,
      weightUnit: 'g',
      length: 20,
      width: 10,
      height: 5,
      dimensionUnit: 'cm',
      isInventoryManaged: true,
      isFeatured: false,
      isNew: false,
      isBestseller: true,
      hasVariants: true,
      isTaxable: true,
      taxClass: 'standard',
      isVirtual: false,
      isDownloadable: false,
      isSubscription: false,
      variantAttributes: JSON.stringify(['color', 'size'])
    },
    {
      productId: TEST_PRODUCT_3_ID,
      sku: 'TEST-PROD-003',
      name: 'Test Virtual Product',
      slug: 'test-virtual-product',
      description: 'This is a virtual/downloadable test product.',
      shortDescription: 'Virtual test product',
      brandId: null,
      type: 'virtual',
      status: 'draft',
      visibility: 'not_visible',
      price: 29.99,
      basePrice: 29.99,
      salePrice: null,
      costPrice: 0,
      weight: null,
      weightUnit: null,
      length: null,
      width: null,
      height: null,
      dimensionUnit: null,
      isInventoryManaged: false,
      isFeatured: false,
      isNew: false,
      isBestseller: false,
      hasVariants: false,
      isTaxable: true,
      taxClass: 'digital',
      isVirtual: true,
      isDownloadable: true,
      isSubscription: false
    }
  ]);

  // Link products to categories
  if (electronicsCategory) {
    await knex('productCategoryMap').insert([
      { productId: TEST_PRODUCT_1_ID, productCategoryId: electronicsCategory.productCategoryId, isPrimary: true },
      { productId: TEST_PRODUCT_2_ID, productCategoryId: electronicsCategory.productCategoryId, isPrimary: true }
    ]);
  }

  if (fashionCategory) {
    await knex('productCategoryMap').insert([
      { productId: TEST_PRODUCT_2_ID, productCategoryId: fashionCategory.productCategoryId, isPrimary: false }
    ]).onConflict().ignore();
  }

  // Insert test variants for product 2
  await knex('productVariant').insert([
    {
      productVariantId: TEST_VARIANT_1_ID,
      productId: TEST_PRODUCT_2_ID,
      sku: 'TEST-PROD-002-RED-M',
      name: 'Red Medium',
      status: 'active',
      price: 149.99,
      compareAtPrice: null,
      weight: 1000,
      isDefault: true,
      position: 0,
      barcode: '1234567890123',
      optionValues: JSON.stringify({ color: 'red', size: 'm' })
    },
    {
      productVariantId: TEST_VARIANT_2_ID,
      productId: TEST_PRODUCT_2_ID,
      sku: 'TEST-PROD-002-BLUE-L',
      name: 'Blue Large',
      status: 'active',
      price: 159.99,
      compareAtPrice: 179.99,
      weight: 1100,
      isDefault: false,
      position: 1,
      barcode: '1234567890124',
      optionValues: JSON.stringify({ color: 'blue', size: 'l' })
    }
  ]);

  console.log('✓ Product test data seeded successfully');
};
