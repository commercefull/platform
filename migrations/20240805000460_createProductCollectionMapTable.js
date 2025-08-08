exports.up = function(knex) {
  return knex.schema.createTable('productCollectionMap', t => {
    t.uuid('productCollectionMapId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('collectionId').notNullable().references('collectionId').inTable('productCollection').onDelete('CASCADE');
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('addedManually').notNullable().defaultTo(true);
    

    t.index('productId');
    t.index('collectionId');
    t.index('position');
    t.index('addedManually');
    t.unique(['productId', 'collectionId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productCollectionMap');
};
