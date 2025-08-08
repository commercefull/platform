/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notificationUnsubscribe', t => {
    t.uuid('notificationUnsubscribeId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('userId');
    t.string('email', 255);
    t.string('phone', 30);
    t.string('token', 100).notNullable().unique();
    t.string('category', 50);
    t.text('reason');
    t.boolean('isGlobal').notNullable().defaultTo(false);
    
    t.index('userId');
    t.index('email');
    t.index('phone');
    t.index('category');
    t.index('isGlobal');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notificationUnsubscribe');
};
