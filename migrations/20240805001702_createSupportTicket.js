/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('supportTicket', function(table) {
    table.uuid('supportTicketId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('ticketNumber').unique().notNullable();
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.string('email').notNullable();
    table.string('name');
    table.string('phone');
    table.string('subject').notNullable();
    table.text('description');
    table.string('status').defaultTo('open'); // open, pending, in_progress, waiting_customer, resolved, closed
    table.string('priority').defaultTo('medium'); // low, medium, high, urgent
    table.string('category').defaultTo('other'); // order, shipping, return, product, payment, account, technical, other
    table.string('subcategory');
    table.string('channel').defaultTo('web'); // web, email, phone, chat, social
    table.uuid('assignedAgentId').references('supportAgentId').inTable('supportAgent').onDelete('SET NULL');
    table.uuid('lastMessageBy');
    table.string('lastMessageByType').defaultTo('customer'); // customer, agent, system
    table.timestamp('lastMessageAt');
    table.timestamp('firstResponseAt');
    table.integer('responseTimeMinutes');
    table.timestamp('resolvedAt');
    table.integer('resolutionTimeMinutes');
    table.string('resolutionType'); // resolved, duplicate, spam, no_response, escalated
    table.text('resolutionNotes');
    table.integer('customerSatisfaction'); // 1-5
    table.text('customerFeedback');
    table.boolean('feedbackRequested').defaultTo(false);
    table.timestamp('feedbackRequestedAt');
    table.specificType('tags', 'text[]');
    table.boolean('isEscalated').defaultTo(false);
    table.uuid('escalatedTo').references('supportAgentId').inTable('supportAgent').onDelete('SET NULL');
    table.timestamp('escalatedAt');
    table.string('escalationReason');
    table.boolean('isSpam').defaultTo(false);
    table.integer('reopenCount').defaultTo(0);
    table.jsonb('customFields');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('closedAt');
    table.timestamp('dueAt');
    
    table.index('customerId');
    table.index('orderId');
    table.index(['status', 'priority']);
    table.index('assignedAgentId');
    table.index('ticketNumber');
    table.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('supportTicket');
};
