/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supportMessage', function (table) {
    table.uuid('supportMessageId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('supportTicketId').notNullable().references('supportTicketId').inTable('supportTicket').onDelete('CASCADE');
    table.uuid('senderId');
    table.string('senderType').notNullable(); // customer, agent, system
    table.string('senderName');
    table.string('senderEmail');
    table.text('message').notNullable();
    table.text('messageHtml');
    table.string('messageType').defaultTo('reply'); // reply, note, status_change, assignment, escalation, auto_reply
    table.boolean('isInternal').defaultTo(false);
    table.boolean('isAutoReply').defaultTo(false);
    table.boolean('isRead').defaultTo(false);
    table.timestamp('readAt');
    table.string('readBy');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index('supportTicketId');
    table.index('senderType');
    table.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('supportMessage');
};
