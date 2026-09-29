/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationTenantStat');
  if (hasTable) return;

  await knex.schema.createTable('recommendationTenantStat', t => {
    t.uuid('recommendationTenantStatId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.decimal('totalOrders', 14, 4).notNullable().defaultTo(0);
    t.timestamp('lastRebuiltAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(
    `ALTER TABLE "recommendationTenantStat" ADD CONSTRAINT "uq_recoTenantStat" UNIQUE NULLS NOT DISTINCT ("organizationId", "storeId")`,
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationTenantStat');
};
