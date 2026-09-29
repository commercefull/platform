/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('segmentMembership');
  if (hasTable) return;

  await knex.schema.createTable('segmentMembership', t => {
    t.uuid('segmentMembershipId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('segmentId').notNullable();
    t.uuid('customerId').notNullable();
    t.jsonb('snapshotData').nullable();
    t.decimal('matchScore', 5, 4).nullable();
    t.timestamp('firstMatchedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('lastMatchedAt').notNullable().defaultTo(knex.fn.now());
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.unique(['segmentId', 'customerId'], 'uq_segmentMembership_segment_customer');
    t.index(['segmentId', 'isActive'], 'idx_segmentMembership_segment_active');
    t.index(['customerId', 'isActive'], 'idx_segmentMembership_customer_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('segmentMembership');
};
