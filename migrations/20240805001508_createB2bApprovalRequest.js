/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('b2bApprovalRequest', function (table) {
    table.uuid('b2bApprovalRequestId').primary().defaultTo(knex.raw('uuidv7()'));
    table
      .uuid('b2bApprovalWorkflowId')
      .notNullable()
      .references('b2bApprovalWorkflowId')
      .inTable('b2bApprovalWorkflow')
      .onDelete('CASCADE');
    table.uuid('b2bCompanyId').references('b2bCompanyId').inTable('b2bCompany').onDelete('SET NULL');
    table.string('requestType').notNullable().checkIn(['order', 'quote', 'user', 'credit', 'return', 'custom']);
    table.uuid('entityId').notNullable();
    table.string('entityType').notNullable();
    table.uuid('requesterId').notNullable();
    table.string('requesterType').notNullable().checkIn(['customer', 'companyUser', 'merchant']);
    table.string('status').defaultTo('pending').checkIn(['pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'expired']);
    table.integer('currentStep').defaultTo(1);
    table.integer('totalSteps').notNullable();
    table.decimal('amount', 15, 2);
    table.string('currency', 3).defaultTo('USD');
    table.text('requestNotes');
    table.text('approvalNotes');
    table.text('rejectionReason');
    table.jsonb('approvalHistory').defaultTo('[]');
    table.uuid('finalApproverId');
    table.timestamp('submittedAt');
    table.timestamp('approvedAt');
    table.timestamp('rejectedAt');
    table.timestamp('cancelledAt');
    table.timestamp('expiresAt');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('b2bApprovalWorkflowId');
    table.index('b2bCompanyId');
    table.index('entityId');
    table.index('requesterId');
    table.index('status');
    table.index('requestType');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('b2bApprovalRequest');
};
