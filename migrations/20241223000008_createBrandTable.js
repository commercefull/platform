/**
 * Migration: Create Brand Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('brand');
  if (hasTable) return;

  await knex.schema.createTable('brand', table => {
    table.uuid('brandId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.text('description');
    table.string('logoMediaId');
    table.string('coverImageMediaId');
    table.string('website');
    table.string('countryOfOrigin');
    table.boolean('isActive').defaultTo(true);
    table.boolean('isFeatured').defaultTo(false);
    table.integer('sortOrder').defaultTo(0);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['isActive']);
    table.index(['isFeatured']);
    table.index(['slug']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('brand');
};
