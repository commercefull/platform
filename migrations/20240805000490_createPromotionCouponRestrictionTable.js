exports.up = function(knex) {
  return knex.schema.createTable('promotionCouponRestriction', t => {
    t.uuid('promotionCouponRestrictionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionCouponId').notNullable().references('promotionCouponId').inTable('promotionCoupon').onDelete('CASCADE');
    t.enum('restrictionType', ['productIds', 'categoryIds', 'customerGroups', 'paymentMethods', 'shippingMethods', 'countries', 'excludedProductIds', 'excludedCategoryIds', 'minimumQuantity', 'maximumQuantity']).notNullable();
    t.jsonb('restrictionValue').notNullable();
    

    t.index('promotionCouponId');
    t.index('restrictionType');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotionCouponRestriction');
};
