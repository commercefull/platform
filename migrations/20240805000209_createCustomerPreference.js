/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerPreference', t => {
    t.uuid('customerPreferenceId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('preferenceCategory', 50).notNullable();
    t.string('preferenceKey', 100).notNullable();
    t.jsonb('preferenceValue').notNullable();
    t.string('preferenceSource', 50);
    t.index('customerId');
    t.index('preferenceCategory');
    t.unique(['customerId', 'preferenceCategory', 'preferenceKey']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerPreference');
};
