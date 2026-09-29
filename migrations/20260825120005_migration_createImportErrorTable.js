/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('importError', t => {
    t.uuid('importErrorId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('importJobId').notNullable().references('importJobId').inTable('importJob').onDelete('CASCADE');
    t.string('entityType', 100).notNullable();
    t.string('sourceId', 255);
    t.enu('severity', ['error', 'warning', 'info']).notNullable().defaultTo('error');
    t.text('message').notNullable();
    t.text('stackTrace');
    t.jsonb('rawData');
    t.timestamp('resolvedAt');

    t.index('importJobId');
    t.index('entityType');
    t.index('severity');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('importError');
};
