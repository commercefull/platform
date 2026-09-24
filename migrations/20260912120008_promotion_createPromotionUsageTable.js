exports.up = function (knex) {
  return knex.schema.createTable('promotionUsage', t => {
    t.uuid('promotionUsageId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionId').notNullable().references('promotionId').inTable('promotion').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.bigInteger('discountAmountCents').notNullable().defaultTo(0);
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.timestamp('usedAt').notNullable().defaultTo(knex.fn.now());

    t.index('promotionId');
    t.index('orderId');
    t.index('customerId');
    t.index('usedAt');
    t.index('createdAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('promotionUsage');
};
