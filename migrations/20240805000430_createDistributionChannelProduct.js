/**
 * Distribution Channel Product Migration
 * Creates the distributionChannelProduct table for product-channel assignments
 */
exports.up = function(knex) {
  return knex.schema.createTable('distributionChannelProduct', t => {
    t.uuid('distributionChannelProductId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('distributionChannelId').notNullable().references('distributionChannelId').inTable('distributionChannel').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.string('overrideSku', 100);
    t.decimal('overridePrice', 15, 2);
    t.integer('sortOrder').defaultTo(0);

    t.unique(['distributionChannelId', 'productId']);
    t.index('distributionChannelId');
    t.index('productId');
    t.index('isActive');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('distributionChannelProduct');
};
