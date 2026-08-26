/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('importJob', t => {
    t.uuid('importJobId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.string('jobType', 50).notNullable();
    t.string('source', 50).notNullable();
    t.enu('status', ['pending', 'running', 'completed', 'failed', 'cancelled', 'paused']).notNullable().defaultTo('pending');
    t.string('sourceStoreUrl', 500);
    t.string('sourceApiKey', 500);
    t.jsonb('sourceConfig');
    t.jsonb('stats').notNullable().defaultTo(JSON.stringify({
      totalRecords: 0, processedRecords: 0, successCount: 0, errorCount: 0, skippedCount: 0
    }));
    t.timestamp('startedAt');
    t.timestamp('completedAt');
    t.text('errorMessage');
    t.boolean('dryRun').notNullable().defaultTo(false);
    t.boolean('autoActivate').notNullable().defaultTo(true);
    t.jsonb('metadata');

    t.index('organizationId');
    t.index('jobType');
    t.index('status');
    t.index('source');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('importJob');
};
