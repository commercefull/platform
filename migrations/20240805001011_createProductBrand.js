/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productBrand', t => {
    t.uuid('productBrandId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('slug', 150).notNullable().unique();
    t.text('description');
    t.text('logo');
    t.text('bannerImage');
    t.text('website');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.integer('position').defaultTo(0);
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.text('metaKeywords');
    t.text('content');
    t.string('countryOfOrigin', 2);
    t.integer('foundedYear');
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('name');
    t.index('slug');
    t.index('isActive');
    t.index('isFeatured');
    t.index('position');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productBrand');
};
