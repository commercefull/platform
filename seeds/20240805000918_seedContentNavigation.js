/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const NAV_ITEMS = [
  { name: 'Main Menu', slug: 'main-menu', location: 'header' },
  { name: 'Footer Menu', slug: 'footer-menu', location: 'footer' },
  { name: 'Account Menu', slug: 'account-menu', location: 'account' }
];

exports.up = function (knex) {
  return knex('contentNavigation').insert(NAV_ITEMS);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('contentNavigation').whereIn('slug', NAV_ITEMS.map(item => item.slug)).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
