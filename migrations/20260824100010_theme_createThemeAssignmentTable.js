/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('themeAssignment');
  if (hasTable) return;

  await knex.schema.createTable('themeAssignment', t => {
    t.uuid('storeId').primary();
    t.uuid('themeId').notNullable().index();
    t.uuid('organizationId').notNullable().index();
    t.uuid('overrideId');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('themeAssignment');
};
