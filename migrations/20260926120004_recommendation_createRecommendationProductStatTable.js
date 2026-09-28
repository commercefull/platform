/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationProductStat');
  if (hasTable) return;

  await knex.schema.createTable('recommendationProductStat', t => {
    t.uuid('recommendationProductStatId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.decimal('orderCount', 12, 4).notNullable().defaultTo(0);
    t.integer('lifetimeOrderCount').notNullable().defaultTo(0);
    t.timestamp('lastOrderedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'orderCount'], 'idx_recoProductStat_org_count');
  });

  await knex.raw(
    `ALTER TABLE "recommendationProductStat" ADD CONSTRAINT "uq_recoProductStat" UNIQUE NULLS NOT DISTINCT ("organizationId", "storeId", "productId")`,
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationProductStat');
};
