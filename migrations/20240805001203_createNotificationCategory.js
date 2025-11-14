/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notificationCategory', t => {
    t.uuid('notificationCategoryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('code', 50).notNullable().unique();
    t.string('name', 100).notNullable();
    t.text('description');
    t.enum('defaultPriority', ['low', 'normal', 'high']).notNullable().defaultTo('normal');
    t.boolean('isTransactional').notNullable().defaultTo(false);
    
    t.index('code');
    t.index('isTransactional');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notificationCategory');
};
