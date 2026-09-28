/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationPopular');
  if (hasTable) return;

  await knex.schema.createTable('recommendationPopular', t => {
    t.uuid('recommendationPopularId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.string('scope', 10).notNullable(); // overall | category
    t.uuid('categoryId').nullable().references('productCategoryId').inTable('productCategory').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.integer('rank').notNullable();
    t.decimal('score', 12, 4).notNullable().defaultTo(0);
    t.timestamp('computedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'scope', 'categoryId', 'rank'], 'idx_recoPopular_serve');
  });

  await knex.raw(
    `ALTER TABLE "recommendationPopular" ADD CONSTRAINT "uq_recoPopular" UNIQUE NULLS NOT DISTINCT ("organizationId", "storeId", "scope", "categoryId", "productId")`,
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationPopular');
};
