exports.up = function(knex) {
  return knex.schema.createTable('couponRestriction', t => {
    t.uuid('couponRestrictionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('couponId').notNullable().references('couponId').inTable('coupon').onDelete('CASCADE');
    t.enum('restrictionType', ['productIds', 'categoryIds', 'customerGroups', 'paymentMethods', 'shippingMethods', 'countries', 'excludedProductIds', 'excludedCategoryIds', 'minimumQuantity', 'maximumQuantity']).notNullable();
    t.jsonb('restrictionValue').notNullable();
    

    t.index('couponId');
    t.index('restrictionType');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('couponRestriction');
};
