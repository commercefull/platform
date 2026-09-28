/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('productMerchandisingRule');
  if (hasTable) return;

  await knex.schema.createTable('productMerchandisingRule', t => {
    t.uuid('ruleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('ruleType').notNullable(); // 'boost' | 'bury' | 'pin'
    t.uuid('productId').notNullable();
    t.integer('position').nullable();
    t.string('searchTerm').nullable();
    t.uuid('categoryId').nullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index(['ruleType', 'isActive'], 'idx_merchRule_type_active');
    t.index(['categoryId', 'isActive'], 'idx_merchRule_category_active');
    t.index(['searchTerm', 'isActive'], 'idx_merchRule_search_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('productMerchandisingRule');
};
