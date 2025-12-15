exports.up = function(knex) {
  return knex.schema.createTable('cartPromotion', t => {
    t.uuid('cartPromotionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('basketId').notNullable().references('basketId').inTable('basket').onDelete('CASCADE');
    t.uuid('promotionId').notNullable().references('promotionId').inTable('promotion').onDelete('CASCADE');
    t.uuid('promotionCouponId').references('promotionCouponId').inTable('promotionCoupon').onDelete('SET NULL');
    t.string('couponCode', 100);
    t.decimal('discountAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.boolean('isAutoApplied').notNullable().defaultTo(false);
    t.boolean('isCustomerInitiated').notNullable().defaultTo(true);
    t.uuid('appliedBy');
    t.timestamp('appliedAt').notNullable().defaultTo(knex.fn.now());
    t.enum('status', ['active', 'removed', 'expired', 'invalid']).notNullable().defaultTo('active');
    t.timestamp('validUntil');
    

    t.index('basketId');
    t.index('promotionId');
    t.index('promotionCouponId');
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
  return knex.schema.dropTable('cartPromotion');
};
