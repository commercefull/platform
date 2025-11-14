/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('contentType').insert([
    { name: 'Page', slug: 'page', description: 'Standard web page content', isSystem: true },
    { name: 'Blog Post', slug: 'blog-post', description: 'Blog article content', isSystem: true },
    { name: 'Product Page', slug: 'product-page', description: 'Content for product detail pages', isSystem: true },
    { name: 'Category Page', slug: 'category-page', description: 'Content for product category pages', isSystem: true },
    { name: 'Landing Page', slug: 'landing-page', description: 'Special promotional landing pages', isSystem: true }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('contentType').whereIn('slug', [
    'page', 'blog-post', 'product-page', 'category-page', 'landing-page'
  ]).delete();
};

exports.seed = async function (knex) {
  // Skip delete to avoid foreign key constraint violations from contentPage
  const existing = await knex('contentType').whereIn('slug', [
    'page', 'blog-post', 'product-page', 'category-page', 'landing-page'
  ]).select('slug');
  
  if (existing.length === 0) {
    return exports.up(knex);
  }
};
