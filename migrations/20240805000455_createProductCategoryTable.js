exports.up = function(knex) {
  return knex.schema.createTable('productCategory', t => {
    t.uuid('productCategoryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 255).notNullable();
    t.string('slug', 255).unique();
    t.text('description');
    t.uuid('parentId').references('productCategoryId').inTable('productCategory');
    t.text('path');
    t.integer('depth').notNullable().defaultTo(0);
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.text('imageUrl');
    t.text('bannerUrl');
    t.text('iconUrl');
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.string('metaKeywords', 255);
    t.boolean('includeInMenu').notNullable().defaultTo(true);
    t.integer('productCount').notNullable().defaultTo(0);
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.boolean('isGlobal').notNullable().defaultTo(true);
    t.text('customLayout');
    t.jsonb('displaySettings');
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('slug');
    t.index('parentId');
    t.index('path');
    t.index('depth');
    t.index('position');
    t.index('isActive');
    t.index('isFeatured');
    t.index('includeInMenu');
    t.index('merchantId');
    t.index('isGlobal');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productCategory');
};
