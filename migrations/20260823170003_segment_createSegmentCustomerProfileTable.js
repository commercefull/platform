/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('segmentCustomerProfile');
  if (hasTable) return;

  await knex.schema.createTable('segmentCustomerProfile', t => {
    t.uuid('customerProfileId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('customerId').notNullable().unique();
    t.string('email').nullable();
    t.string('firstName').nullable();
    t.string('lastName').nullable();
    t.string('status').nullable();
    t.string('tier').nullable();

    // LTV & spend metrics
    t.bigInteger('lifetimeValueCents').notNullable().defaultTo(0);
    t.bigInteger('totalSpentCents').notNullable().defaultTo(0);
    t.bigInteger('averageOrderValueCents').notNullable().defaultTo(0);
    t.integer('totalOrders').notNullable().defaultTo(0);

    // Frequency & recency
    t.date('firstOrderDate').nullable();
    t.date('lastOrderDate').nullable();
    t.integer('daysSinceLastOrder').nullable();
    t.integer('ordersLast30Days').notNullable().defaultTo(0);
    t.integer('ordersLast90Days').notNullable().defaultTo(0);
    t.integer('ordersLast12Months').notNullable().defaultTo(0);

    // Behaviour
    t.integer('productViews').notNullable().defaultTo(0);
    t.integer('cartCount').notNullable().defaultTo(0);
    t.integer('abandonedCarts').notNullable().defaultTo(0);
    t.integer('wishlistItemCount').notNullable().defaultTo(0);
    t.integer('reviewCount').notNullable().defaultTo(0);
    t.decimal('averageReviewRating', 3, 2).nullable();
    t.integer('visitCount').notNullable().defaultTo(0);
    t.date('lastVisitDate').nullable();

    // Derived scores
    t.string('rfmSegment').nullable();
    t.decimal('engagementScore', 5, 2).nullable();
    t.decimal('churnRisk', 5, 2).nullable();
    t.decimal('riskScore', 5, 2).nullable();

    // Preferences
    t.jsonb('preferredCategories').nullable();
    t.jsonb('preferredProducts').nullable();
    t.jsonb('preferredPaymentMethods').nullable();
    t.jsonb('preferredShippingMethods').nullable();
    t.jsonb('deviceUsage').nullable();
    t.jsonb('tags').nullable();
    t.jsonb('customAttributes').nullable();

    // Segment membership cache
    t.jsonb('segmentIds').nullable();

    t.uuid('organizationId').nullable();
    t.timestamp('lastComputedAt').nullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index(['customerId'], 'idx_customerProfile_customer');
    t.index(['lifetimeValueCents'], 'idx_customerProfile_ltv');
    t.index(['totalOrders'], 'idx_customerProfile_orders');
    t.index(['lastOrderDate'], 'idx_customerProfile_lastOrder');
    t.index(['organizationId'], 'idx_customerProfile_org');
    t.index(['rfmSegment'], 'idx_customerProfile_rfm');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('segmentCustomerProfile');
};
