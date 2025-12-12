/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipGroup', t => {
    t.uuid('membershipGroupId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('subscriptionId').notNullable().references('membershipSubscriptionId').inTable('membershipSubscription').onDelete('CASCADE');
    t.string('name', 100);
    t.uuid('primaryMemberId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.integer('maxMembers').defaultTo(5);
    t.integer('currentMembers').notNullable().defaultTo(1);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.text('notes');
    
    t.index('subscriptionId');
    t.index('primaryMemberId');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipGroup');
};
