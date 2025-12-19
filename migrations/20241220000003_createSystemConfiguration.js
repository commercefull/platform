/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('systemConfiguration', t => {
    t.uuid('configId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.enum('systemMode', ['marketplace', 'multi_store', 'single_store']).notNullable().defaultTo('single_store');
    t.jsonb('features');
    t.jsonb('businessSettings');
    t.jsonb('platformSettings');
    t.jsonb('securitySettings');
    t.jsonb('notificationSettings');
    t.jsonb('integrationSettings');
    t.jsonb('metadata');

    t.index('systemMode');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('systemConfiguration');
};
