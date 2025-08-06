/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('productAttributeToGroup', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        t.uuid('attributeId').notNullable().references('id').inTable('productAttribute').onDelete('CASCADE');
        t.uuid('groupId').notNullable().references('id').inTable('productAttributeGroup').onDelete('CASCADE');
    t.integer('position').defaultTo(0);
        t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        t.index('attributeId');
        t.index('groupId');
    t.index('position');
        t.unique(['attributeId', 'groupId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('productAttributeToGroup');
};
