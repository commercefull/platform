/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('automationExecutionLog');
  if (hasTable) return;

  await knex.schema.createTable('automationExecutionLog', t => {
    t.uuid('executionLogId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('automationRuleId').notNullable();
    t.string('triggerType').notNullable();
    t.string('triggerEventId').nullable();
    t.string('correlationId').nullable();
    t.jsonb('triggerData').nullable();
    t.jsonb('conditionResults').nullable();
    t.jsonb('actionResults').nullable();
    t.string('status').notNullable().defaultTo('pending');
    t.text('errorMessage').nullable();
    t.integer('durationMs').nullable();
    t.timestamp('startedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('completedAt').nullable();
    t.uuid('organizationId').nullable();

    t.index(['automationRuleId', 'startedAt'], 'idx_execLog_rule_started');
    t.index(['status'], 'idx_execLog_status');
    t.index(['correlationId'], 'idx_execLog_correlation');
    t.index(['triggerEventId'], 'idx_execLog_triggerEvent');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('automationExecutionLog');
};
