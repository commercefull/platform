exports.up = function(knex) {
  return knex.schema.createTable('product_discount_customer_group', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('discountId').notNullable().references('id').inTable('product_discount').onDelete('CASCADE');
    // NOTE: Assuming 'customer_group' table exists from a previous migration.
    t.uuid('customerGroupId').notNullable().references('id').inTable('customer_group').onDelete('CASCADE');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index('discountId');
    t.index('customerGroupId');
    t.unique(['discountId', 'customerGroupId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_discount_customer_group');
};
