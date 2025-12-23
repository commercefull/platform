/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipStatusLog', t => {
    t.uuid('membershipStatusLogId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('subscriptionId').notNullable().references('membershipSubscriptionId').inTable('membershipSubscription').onDelete('CASCADE');
    t.string('previousStatus', 20);
    t.string('newStatus', 20).notNullable();
    t.text('changeReason');
    t.enum('changeSource', ['system', 'admin', 'customer', 'payment', 'api']).notNullable().defaultTo('system');

    t.uuid('createdBy');
    t.index('subscriptionId');
    t.index('previousStatus');
    t.index('newStatus');
    t.index('changeSource');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipStatusLog');
};
