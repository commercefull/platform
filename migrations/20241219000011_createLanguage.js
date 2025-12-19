/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('language', t => {
    t.uuid('languageId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('code', 10).notNullable().unique();
    t.string('name', 100).notNullable();
    t.string('nativeName', 100);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('code');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('language');
};
