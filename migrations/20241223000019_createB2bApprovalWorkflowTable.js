/**
 * Migration: Create B2B Approval Workflow Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('b2bApprovalWorkflow');
  if (hasTable) return;

  await knex.schema.createTable('b2bApprovalWorkflow', table => {
    table.uuid('workflowId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('companyId').notNullable();
    table.string('name').notNullable();
    table.string('triggerType').notNullable(); // order, quote, purchase_order, credit_request
    table.jsonb('conditions').defaultTo('[]');
    table.jsonb('steps').notNullable();
    table.integer('escalationTimeoutHours').defaultTo(48);
    table.string('escalationAction').defaultTo('notify_manager'); // notify_manager, auto_approve, auto_reject
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['companyId']);
    table.index(['triggerType']);
    table.index(['isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bApprovalWorkflow');
};
