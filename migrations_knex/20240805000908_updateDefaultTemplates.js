/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const templates = [
    { contentTypeSlug: 'page', templateSlug: 'standard-page' },
    { contentTypeSlug: 'blog-post', templateSlug: 'blog-post' },
    { contentTypeSlug: 'product-page', templateSlug: 'product-detail' },
    { contentTypeSlug: 'category-page', templateSlug: 'two-column' },
    { contentTypeSlug: 'landing-page', templateSlug: 'landing-page' },
  ];

  for (const { contentTypeSlug, templateSlug } of templates) {
    await knex('contentType')
      .where('slug', contentTypeSlug)
      .update({
        defaultTemplate: knex('contentTemplate').select('id').where('slug', templateSlug),
      });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('contentType')
    .whereIn('slug', ['page', 'blog-post', 'product-page', 'category-page', 'landing-page'])
    .update({ defaultTemplate: null });
};
