/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const ALL_STORES = '00000000-0000-0000-0000-000000000000';

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationProductStat');
  if (hasTable) return;

  await knex.schema.createTable('recommendationProductStat', t => {
    t.uuid('recommendationProductStatId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.decimal('orderCount', 12, 4).notNullable().defaultTo(0);
    t.integer('lifetimeOrderCount').notNullable().defaultTo(0);
    t.timestamp('lastOrderedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'productId'], { indexName: 'uq_recoProductStat' });
    t.index(['organizationId', 'orderCount'], 'idx_recoProductStat_org_count');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationProductStat');
};
