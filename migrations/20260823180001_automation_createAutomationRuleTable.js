/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('automationRule');
  if (hasTable) return;

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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('automationRule');
};
