/**
 * Seed test products with fixed UUIDs for integration testing
 * @param { import('knex').Knex } knex
 */
exports.seed = async function (knex) {
  // Fixed UUIDs for test products (aligned with seedIntegrationTestData.js)
  const TEST_PRODUCT_1_ID = '00000000-0000-0000-0000-000000000001';
  const TEST_PRODUCT_2_ID = '00000000-0000-0000-0000-000000000002';
  const TEST_PRODUCT_3_ID = '00000000-0000-0000-0000-000000000003';
  const TEST_VARIANT_1_ID = '20000000-0000-0000-0000-000000000001';
  const TEST_VARIANT_2_ID = '20000000-0000-0000-0000-000000000002';

  // Get required references
  const electronicsCategory = await knex('productCategory').where({ slug: 'electronics' }).first('productCategoryId');
  const fashionCategory = await knex('productCategory').where({ slug: 'fashion' }).first('productCategoryId');

  // Check if products already exist
  const existingProducts = await knex('product')
    .whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID])
    .select('productId');
  const existingIds = existingProducts.map(p => p.productId);

  // Only delete and re-insert variants/images if products don't exist yet
  if (existingIds.length === 0) {
    await knex('productBasePrice').whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID]).delete();
    await knex('productVariant').whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID]).delete();
    await knex('productCategoryMap').whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID]).delete();
    await knex('productImage').whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID, TEST_PRODUCT_3_ID]).delete();
  }

  // Insert test products
  await knex('product')
    .insert([
      {
        productId: TEST_PRODUCT_1_ID,
        sku: 'TEST-PROD-001',
        name: 'Test Product One',
        slug: 'test-product-one',
        description: 'This is the first test product for integration testing.',
        shortDescription: 'First test product',
        type: 'simple',
        status: 'active',
        visibility: 'visible',
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
        isSubscription: false,
      },
      {
        productId: TEST_PRODUCT_2_ID,
        sku: 'TEST-PROD-002',
        name: 'Test Product Two',
        slug: 'test-product-two',
        description: 'This is the second test product with variants.',
        shortDescription: 'Second test product with variants',
        type: 'configurable',
        status: 'active',
        visibility: 'visible',
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
        variantAttributes: JSON.stringify(['color', 'size']),
      },
      {
        productId: TEST_PRODUCT_3_ID,
        sku: 'TEST-PROD-003',
        name: 'Test Virtual Product',
        slug: 'test-virtual-product',
        description: 'This is a virtual/downloadable test product.',
        shortDescription: 'Virtual test product',
        type: 'virtual',
        status: 'draft',
        visibility: 'not_visible',
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
        isSubscription: false,
      },
    ])
    .onConflict('productId')
    .ignore();

  // Catalog base prices live in the pricing-owned store (integer cents)
  await knex('productBasePrice')
    .insert([
      {
        productId: TEST_PRODUCT_1_ID,
        currencyCode: 'USD',
        priceCents: 9999,
        salePriceCents: 7999,
        costPriceCents: 5000,
      },
      {
        productId: TEST_PRODUCT_2_ID,
        currencyCode: 'USD',
        priceCents: 14999,
        salePriceCents: null,
        costPriceCents: 7500,
      },
      {
        productId: TEST_PRODUCT_3_ID,
        currencyCode: 'USD',
        priceCents: 2999,
        salePriceCents: null,
        costPriceCents: 0,
      },
    ])
    .onConflict(['productId', 'productVariantId', 'currencyCode'])
    .ignore();

  // Link products to categories
  if (electronicsCategory) {
    await knex('productCategoryMap')
      .insert([
        { productId: TEST_PRODUCT_1_ID, productCategoryId: electronicsCategory.productCategoryId, isPrimary: true },
        { productId: TEST_PRODUCT_2_ID, productCategoryId: electronicsCategory.productCategoryId, isPrimary: true },
      ])
      .onConflict()
      .ignore();
  }

  if (fashionCategory) {
    await knex('productCategoryMap')
      .insert([{ productId: TEST_PRODUCT_2_ID, productCategoryId: fashionCategory.productCategoryId, isPrimary: false }])
      .onConflict()
      .ignore();
  }

  // Insert test variants for product 2
  await knex('productVariant')
    .insert([
      {
        productVariantId: TEST_VARIANT_1_ID,
        productId: TEST_PRODUCT_2_ID,
        sku: 'TEST-PROD-002-RED-M',
        name: 'Red Medium',
        status: 'active',
        weight: 1000,
        isDefault: true,
        position: 0,
        barcode: '1234567890123',
        optionValues: JSON.stringify({ color: 'red', size: 'm' }),
      },
      {
        productVariantId: TEST_VARIANT_2_ID,
        productId: TEST_PRODUCT_2_ID,
        sku: 'TEST-PROD-002-BLUE-L',
        name: 'Blue Large',
        status: 'active',
        weight: 1100,
        isDefault: false,
        position: 1,
        barcode: '1234567890124',
        optionValues: JSON.stringify({ color: 'blue', size: 'l' }),
      },
    ])
    .onConflict('productVariantId')
    .ignore();

  // Variant-level base prices (pricing-owned, integer cents)
  await knex('productBasePrice')
    .insert([
      {
        productId: TEST_PRODUCT_2_ID,
        productVariantId: TEST_VARIANT_1_ID,
        currencyCode: 'USD',
        priceCents: 14999,
        compareAtPriceCents: null,
      },
      {
        productId: TEST_PRODUCT_2_ID,
        productVariantId: TEST_VARIANT_2_ID,
        currencyCode: 'USD',
        priceCents: 15999,
        compareAtPriceCents: 17999,
      },
    ])
    .onConflict(['productId', 'productVariantId', 'currencyCode'])
    .ignore();
};
