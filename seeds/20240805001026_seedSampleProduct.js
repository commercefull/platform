/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Get brand and category IDs
  const genericBrand = await knex('product_brand').where({ slug: 'generic' }).first('id');
  const electronicsCategory = await knex('product_category').where({ slug: 'electronics' }).first('id');

  if (!genericBrand || !electronicsCategory) {
    throw new Error('Required seed data (brand/category) not found');
  }

  // Insert sample product
  const [sampleProduct] = await knex('product').insert({
    sku: 'SAMPLE-001',
    name: 'Sample Product',
    slug: 'sample-product',
    description: 'This is a detailed description of the sample product.',
    short_description: 'A short description of the sample product.',
    brand_id: genericBrand.id,
    type: 'simple',
    status: 'active',
    price: 19.99,
    weight: 500,
    is_inventory_managed: true,
    is_featured: true
  }).returning('id');

  // Link product to category
  return knex('product_to_category').insert({
    product_id: sampleProduct.id,
    category_id: electronicsCategory.id,
    is_primary: true
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const sampleProduct = await knex('product').where({ sku: 'SAMPLE-001' }).first('id');
  if (sampleProduct) {
    await knex('product_to_category').where({ product_id: sampleProduct.id }).delete();
    await knex('product').where({ id: sampleProduct.id }).delete();
  }
};
