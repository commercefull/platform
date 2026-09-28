/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const ALL_STORES = '00000000-0000-0000-0000-000000000000';

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationPopular');
  if (hasTable) return;

  await knex.schema.createTable('recommendationPopular', t => {
    t.uuid('recommendationPopularId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.string('scope', 10).notNullable(); // overall | category
    t.uuid('categoryId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.integer('rank').notNullable();
    t.decimal('score', 12, 4).notNullable().defaultTo(0);
    t.timestamp('computedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'scope', 'categoryId', 'productId'], { indexName: 'uq_recoPopular' });
    t.index(['organizationId', 'scope', 'categoryId', 'rank'], 'idx_recoPopular_serve');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationPopular');
};
