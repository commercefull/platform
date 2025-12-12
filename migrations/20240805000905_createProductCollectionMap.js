// Consolidated: Product Mapping Tables (Category, Tag, Collection)
exports.up = function(knex) {
  return knex.schema.createTable('productCollectionMap', t => {
        t.uuid('productCollectionMapId').primary().defaultTo(knex.raw('uuidv7()'));
        t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
        t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
        t.uuid('productCollectionId').notNullable().references('productCollectionId').inTable('productCollection').onDelete('CASCADE');
        t.integer('position').notNullable().defaultTo(0);
        t.boolean('addedManually').notNullable().defaultTo(true);
        
        t.index('productId');
        t.index('productCollectionId');
        t.index('position');
        t.index('addedManually');
        t.unique(['productId', 'productCollectionId']);
      })
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('productCollectionMap');
};
