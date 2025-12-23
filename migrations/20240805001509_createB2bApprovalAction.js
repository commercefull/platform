/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('b2bApprovalAction', function (table) {
    table.uuid('b2bApprovalActionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('b2bApprovalRequestId').notNullable().references('b2bApprovalRequestId').inTable('b2bApprovalRequest').onDelete('CASCADE');
    table.uuid('b2bApprovalWorkflowStepId').references('b2bApprovalWorkflowStepId').inTable('b2bApprovalWorkflowStep').onDelete('SET NULL');
    table.integer('stepNumber').notNullable();
    table.uuid('approverId').notNullable();
    table.string('approverType').notNullable().checkIn(['customer', 'companyUser', 'merchant']);
    table.string('action').notNullable().checkIn(['approve', 'reject', 'delegate', 'request_info', 'comment']);
    table.text('comment');
    table.uuid('delegatedTo');
    table.jsonb('requestedInfo');
    table.string('ipAddress');
    table.string('userAgent');
    table.jsonb('metadata');
    table.timestamp('actionAt').defaultTo(knex.fn.now());
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index('b2bApprovalRequestId');
    table.index('approverId');
    table.index('action');
    table.index('actionAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('b2bApprovalAction');
};
