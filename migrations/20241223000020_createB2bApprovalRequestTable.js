/**
 * Migration: Create B2B Approval Request Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('b2bApprovalRequest');
  if (hasTable) return;

  await knex.schema.createTable('b2bApprovalRequest', table => {
    table.uuid('requestId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('workflowId').notNullable().references('workflowId').inTable('b2bApprovalWorkflow');
    table.string('companyId').notNullable();
    table.string('requestType').notNullable(); // order, quote, purchase_order, credit_request
    table.string('referenceId').notNullable(); // orderId, quoteId, etc.
    table.string('requestedById').notNullable();
    table.decimal('amount', 12, 2);
    table.string('currency').defaultTo('USD');
    table.integer('currentStep').defaultTo(0);
    table.string('status').defaultTo('pending'); // pending, approved, rejected, escalated, cancelled
    table.text('notes');
    table.timestamp('submittedAt').defaultTo(knex.fn.now());
    table.timestamp('completedAt');
    table.timestamp('escalatedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['companyId']);
    table.index(['status']);
    table.index(['requestType', 'referenceId']);
    table.index(['requestedById']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bApprovalRequest');
};
