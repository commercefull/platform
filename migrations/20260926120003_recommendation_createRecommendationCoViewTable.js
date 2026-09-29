/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationCoView');
  if (hasTable) return;

  await knex.schema.createTable('recommendationCoView', t => {
    t.uuid('recommendationCoViewId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.uuid('relatedProductId').notNullable();
    t.decimal('coViewCount', 12, 4).notNullable().defaultTo(0);
    t.integer('lifetimeCoViewCount').notNullable().defaultTo(0);
    t.timestamp('lastViewedAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'productId'], 'idx_recoCoView_org_product');
  });

  await knex.raw(
    `ALTER TABLE "recommendationCoView" ADD CONSTRAINT "uq_recoCoView_pair" UNIQUE NULLS NOT DISTINCT ("organizationId", "storeId", "productId", "relatedProductId")`,
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationCoView');
};
