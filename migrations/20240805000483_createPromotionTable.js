exports.up = function (knex) {
  return knex.schema.createTable('promotion', t => {
    t.uuid('promotionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.text('description');
    t.enum('status', ['active', 'scheduled', 'expired', 'disabled', 'pendingApproval']).notNullable().defaultTo('active');
    t.enum('scope', ['cart', 'product', 'category', 'merchant', 'shipping', 'global']).notNullable();
    t.integer('priority').notNullable().defaultTo(0);
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isExclusive').notNullable().defaultTo(false);
    t.integer('maxUsage');
    t.integer('usageCount').notNullable().defaultTo(0);
    t.integer('maxUsagePerCustomer');
    t.decimal('minOrderAmount', 15, 2);
    t.decimal('maxDiscountAmount', 15, 2);
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.boolean('isGlobal').notNullable().defaultTo(false);
    t.jsonb('eligibleCustomerGroups');
    t.jsonb('excludedCustomerGroups');

    t.index('status');
    t.index('scope');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.index('isExclusive');
    t.index('priority');
    t.index('merchantId');
    t.index('isGlobal');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('promotion');
};
