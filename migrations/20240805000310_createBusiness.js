/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('business', t => {
    t.uuid('businessId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('slug', 150).notNullable().unique();
    t.text('description');
    t.enum('businessType', ['marketplace', 'multi_store', 'single_store']).notNullable().defaultTo('single_store');
    t.string('domain', 255);
    t.text('logo');
    t.text('favicon');
    t.string('primaryColor', 7);
    t.string('secondaryColor', 7);
    t.string('theme', 50);
    t.jsonb('colorScheme');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('allowMultipleStores').notNullable().defaultTo(false);
    t.boolean('allowMultipleWarehouses').notNullable().defaultTo(false);
    t.boolean('enableMarketplace').notNullable().defaultTo(false);
    t.string('defaultCurrency', 3).notNullable().defaultTo('USD');
    t.string('defaultLanguage', 5).notNullable().defaultTo('en');
    t.string('timezone', 50).notNullable().defaultTo('UTC');
    t.jsonb('metadata');

    t.index('businessType');
    t.index('isActive');
    t.index('slug');
    t.index('domain');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('business');
};
