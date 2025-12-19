/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('role', t => {
    t.uuid('roleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name', 100).notNullable().unique();
    t.text('description');
    t.jsonb('permissions').notNullable().defaultTo('[]');
    t.boolean('isSystem').notNullable().defaultTo(false);
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('name');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('role');
};
