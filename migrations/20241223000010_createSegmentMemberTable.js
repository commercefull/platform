/**
 * Migration: Create Segment Member Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('segmentMember');
  if (hasTable) return;

  await knex.schema.createTable('segmentMember', table => {
    table.uuid('segmentMemberId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('segmentId').notNullable().references('segmentId').inTable('segment').onDelete('CASCADE');
    table.uuid('customerId').notNullable();
    table.string('membershipType').defaultTo('dynamic'); // static, dynamic
    table.timestamp('addedAt').defaultTo(knex.fn.now());

    table.unique(['segmentId', 'customerId']);
    table.index(['customerId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('segmentMember');
};
