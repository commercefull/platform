/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationExclusion');
  if (hasTable) return;

  await knex.schema.createTable('recommendationExclusion', t => {
    t.uuid('recommendationExclusionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('productId').notNullable(); // product the recommendation would appear on; same as org sentinel for 'global'
    t.uuid('excludedProductId').notNullable();
    t.string('scope', 10).notNullable().defaultTo('pair'); // pair | global
    t.string('reason', 255);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'productId'], 'idx_recoExclusion_product');
  });

  await knex.raw(
    `ALTER TABLE "recommendationExclusion" ADD CONSTRAINT "uq_recoExclusion" UNIQUE NULLS NOT DISTINCT ("organizationId", "storeId", "productId", "excludedProductId", "scope")`,
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationExclusion');
};
