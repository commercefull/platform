exports.up = function(knex) {
  return knex.schema.createTable('productCollection', t => {
    t.uuid('productCollectionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.string('slug', 255).unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isAutomated').notNullable().defaultTo(false);
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.text('imageUrl');
    t.text('bannerUrl');
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.jsonb('conditions');
    t.string('sortOrder', 50).defaultTo('manual');
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    

    t.index('slug');
    t.index('isActive');
    t.index('isAutomated');
    t.index('isFeatured');
    t.index('merchantId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productCollection');
};
