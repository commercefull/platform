// Consolidated: Product Mapping Tables (Category, Tag, Collection)
exports.up = function(knex) {
  return knex.schema.createTable('productCategoryMap', t => {
      t.uuid('productCategoryMapId').primary().defaultTo(knex.raw('uuidv7()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
      t.uuid('productCategoryId').notNullable().references('productCategoryId').inTable('productCategory').onDelete('CASCADE');
      t.integer('position').notNullable().defaultTo(0);
      t.boolean('isPrimary').notNullable().defaultTo(false);
      
      t.index('productId');
      t.index('productCategoryId');
      t.index('position');
      t.index('isPrimary');
      t.unique(['productId', 'productCategoryId']);
    })
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('productCategoryMap');
};
