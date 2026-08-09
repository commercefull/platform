/**
 * Migration: Create Commission Plan Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('pricingCommissionPlan');
  if (hasTable) return;

  await knex.schema.createTable('pricingCommissionPlan', table => {
    table.uuid('commissionPlanId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('organizationId').notNullable();
    table.string('name', 255).notNullable();
    table.jsonb('rules').notNullable(); // { categoryRules: [...], fixedFees: [...] }
    table.boolean('isDefault').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('organizationId');
    table.index('isDefault');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pricingCommissionPlan');
};
