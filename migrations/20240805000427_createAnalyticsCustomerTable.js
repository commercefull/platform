exports.up = function (knex) {
  return knex.schema.createTable('analyticsCustomer', t => {
    t.uuid('analyticsCustomerId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('lastUpdatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.integer('totalOrders').notNullable().defaultTo(0);
    t.bigInteger('totalSpentCents').notNullable().defaultTo(0);
    t.bigInteger('averageOrderValueCents');
    t.timestamp('firstOrderDate');
    t.timestamp('lastOrderDate');
    t.timestamp('lastVisitDate');
    t.integer('visitCount').notNullable().defaultTo(0);
    t.integer('cartCount').notNullable().defaultTo(0);
    t.integer('abandonedCarts').notNullable().defaultTo(0);
    t.integer('productViews').notNullable().defaultTo(0);
    t.integer('wishlistItemCount').notNullable().defaultTo(0);
    t.integer('reviewCount').notNullable().defaultTo(0);
    t.decimal('averageReviewRating', 3, 2);
    t.bigInteger('lifetimeValueCents');
    t.decimal('riskScore', 5, 2);
    t.decimal('engagementScore', 5, 2);
    t.decimal('churnRisk', 5, 2);
    t.jsonb('preferredCategories');
    t.jsonb('preferredProducts');
    t.jsonb('preferredPaymentMethods');
    t.jsonb('preferredShippingMethods');
    t.jsonb('segmentData');
    t.jsonb('deviceUsage');

    t.unique('customerId');
    t.index('totalOrders');
    t.index('totalSpentCents');
    t.index('averageOrderValueCents');
    t.index('lastOrderDate');
    t.index('lifetimeValueCents');
    t.index('engagementScore');
    t.index('churnRisk');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('analyticsCustomer');
};
