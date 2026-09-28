/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const ALL_STORES = '00000000-0000-0000-0000-000000000000';

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationCoView');
  if (hasTable) return;

  await knex.schema.createTable('recommendationCoView', t => {
    t.uuid('recommendationCoViewId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.uuid('relatedProductId').notNullable();
    t.decimal('coViewCount', 12, 4).notNullable().defaultTo(0);
    t.integer('lifetimeCoViewCount').notNullable().defaultTo(0);
    t.timestamp('lastViewedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'productId', 'relatedProductId'], { indexName: 'uq_recoCoView_pair' });
    t.index(['organizationId', 'productId'], 'idx_recoCoView_org_product');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationCoView');
};
