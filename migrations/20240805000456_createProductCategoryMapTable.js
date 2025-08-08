exports.up = function(knex) {
  return knex.schema.createTable('productCategoryMap', t => {
    t.uuid('productCategoryMapId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('categoryId').notNullable().references('categoryId').inTable('productCategory').onDelete('CASCADE');
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('isPrimary').notNullable().defaultTo(false);
    

    t.index('productId');
    t.index('categoryId');
    t.index('position');
    t.index('isPrimary');
    t.unique(['productId', 'categoryId']);
    t.unique(['productId', 'isPrimary'], { predicate: knex.raw('"isPrimary" = true') });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productCategoryMap');
};
