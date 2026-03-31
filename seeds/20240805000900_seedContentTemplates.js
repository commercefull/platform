/**
 * Seed: Default content templates
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const templates = [
    { slug: 'standard-page', name: 'Standard Page', description: 'Default single column page layout', areas: JSON.stringify({ areas: ['main'] }) },
    { slug: 'blog-post', name: 'Blog Post', description: 'Standard blog post layout with featured image', areas: JSON.stringify({ areas: ['featured', 'main', 'sidebar'] }) },
    { slug: 'two-column', name: 'Two Column', description: 'Two column layout with sidebar', areas: JSON.stringify({ areas: ['header', 'main', 'sidebar', 'footer'] }) },
    { slug: 'landing-page', name: 'Landing Page', description: 'Full width marketing landing page', areas: JSON.stringify({ areas: ['header', 'main', 'cta', 'footer'] }) },
    { slug: 'product-detail', name: 'Product Detail', description: 'Product detail page with image gallery', areas: JSON.stringify({ areas: ['images', 'details', 'description', 'related'] }) },
  ];

  for (const template of templates) {
    const existing = await knex('contentTemplate').where({ slug: template.slug }).first();
    if (!existing) {
      await knex('contentTemplate').insert({ ...template, isSystem: true });
    }
  }
};
