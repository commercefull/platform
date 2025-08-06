exports.up = function(knex) {
  return knex.schema.createTable('cart_promotion', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('cartId').notNullable().references('id').inTable('basket').onDelete('CASCADE');
    t.uuid('promotionId').notNullable().references('id').inTable('promotion').onDelete('CASCADE');
    t.uuid('couponId').references('id').inTable('coupon').onDelete('SET NULL');
    t.string('couponCode', 100);
    t.decimal('discountAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.boolean('isAutoApplied').notNullable().defaultTo(false);
    t.boolean('isCustomerInitiated').notNullable().defaultTo(true);
    t.uuid('appliedBy');
    t.timestamp('appliedAt').notNullable().defaultTo(knex.fn.now());
    t.enum('status', ['active', 'removed', 'expired', 'invalid']).notNullable().defaultTo('active');
    t.timestamp('validUntil');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('cartId');
    t.index('promotionId');
    t.index('couponId');
    t.index('couponCode');
    t.index('isAutoApplied');
    t.index('isCustomerInitiated');
    t.index('appliedBy');
    t.index('status');
    t.index('validUntil');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cart_promotion');
};
