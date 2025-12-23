/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('fraudRule', function (table) {
    table.uuid('fraudRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.text('description');
    table.string('ruleType').notNullable(); // velocity, amount, location, device, pattern, blacklist, custom
    table.string('entityType').defaultTo('order'); // order, customer, payment, address
    table.jsonb('conditions').notNullable(); // Rule conditions
    table.string('action').defaultTo('flag'); // flag, block, review, allow
    table.integer('riskScore').defaultTo(0); // 0-100
    table.integer('priority').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.integer('triggerCount').defaultTo(0);
    table.timestamp('lastTriggeredAt');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('ruleType');
    table.index('isActive');
    table.index('priority');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('fraudRule');
};
