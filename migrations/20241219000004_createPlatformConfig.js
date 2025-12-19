/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('platformConfig', t => {
    t.uuid('configId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('key', 255).notNullable();
    t.text('value').notNullable();
    t.enu('type', ['string', 'number', 'boolean', 'json', 'array']).notNullable().defaultTo('string');
    t.string('category', 100).notNullable().defaultTo('general');
    t.text('description');
    t.boolean('isSecret').notNullable().defaultTo(false);
    t.boolean('isEditable').notNullable().defaultTo(true);
    t.jsonb('validationRules');
    t.uuid('merchantId');
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['key', 'merchantId']);
    t.index('key');
    t.index('category');
    t.index('merchantId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('platformConfig');
};
