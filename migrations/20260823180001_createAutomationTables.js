/**
 * Create automation module tables:
 * - automationRule: rule definitions with trigger/condition/action DSL
 * - automationExecutionLog: execution log for audit and debugging
 */

exports.up = async function (knex) {
  // ── automationRule ─────────────────────────────────────────────
  const hasAutomationRule = await knex.schema.hasTable('automationRule');
  if (!hasAutomationRule) {
    await knex.schema.createTable('automationRule', t => {
      t.uuid('automationRuleId').primary().defaultTo(knex.raw('uuidv7()'));
      t.string('name').notNullable();
      t.string('description').nullable();
      t.string('triggerType').notNullable();
      t.jsonb('triggerConfig').notNullable().defaultTo('{}');
      t.jsonb('conditions').notNullable().defaultTo('[]');
      t.string('conditionMatchMode').notNullable().defaultTo('all');
      t.jsonb('actions').notNullable().defaultTo('[]');
      t.string('actionExecutionMode').notNullable().defaultTo('sequential');
      t.boolean('isActive').notNullable().defaultTo(true);
      t.integer('priority').notNullable().defaultTo(0);
      t.integer('executionCount').notNullable().defaultTo(0);
      t.integer('successCount').notNullable().defaultTo(0);
      t.integer('failureCount').notNullable().defaultTo(0);
      t.timestamp('lastTriggeredAt').nullable();
      t.timestamp('lastExecutedAt').nullable();
      t.uuid('organizationId').nullable();
      t.string('createdBy').nullable();
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('deletedAt').nullable();

      t.index(['isActive', 'deletedAt'], 'idx_automationRule_active');
      t.index(['triggerType', 'isActive'], 'idx_automationRule_trigger_active');
      t.index(['organizationId', 'isActive'], 'idx_automationRule_org_active');
      t.index(['priority'], 'idx_automationRule_priority');
    });
  }

  // ── automationExecutionLog ─────────────────────────────────────
  const hasExecutionLog = await knex.schema.hasTable('automationExecutionLog');
  if (!hasExecutionLog) {
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
  }
};

exports.down = async function (knex) {
  const hasExecutionLog = await knex.schema.hasTable('automationExecutionLog');
  if (hasExecutionLog) await knex.schema.dropTable('automationExecutionLog');

  const hasAutomationRule = await knex.schema.hasTable('automationRule');
  if (hasAutomationRule) await knex.schema.dropTable('automationRule');
};
