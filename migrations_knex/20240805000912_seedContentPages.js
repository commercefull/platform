/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('contentPage').insert({
    title: 'Home',
    slug: 'home',
    contentTypeId: knex('contentType').select('id').where('slug', 'page'),
    templateId: knex('contentTemplate').select('id').where('slug', 'standard-page'),
    status: 'published',
    path: '/home',
    isHomePage: true,
    metaTitle: 'Welcome to Our Store'
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('contentPage').where({ slug: 'home', isHomePage: true }).delete();
};
