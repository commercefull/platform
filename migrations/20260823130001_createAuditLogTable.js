exports.up = function (knex) {
  return knex.schema.createTable('auditLog', t => {
    t.uuid('auditLogId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    // Actor — who performed the action
    t.string('actorId').notNullable();
    t.string('actorType').notNullable(); // 'admin' | 'organization' | 'customer' | 'system'
    t.string('actorEmail');
    t.string('actorName');

    // Action — what happened
    t.string('action').notNullable(); // e.g. 'product.create', 'order.refund', 'inventory.adjust'
    t.string('resourceType').notNullable(); // e.g. 'product', 'order', 'inventory'
    t.string('resourceId');
    t.string('resourceName');

    // Context — where and how
    t.string('ipAddress');
    t.string('userAgent');
    t.string('correlationId');
    t.string('organizationId');
    t.string('storeId');

    // Payload — what changed
    t.jsonb('metadata'); // arbitrary structured data: old/new values, diff, etc.

    // Hash chain — each row links to the previous for tamper detection
    t.string('previousHash').notNullable().defaultTo('genesis');
    t.string('hash').notNullable(); // SHA-256 of (previousHash + canonical JSON of this row)

    // SOC2 compliance columns
    t.enu('category', ['authentication', 'authorization', 'dataAccess', 'dataModification', 'configuration', 'payment', 'compliance', 'security']).index();
    t.enu('outcome', ['success', 'failure', 'denied']).notNullable().defaultTo('success');
    t.enu('severity', ['info', 'warning', 'critical']).notNullable().defaultTo('info');
    t.string('requestId');
    t.jsonb('previousState');
    t.jsonb('newState');

    t.index('actorId');
    t.index('action');
    t.index('resourceType');
    t.index('resourceId');
    t.index('organizationId');
    t.index('storeId');
    t.index('createdAt');
    t.index('correlationId');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('auditLog');
};
