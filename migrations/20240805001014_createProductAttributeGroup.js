/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('productAttributeGroup', t => {
        t.uuid('productAttributeGroupId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
        t.string('name', 100).notNullable();
        t.string('code', 50).notNullable().unique();
        t.text('description');
        t.boolean('isActive').notNullable().defaultTo(true);
        t.integer('position').defaultTo(0);

        t.index('code');
        t.index('isActive');
        t.index('position');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('productAttributeGroup');
};
