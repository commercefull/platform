/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('productAttribute', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
        t.enu('type', ['text', 'number', 'boolean', 'date', 'color', 'select', 'multiselect', 'file'], { useNative: true, enumName: 'productAttributeType' }).notNullable();
        t.boolean('isActive').notNullable().defaultTo(true);
        t.boolean('isRequired').notNullable().defaultTo(false);
        t.boolean('isVariant').notNullable().defaultTo(false);
        t.boolean('isSearchable').notNullable().defaultTo(false);
        t.boolean('isFilterable').notNullable().defaultTo(false);
        t.boolean('isComparable').notNullable().defaultTo(false);
        t.boolean('isVisibleOnProduct').notNullable().defaultTo(true);
    t.integer('position').defaultTo(0);
        t.text('defaultValue');
    t.jsonb('validations');
        t.jsonb('allowedValues');
    t.string('unit', 20);
    t.jsonb('metadata');
        t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
        t.uuid('createdBy');
    t.index('code');
    t.index('type');
        t.index('isActive');
        t.index('isVariant');
        t.index('isSearchable');
        t.index('isFilterable');
    t.index('position');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('productAttribute')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS productAttributeType'));
};
