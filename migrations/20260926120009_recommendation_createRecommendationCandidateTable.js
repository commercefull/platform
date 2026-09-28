/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const ALL_STORES = '00000000-0000-0000-0000-000000000000';

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationCandidate');
  if (hasTable) return;

  await knex.schema.createTable('recommendationCandidate', t => {
    t.uuid('recommendationCandidateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.uuid('productId').notNullable();
    t.uuid('candidateProductId').notNullable();
    t.string('source', 10).notNullable(); // rule | fbt | similar | coView
    t.string('relationType', 20).notNullable().defaultTo('related');
    t.decimal('score', 12, 4).notNullable().defaultTo(0);
    t.jsonb('reason');
    t.timestamp('computedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.unique(['organizationId', 'storeId', 'productId', 'candidateProductId', 'source'], { indexName: 'uq_recoCandidate' });
    t.index(['organizationId', 'productId', 'relationType', 'score'], 'idx_recoCandidate_serve');
    t.index(['organizationId', 'candidateProductId'], 'idx_recoCandidate_reverse');
    t.index(['organizationId', 'productId', 'score'], 'idx_recoCandidate_rank');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationCandidate');
};
