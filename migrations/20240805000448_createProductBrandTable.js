exports.up = function (knex) {
  return knex.schema.createTable('productBrand', t => {
    t.uuid('productBrandId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name', 255).notNullable();
    t.string('slug', 255).unique();
    t.text('description');
    t.text('logoUrl');
    t.text('websiteUrl');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.string('metaKeywords', 255);
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.boolean('isGlobal').notNullable().defaultTo(true);
    t.integer('sortOrder').notNullable().defaultTo(0);

    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deletedAt');

    t.index('slug');
    t.index('isActive');
    t.index('isFeatured');
    t.index('merchantId');
    t.index('isGlobal');
    t.index('deletedAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('productBrand');
};
