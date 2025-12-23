/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('contentPage').insert({
    title: 'Home',
    slug: 'home',
    contentTypeId: knex('contentType').select('contentTypeId').where('slug', 'page'),
    templateId: knex('contentTemplate').select('contentTemplateId').where('slug', 'standard-page'),
    status: 'published',
    path: '/home',
    isHomePage: true,
    metaTitle: 'Welcome to Our Store',
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('contentPage').where({ slug: 'home', isHomePage: true }).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
