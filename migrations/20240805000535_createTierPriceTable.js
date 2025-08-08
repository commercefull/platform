exports.up = function(knex) {
  return knex.schema.createTable('tierPrice', t => {
    t.uuid('tierPriceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('customerGroupId').references('customerGroupId').inTable('customerGroup').onDelete('SET NULL');
    t.integer('quantityMin').notNullable();
    t.decimal('price', 10, 2).notNullable();

    t.index(['productId', 'productVariantId', 'quantityMin']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tierPrice');
};
