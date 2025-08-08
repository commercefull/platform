exports.up = function(knex) {
  return knex.schema.createTable('couponUsage', t => {
    t.uuid('couponUsageId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('couponId').notNullable().references('couponId').inTable('coupon').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.decimal('discountAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.timestamp('usedAt').notNullable().defaultTo(knex.fn.now());
    

    t.index('couponId');
    t.index('orderId');
    t.index('customerId');
    t.index('usedAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('coupon_usage');
};
