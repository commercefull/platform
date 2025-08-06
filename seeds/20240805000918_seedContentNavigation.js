/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('contentNavigation').insert([
    { name: 'Main Menu', slug: 'main-menu', location: 'header' },
    { name: 'Footer Menu', slug: 'footer-menu', location: 'footer' },
    { name: 'Account Menu', slug: 'account-menu', location: 'account' }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('contentNavigation').whereIn('slug', [
    'main-menu', 'footer-menu', 'account-menu'
  ]).delete();
};
