/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supportAgent', function (table) {
    table.uuid('supportAgentId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('email').unique().notNullable();
    table.string('firstName').notNullable();
    table.string('lastName').notNullable();
    table.string('displayName');
    table.string('avatarUrl');
    table.string('role').defaultTo('agent'); // agent, supervisor, admin
    table.string('department');
    table.specificType('skills', 'text[]');
    table.specificType('languages', 'text[]');
    table.boolean('isActive').defaultTo(true);
    table.boolean('isAvailable').defaultTo(true);
    table.integer('maxTickets').defaultTo(20);
    table.integer('currentTickets').defaultTo(0);
    table.integer('totalTicketsHandled').defaultTo(0);
    table.integer('averageResponseTimeMinutes');
    table.integer('averageResolutionTimeMinutes');
    table.decimal('satisfactionScore', 3, 2);
    table.integer('satisfactionCount').defaultTo(0);
    table.string('timezone').defaultTo('UTC');
    table.jsonb('workingHours');
    table.jsonb('notificationPreferences');
    table.jsonb('metadata');
    table.timestamp('lastActiveAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('email');
    table.index('isActive');
    table.index('department');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('supportAgent');
};
