exports.up = function(knex) {
  return knex.schema.createTable('productList', t => {
    t.uuid('productListId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.enum('type', ['wishlist', 'custom']).notNullable().defaultTo('wishlist');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isPublic').notNullable().defaultTo(false);
    t.text('description');
    t.text('shareUrl');
    

    t.index('customerId');
    t.index('type');
    t.index('isDefault');
    t.index('isPublic');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productList');
};
