/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productAttributeToGroup', t => {
    t.uuid('productAttributeToGroupId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('attributeId').notNullable().references('productAttributeId').inTable('productAttribute').onDelete('CASCADE');
    t.uuid('groupId').notNullable().references('productAttributeGroupId').inTable('productAttributeGroup').onDelete('CASCADE');
    t.integer('position').defaultTo(0);
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
