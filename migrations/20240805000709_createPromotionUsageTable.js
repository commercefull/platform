exports.up = function(knex) {
  return knex.schema.createTable('promotionUsage', t => {
    t.uuid('promotionUsageId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionId').notNullable().references('promotionId').inTable('promotion').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    t.decimal('discountAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.timestamp('usedAt').notNullable().defaultTo(knex.fn.now());
    

    t.index('promotionId');
    t.index('customerId');
    t.index('orderId');
    t.index('usedAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotionUsage');
};
