/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('productTag', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('slug', 150).notNullable().unique();
    t.text('description');
        t.boolean('isActive').notNullable().defaultTo(true);
    t.jsonb('metadata');
        t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('name');
    t.index('slug');
        t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('productTag');
};
