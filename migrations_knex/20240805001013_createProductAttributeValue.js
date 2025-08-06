/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('productAttributeValue', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        t.uuid('attributeId').notNullable().references('id').inTable('productAttribute').onDelete('CASCADE');
    t.text('value').notNullable();
        t.string('displayValue', 255);
    t.integer('position').defaultTo(0);
        t.boolean('isDefault').notNullable().defaultTo(false);
    t.jsonb('metadata');
        t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
        t.index('attributeId');
    t.index('value');
        t.index('isDefault');
    t.index('position');
        t.unique(['attributeId', 'value']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('productAttributeValue');
};
