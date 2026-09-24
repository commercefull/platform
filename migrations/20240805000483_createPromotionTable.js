exports.up = function (knex) {
  return knex.schema.createTable('promotion', t => {
    t.uuid('promotionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.text('description');
    t.enum('status', ['draft', 'scheduled', 'active', 'paused', 'expired', 'cancelled', 'disabled', 'pendingApproval'])
      .notNullable()
      .defaultTo('active');
    t.enum('scope', ['cart', 'product', 'category', 'organization', 'shipping', 'global']).notNullable();
    t.integer('priority').notNullable().defaultTo(0);
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isExclusive').notNullable().defaultTo(false);
    t.enu('stackability', ['none', 'stackable', 'exclusive']).notNullable().defaultTo('stackable');
    t.integer('maxUsage');
    t.integer('usageCount').notNullable().defaultTo(0);
    t.integer('maxUsagePerCustomer');
    t.bigInteger('minOrderAmountCents');
    t.bigInteger('maxDiscountAmountCents');
    t.uuid('organizationId').references('organizationId').inTable('organization');
    t.boolean('isGlobal').notNullable().defaultTo(false);
    t.jsonb('eligibleCustomerGroups');
    t.jsonb('excludedCustomerGroups');
    t.timestamp('deletedAt').nullable();

    t.index('status');
    t.index('scope');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.index('isExclusive');
    t.index('stackability');
    t.index('priority');
    t.index('organizationId');
    t.index('isGlobal');
    t.index('deletedAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('promotion');
};
