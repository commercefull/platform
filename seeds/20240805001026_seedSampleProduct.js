/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Get brand and category IDs
  const genericBrand = await knex('productBrand').where({ slug: 'generic' }).first('productBrandId');
  const electronicsCategory = await knex('productCategory').where({ slug: 'electronics' }).first('productCategoryId');

  if (!genericBrand || !electronicsCategory) {
    throw new Error('Required seed data (brand/category) not found');
  }

  // Insert sample product
  const [sampleProduct] = await knex('product').insert({
    sku: 'SAMPLE-001',
    name: 'Sample Product',
    slug: 'sample-product',
    description: 'This is a detailed description of the sample product.',
    shortDescription: 'A short description of the sample product.',
    brandId: genericBrand.productBrandId,
    type: 'simple',
    status: 'active',
    visibility: 'visible',
    price: 19.99,
    weight: 500,
    weightUnit: 'g',
    isInventoryManaged: true,
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    hasVariants: false,
    isFeatured: true
  }).returning(['productId']);

  // Link product to category
  const productId = sampleProduct.productId ?? sampleProduct;
  return knex('productCategoryMap').insert({
    productId,
    productCategoryId: electronicsCategory.productCategoryId,
    isPrimary: true
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const sampleProduct = await knex('product').where({ sku: 'SAMPLE-001' }).first('productId');
  if (sampleProduct) {
    await knex('productCategoryMap').where({ productId: sampleProduct.productId }).delete();
    await knex('product').where({ productId: sampleProduct.productId }).delete();
  }
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
