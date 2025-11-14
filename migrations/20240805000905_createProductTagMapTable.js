exports.up = function(knex) {
  return knex.schema.createTable('productTagMap', t => {
    t.uuid('productTagMapId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productTagId').notNullable().references('productTagId').inTable('productTag').onDelete('CASCADE');

    t.index('productId');
    t.index('productTagId');
    t.unique(['productId', 'productTagId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productTagMap');
};
