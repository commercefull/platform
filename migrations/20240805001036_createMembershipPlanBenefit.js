/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipPlanBenefit', t => {
    t.uuid('membershipPlanBenefitId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('planId').notNullable().references('membershipPlanId').inTable('membershipPlan').onDelete('CASCADE');
    t.uuid('benefitId').notNullable().references('membershipBenefitId').inTable('membershipBenefit').onDelete('CASCADE');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.jsonb('valueOverride');
    t.jsonb('rulesOverride');
    t.text('notes');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('planId');
    t.index('benefitId');
    t.index('isActive');
    t.index('priority');
    t.unique(['planId', 'benefitId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipPlanBenefit');
};
