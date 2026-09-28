/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationCoPurchase');
  if (hasTable) return;

  await knex.schema.createTable('recommendationCoPurchase', t => {
    t.uuid('recommendationCoPurchaseId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.uuid('relatedProductId').notNullable();
    t.decimal('coCount', 12, 4).notNullable().defaultTo(0);
    t.integer('lifetimeCoCount').notNullable().defaultTo(0);
    t.timestamp('lastOrderedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'productId'], 'idx_recoCoPurchase_org_product');
    t.index(['organizationId', 'productId', 'coCount'], 'idx_recoCoPurchase_rank');
  });

  await knex.raw(
    `ALTER TABLE "recommendationCoPurchase" ADD CONSTRAINT "uq_recoCoPurchase_pair" UNIQUE NULLS NOT DISTINCT ("organizationId", "storeId", "productId", "relatedProductId")`,
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationCoPurchase');
};
