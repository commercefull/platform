/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('contentTemplate').insert([
    {
      name: 'Standard Page',
      slug: 'standard-page',
      description: 'Default single column page layout',
      isSystem: true,
      areas: JSON.stringify({ areas: ['main'] }),
    },
    {
      name: 'Blog Post',
      slug: 'blog-post',
      description: 'Standard blog post layout with featured image',
      isSystem: true,
      areas: JSON.stringify({ areas: ['featured', 'main', 'sidebar'] }),
    },
    {
      name: 'Two Column',
      slug: 'two-column',
      description: 'Two column layout with sidebar',
      isSystem: true,
      areas: JSON.stringify({ areas: ['header', 'main', 'sidebar', 'footer'] }),
    },
    {
      name: 'Landing Page',
      slug: 'landing-page',
      description: 'Full width marketing landing page',
      isSystem: true,
      areas: JSON.stringify({ areas: ['header', 'main', 'cta', 'footer'] }),
    },
    {
      name: 'Product Detail',
      slug: 'product-detail',
      description: 'Product detail page with image gallery',
      isSystem: true,
      areas: JSON.stringify({ areas: ['images', 'details', 'description', 'related'] }),
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('contentTemplate').whereIn('slug', ['standard-page', 'blog-post', 'two-column', 'landing-page', 'product-detail']).delete();
};
