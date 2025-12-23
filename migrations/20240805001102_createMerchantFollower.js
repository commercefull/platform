/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantFollower', t => {
    t.uuid('merchantFollowerId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.timestamp('followedAt').notNullable().defaultTo(knex.fn.now());
    t.boolean('emailNotifications').notNullable().defaultTo(true);
    t.boolean('pushNotifications').notNullable().defaultTo(false);

    t.index('merchantId');
    t.index('customerId');
    t.index('followedAt');
    t.unique(['merchantId', 'customerId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantFollower');
};
