/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('auditLog', t => {
    t.uuid('auditLogId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('entityType', 100).notNullable();
    t.string('entityId', 255).notNullable();
    t.enu('action', ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'custom']).notNullable();
    t.enu('actorType', ['user', 'admin', 'system', 'api']).notNullable();
    t.uuid('actorId');
    t.string('actorEmail', 255);
    t.string('actorIp', 45);
    t.text('userAgent');
    t.jsonb('previousData');
    t.jsonb('newData');
    t.jsonb('changedFields');
    t.jsonb('metadata');
    t.enu('status', ['success', 'failure', 'pending']).notNullable().defaultTo('success');
    t.text('errorMessage');
    t.integer('duration');
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('entityType');
    t.index('entityId');
    t.index('action');
    t.index('actorId');
    t.index(['createdAt']);
    t.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('auditLog');
};
