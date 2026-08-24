/**
 * Create segment module tables:
 * - segmentDefinition: dynamic segment rules with condition DSL
 * - segmentMembership: materialized segment memberships
 * - customerProfile: CDP profile with LTV, frequency, behaviour aggregates
 */

exports.up = async function (knex) {
  // ── segmentDefinition ──────────────────────────────────────────
  const hasSegmentDef = await knex.schema.hasTable('segmentDefinition');
  if (!hasSegmentDef) {
    await knex.schema.createTable('segmentDefinition', t => {
      t.uuid('segmentId').primary().defaultTo(knex.raw('uuidv7()'));
      t.string('name').notNullable();
      t.string('code').notNullable().unique();
      t.text('description').nullable();
      t.jsonb('conditions').notNullable().defaultTo('{}');
      t.string('matchMode').notNullable().defaultTo('all');
      t.boolean('isActive').notNullable().defaultTo(true);
      t.boolean('isSystem').notNullable().defaultTo(false);
      t.string('color').nullable();
      t.string('icon').nullable();
      t.integer('memberCount').notNullable().defaultTo(0);
      t.timestamp('lastEvaluatedAt').nullable();
      t.uuid('organizationId').nullable();
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('deletedAt').nullable();

      t.index(['isActive', 'deletedAt'], 'idx_segmentDef_active');
      t.index(['organizationId', 'isActive'], 'idx_segmentDef_org_active');
      t.index(['code'], 'idx_segmentDef_code');
    });
  }

  // ── segmentMembership ──────────────────────────────────────────
  const hasSegmentMember = await knex.schema.hasTable('segmentMembership');
  if (!hasSegmentMember) {
    await knex.schema.createTable('segmentMembership', t => {
      t.uuid('segmentMembershipId').primary().defaultTo(knex.raw('uuidv7()'));
      t.uuid('segmentId').notNullable();
      t.uuid('customerId').notNullable();
      t.jsonb('snapshotData').nullable();
      t.decimal('matchScore', 5, 4).nullable();
      t.timestamp('firstMatchedAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('lastMatchedAt').notNullable().defaultTo(knex.fn.now());
      t.boolean('isActive').notNullable().defaultTo(true);
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      t.unique(['segmentId', 'customerId'], 'uq_segmentMembership_segment_customer');
      t.index(['segmentId', 'isActive'], 'idx_segmentMembership_segment_active');
      t.index(['customerId', 'isActive'], 'idx_segmentMembership_customer_active');
    });
  }

  // ── customerProfile ────────────────────────────────────────────
  const hasCustomerProfile = await knex.schema.hasTable('customerProfile');
  if (!hasCustomerProfile) {
    await knex.schema.createTable('customerProfile', t => {
      t.uuid('customerProfileId').primary().defaultTo(knex.raw('uuidv7()'));
      t.uuid('customerId').notNullable().unique();
      t.string('email').nullable();
      t.string('firstName').nullable();
      t.string('lastName').nullable();
      t.string('status').nullable();
      t.string('tier').nullable();

      // LTV & spend metrics
      t.decimal('lifetimeValue', 14, 2).notNullable().defaultTo(0);
      t.decimal('totalSpent', 14, 2).notNullable().defaultTo(0);
      t.decimal('averageOrderValue', 14, 2).notNullable().defaultTo(0);
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
      t.index(['lifetimeValue'], 'idx_customerProfile_ltv');
      t.index(['totalOrders'], 'idx_customerProfile_orders');
      t.index(['lastOrderDate'], 'idx_customerProfile_lastOrder');
      t.index(['organizationId'], 'idx_customerProfile_org');
      t.index(['rfmSegment'], 'idx_customerProfile_rfm');
    });
  }
};

exports.down = async function (knex) {
  const hasCustomerProfile = await knex.schema.hasTable('customerProfile');
  if (hasCustomerProfile) await knex.schema.dropTable('customerProfile');

  const hasSegmentMember = await knex.schema.hasTable('segmentMembership');
  if (hasSegmentMember) await knex.schema.dropTable('segmentMembership');

  const hasSegmentDef = await knex.schema.hasTable('segmentDefinition');
  if (hasSegmentDef) await knex.schema.dropTable('segmentDefinition');
};
