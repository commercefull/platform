exports.up = function (knex) {
  return knex.schema.createTable('eventOutbox', t => {
    t.uuid('eventOutboxId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.string('eventType', 100).notNullable();
    t.jsonb('payload').notNullable();
    t.string('correlationId');
    t.string('source');

    t.enum('status', ['pending', 'processing', 'processed', 'dead_letter']).notNullable().defaultTo('pending');
    t.integer('attempts').notNullable().defaultTo(0);
    t.integer('maxAttempts').notNullable().defaultTo(10);
    t.timestamp('nextRetryAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('processedAt');
    t.text('lastError');

    t.string('lockedBy'); // node identifier that claimed the event
    t.timestamp('lockedAt');

    t.index('status');
    t.index('nextRetryAt');
    t.index(['status', 'nextRetryAt']);
    t.index('eventType');
    t.index('correlationId');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('eventOutbox');
};
