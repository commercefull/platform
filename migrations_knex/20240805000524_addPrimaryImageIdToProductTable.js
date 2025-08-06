exports.up = function(knex) {
  return knex.schema.alterTable('product', t => {
    t.uuid('primaryImageId').references('id').inTable('product_image').onDelete('SET NULL');
    t.index('primaryImageId');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('product', t => {
    t.dropColumn('primaryImageId');
  });
};
