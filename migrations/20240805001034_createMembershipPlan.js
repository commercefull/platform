/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipPlan', t => {
    t.uuid('membershipPlanId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.string('shortDescription', 255);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isPublic').notNullable().defaultTo(true);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.integer('priority').defaultTo(0);
    t.integer('level').defaultTo(1);
    t.integer('trialDays').defaultTo(0);
    t.decimal('price', 10, 2).notNullable();
    t.decimal('salePrice', 10, 2);
    t.decimal('setupFee', 10, 2).defaultTo(0);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.enum('billingCycle', ['daily', 'weekly', 'monthly', 'quarterly', 'biannual', 'annual', 'lifetime']).notNullable().defaultTo('monthly');
    t.integer('billingPeriod').defaultTo(1);
    t.integer('maxMembers');
    t.boolean('autoRenew').notNullable().defaultTo(true);
    t.integer('duration');
    t.integer('gracePeriodsAllowed').defaultTo(0);
    t.integer('gracePeriodDays').defaultTo(0);
    t.text('membershipImage');
    t.jsonb('publicDetails');
    t.jsonb('privateMeta');
    t.jsonb('visibilityRules');
    t.jsonb('availabilityRules');
    t.jsonb('customFields');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('code');
    t.index('isActive');
    t.index('isPublic');
    t.index('priority');
    t.index('level');
    t.index('price');
    t.index('billingCycle');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipPlan');
};
