/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortmentCategoryManualOrder');
  if (hasTable) return;

  await knex.schema.createTable('assortmentCategoryManualOrder', t => {
    t.uuid('assortmentCategoryManualOrderId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('categoryId').notNullable();
    t.uuid('productId').notNullable();
    t.integer('position').notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.unique(['categoryId', 'productId'], 'uq_categoryManualOrder_category_product');
    t.index(['categoryId', 'position'], 'idx_categoryManualOrder_category_position');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentCategoryManualOrder');
};
