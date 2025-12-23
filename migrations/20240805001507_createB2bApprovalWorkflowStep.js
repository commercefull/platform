/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('b2bApprovalWorkflowStep', function (table) {
    table.uuid('b2bApprovalWorkflowStepId').primary().defaultTo(knex.raw('uuidv7()'));
    table
      .uuid('b2bApprovalWorkflowId')
      .notNullable()
      .references('b2bApprovalWorkflowId')
      .inTable('b2bApprovalWorkflow')
      .onDelete('CASCADE');
    table.integer('stepNumber').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.string('approverType').notNullable().checkIn(['user', 'role', 'manager', 'department_head', 'custom']);
    table.uuid('approverId');
    table.string('approverRole');
    table.jsonb('approverIds').defaultTo('[]');
    table.boolean('requiresAll').defaultTo(false);
    table.integer('minApprovers').defaultTo(1);
    table.integer('timeoutHours');
    table.string('escalateTo');
    table.uuid('escalateToUserId');
    table.boolean('canDelegate').defaultTo(false);
    table.boolean('canSkip').defaultTo(false);
    table.jsonb('conditions');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['b2bApprovalWorkflowId', 'stepNumber']);
    table.index('b2bApprovalWorkflowId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('b2bApprovalWorkflowStep');
};
