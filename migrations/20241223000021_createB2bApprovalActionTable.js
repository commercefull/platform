/**
 * Migration: Create B2B Approval Action Table (approval history)
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('b2bApprovalAction');
  if (hasTable) return;

  await knex.schema.createTable('b2bApprovalAction', table => {
    table.uuid('actionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('requestId').notNullable().references('requestId').inTable('b2bApprovalRequest').onDelete('CASCADE');
    table.integer('stepNumber').notNullable();
    table.string('actionType').notNullable(); // approve, reject, escalate, comment
    table.string('actionById').notNullable();
    table.string('actionByRole');
    table.text('comments');
    table.timestamp('actionAt').defaultTo(knex.fn.now());

    table.index(['requestId']);
    table.index(['actionById']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bApprovalAction');
};
