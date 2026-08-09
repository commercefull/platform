/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('reportingReportExecution', t => {
    t.uuid('reportExecutionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('reportScheduleId').notNullable().references('reportScheduleId').inTable('reportingReportSchedule').onDelete('CASCADE');
    t.enu('status', ['pending', 'running', 'completed', 'failed']).notNullable().defaultTo('pending');
    t.timestamp('startedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('completedAt', { useTz: true });
    t.text('fileUrl');
    t.integer('fileSize');
    t.text('errorMessage');
    t.jsonb('metadata');

    t.index('reportScheduleId');
    t.index('status');
    t.index(['startedAt']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('reportingReportExecution');
};
