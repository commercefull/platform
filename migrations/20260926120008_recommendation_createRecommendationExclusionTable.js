/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const ALL_STORES = '00000000-0000-0000-0000-000000000000';

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationExclusion');
  if (hasTable) return;

  await knex.schema.createTable('recommendationExclusion', t => {
    t.uuid('recommendationExclusionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable(); // product the recommendation would appear on; same as org sentinel for 'global'
    t.uuid('excludedProductId').notNullable();
    t.string('scope', 10).notNullable().defaultTo('pair'); // pair | global
    t.string('reason', 255);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'productId', 'excludedProductId', 'scope'], { indexName: 'uq_recoExclusion' });
    t.index(['organizationId', 'productId'], 'idx_recoExclusion_product');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationExclusion');
};
