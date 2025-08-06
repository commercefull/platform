exports.up = function(knex) {
  return knex.schema.createTable('couponRestriction', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('couponId').notNullable().references('id').inTable('coupon').onDelete('CASCADE');
    t.enum('restrictionType', ['product_ids', 'category_ids', 'customer_groups', 'payment_methods', 'shipping_methods', 'countries', 'excluded_product_ids', 'excluded_category_ids', 'minimum_quantity', 'maximum_quantity']).notNullable();
    t.jsonb('restrictionValue').notNullable();
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index('couponId');
    t.index('restrictionType');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('couponRestriction');
};
