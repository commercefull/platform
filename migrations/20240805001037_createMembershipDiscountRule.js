/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipDiscountRule', t => {
    t.uuid('membershipDiscountRuleId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('planId').notNullable().references('membershipPlanId').inTable('membershipPlan').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.enum('discountType', ['percentage', 'fixedAmount', 'freeItem', 'buyXGetY']).notNullable();
    t.decimal('discountValue', 10, 2).notNullable();
    t.decimal('maxDiscountAmount', 10, 2);
    t.decimal('minOrderValue', 10, 2);
    t.integer('maxUses');
    t.integer('usesPerCustomer');
    t.enum('appliesTo', ['entireOrder', 'categories', 'products', 'shipping']).notNullable().defaultTo('entireOrder');
    t.specificType('applicableIds', 'uuid[]');
    t.specificType('excludedIds', 'uuid[]');
    t.timestamp('startDate');
    t.timestamp('endDate');
    t.jsonb('conditions');
    
    t.index('planId');
    t.index('isActive');
    t.index('priority');
    t.index('discountType');
    t.index('appliesTo');
    t.index('startDate');
    t.index('endDate');
    t.index('applicableIds', null, 'gin');
    t.index('excludedIds', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipDiscountRule');
};
