exports.up = function(knex) {
  return knex.schema.createTable('categoryPromotion', t => {
    t.uuid('categoryPromotionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productCategoryId').notNullable().references('productCategoryId').inTable('productCategory').onDelete('CASCADE');
    t.uuid('promotionId').notNullable().references('promotionId').inTable('promotion').onDelete('CASCADE');
    t.integer('displayOrder').notNullable().defaultTo(0);
    t.string('bannerText', 255);
    t.string('bannerColor', 50);
    t.string('bannerBackgroundColor', 50);
    t.text('bannerImageUrl');
    t.boolean('isDisplayedOnCategoryPage').notNullable().defaultTo(true);
    t.boolean('isDisplayedOnProductPage').notNullable().defaultTo(true);
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('productCategoryId');
    t.index('promotionId');
    t.index('displayOrder');
    t.index('isDisplayedOnCategoryPage');
    t.index('isDisplayedOnProductPage');
    t.unique(['productCategoryId', 'promotionId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categoryPromotion');
};
