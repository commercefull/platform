/**
 * Migration: Create Segment Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('segment');
  if (hasTable) return;

  await knex.schema.createTable('segment', table => {
    table.uuid('segmentId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.text('description');
    table.string('type').notNullable(); // static, dynamic, hybrid
    table.jsonb('rules').defaultTo('[]');
    table.jsonb('staticMemberIds').defaultTo('[]');
    table.string('evaluationFrequency').defaultTo('daily'); // realtime, hourly, daily, weekly
    table.timestamp('lastEvaluatedAt');
    table.integer('memberCount').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['type']);
    table.index(['isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('segment');
};
