exports.up = function(knex) {
  return knex.schema.createTable('promotionProductDiscountCustomerGroup', t => {
    t.uuid('promotionProductDiscountCustomerGroupId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionProductDiscountId').notNullable().references('promotionProductDiscountId').inTable('promotionProductDiscount').onDelete('CASCADE');
    t.uuid('customerGroupId').notNullable().references('customerGroupId').inTable('customerGroup').onDelete('CASCADE');

    t.index('promotionProductDiscountId');
    t.index('customerGroupId');
    t.unique(['promotionProductDiscountId', 'customerGroupId'], { indexName: 'idx_promo_prod_disc_cust_grp_unique' });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotionProductDiscountCustomerGroup');
};
