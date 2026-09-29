/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationCandidate');
  if (hasTable) return;

  await knex.schema.createTable('recommendationCandidate', t => {
    t.uuid('recommendationCandidateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.uuid('candidateProductId').notNullable();
    t.string('source', 10).notNullable(); // rule | fbt | similar | coView
    t.string('relationType', 20).notNullable().defaultTo('related');
    t.decimal('score', 12, 4).notNullable().defaultTo(0);
    t.jsonb('reason');
    t.timestamp('computedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'productId', 'relationType', 'score'], 'idx_recoCandidate_serve');
    t.index(['organizationId', 'candidateProductId'], 'idx_recoCandidate_reverse');
    t.index(['organizationId', 'productId', 'score'], 'idx_recoCandidate_rank');
  });

  await knex.raw(
    `ALTER TABLE "recommendationCandidate" ADD CONSTRAINT "uq_recoCandidate" UNIQUE NULLS NOT DISTINCT ("organizationId", "storeId", "productId", "candidateProductId", "source")`,
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationCandidate');
};
