exports.up = function(knex) {
  return knex.schema.createTable('productDiscountCustomerGroup', t => {
    t.uuid('productDiscountCustomerGroupId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('discountId').notNullable().references('productDiscountId').inTable('productDiscount').onDelete('CASCADE');
    t.uuid('customerGroupId').notNullable().references('customerGroupId').inTable('customer_group').onDelete('CASCADE');

    t.index('discountId');
    t.index('customerGroupId');
    t.unique(['discountId', 'customerGroupId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_discount_customer_group');
};
