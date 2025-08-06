exports.up = function(knex) {
  return knex.schema.createTable('productSeo', t => {
    t.uuid('productSeoId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE').unique();
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.string('metaKeywords', 255);
    t.string('ogTitle', 255);
    t.text('ogDescription');
    t.text('ogImage');
    t.string('twitterCard', 50).defaultTo('summary_large_image');
    t.string('twitterTitle', 255);
    t.text('twitterDescription');
    t.text('twitterImage');
    t.text('canonicalUrl');
    t.string('robots', 100).defaultTo('index, follow');
    t.jsonb('structuredData');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deletedAt');

    t.index('productId');
    t.index('deletedAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productSeo');
};
