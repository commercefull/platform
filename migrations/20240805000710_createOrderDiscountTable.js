exports.up = function(knex) {
  return knex.schema.createTable('orderDiscount', t => {
    t.uuid('orderDiscountId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('orderItemId').references('orderItemId').inTable('orderItem').onDelete('CASCADE');
    t.string('code', 100);
    t.string('name', 255).notNullable();
    t.text('description');
    t.string('type', 50).notNullable().checkIn(['percentage', 'fixedAmount', 'freeShipping', 'buyXGetY', 'giftCard']);
    t.decimal('value', 15, 2).notNullable();
    t.decimal('discountAmount', 15, 2).notNullable();
    

    t.index('orderId');
    t.index('orderItemId');
    t.index('code');
    t.index('type');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderDiscount');
};
