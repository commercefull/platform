/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('b2bApprovalWorkflow', function(table) {
    table.uuid('b2bApprovalWorkflowId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('b2bCompanyId').references('b2bCompanyId').inTable('b2bCompany').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.string('workflowType').notNullable().checkIn(['order', 'quote', 'user', 'credit', 'return', 'custom']);
    table.boolean('isActive').defaultTo(true);
    table.boolean('isDefault').defaultTo(false);
    table.integer('priority').defaultTo(0);
    table.jsonb('conditions').defaultTo('{}');
    table.jsonb('rules').defaultTo('[]');
    table.decimal('minAmount', 15, 2);
    table.decimal('maxAmount', 15, 2);
    table.string('currency', 3).defaultTo('USD');
    table.boolean('requiresAllApprovers').defaultTo(false);
    table.integer('autoApproveAfterHours');
    table.boolean('autoRejectAfterExpiry').defaultTo(false);
    table.integer('expiryHours').defaultTo(72);
    table.boolean('notifyOnSubmit').defaultTo(true);
    table.boolean('notifyOnApprove').defaultTo(true);
    table.boolean('notifyOnReject').defaultTo(true);
    table.boolean('notifyRequester').defaultTo(true);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt');

    table.index('b2bCompanyId');
    table.index('workflowType');
    table.index('isActive');
    table.index('isDefault');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('b2bApprovalWorkflow');
};
