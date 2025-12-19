/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('reportSchedule', t => {
    t.uuid('reportScheduleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('merchantId');
    t.string('name', 255).notNullable();
    t.string('reportType', 50).notNullable();
    t.enu('type', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).notNullable();
    t.jsonb('parameters').notNullable().defaultTo('{}');
    t.jsonb('recipients').notNullable().defaultTo('[]');
    t.enu('format', ['pdf', 'excel', 'csv', 'html']).notNullable().defaultTo('pdf');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('lastRunAt', { useTz: true });
    t.timestamp('nextRunAt', { useTz: true });
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('merchantId');
    t.index('isActive');
    t.index('nextRunAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('reportSchedule');
};
