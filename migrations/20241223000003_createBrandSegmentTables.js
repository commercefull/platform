/**
 * Migration: Create Brand and Segment Tables
 */

exports.up = async function (knex) {
  // Create brand table
  await knex.schema.createTable('brand', table => {
    table.string('brandId').primary();
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.text('description');
    table.string('logoMediaId');
    table.string('coverImageMediaId');
    table.string('website');
    table.string('countryOfOrigin');
    table.boolean('isActive').defaultTo(true);
    table.boolean('isFeatured').defaultTo(false);
    table.integer('sortOrder').defaultTo(0);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['isActive']);
    table.index(['isFeatured']);
    table.index(['slug']);
  });

  // Create segment table
  await knex.schema.createTable('segment', table => {
    table.string('segmentId').primary();
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

  // Create segment_member table for efficient membership queries
  await knex.schema.createTable('segmentMember', table => {
    table.string('segmentMemberId').primary();
    table.string('segmentId').notNullable().references('segmentId').inTable('segment').onDelete('CASCADE');
    table.string('customerId').notNullable();
    table.string('membershipType').defaultTo('dynamic'); // static, dynamic
    table.timestamp('addedAt').defaultTo(knex.fn.now());

    table.unique(['segmentId', 'customerId']);
    table.index(['customerId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('segmentMember');
  await knex.schema.dropTableIfExists('segment');
  await knex.schema.dropTableIfExists('brand');
};
