/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipGroupMember', t => {
    t.uuid('membershipGroupMemberId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('groupId').notNullable().references('membershipGroupId').inTable('membershipGroup').onDelete('CASCADE');
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.string('membershipNumber', 100);
    t.enum('status', ['active', 'inactive', 'pending', 'removed']).notNullable().defaultTo('active');
    t.timestamp('joinedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiresAt');
    t.string('invitationEmail', 255);
    t.enum('invitationStatus', ['none', 'sent', 'accepted', 'declined', 'expired']).defaultTo('none');
    t.timestamp('invitationSentAt');
    t.timestamp('invitationAcceptedAt');
    t.text('notes');

    t.index('groupId');
    t.index('customerId');
    t.index('isPrimary');
    t.index('status');
    t.index('joinedAt');
    t.index('expiresAt');
    t.index('invitationEmail');
    t.index('invitationStatus');
    t.unique(['groupId', 'customerId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipGroupMember');
};
