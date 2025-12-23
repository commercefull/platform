exports.up = function (knex) {
  return knex.schema.createTable('customerSegmentMembership', t => {
    t.uuid('customerSegmentMembershipId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('addedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('segmentId').notNullable().references('customerSegmentId').inTable('customerSegments').onDelete('CASCADE');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.string('source', 20).notNullable().defaultTo('manual').checkIn(['manual', 'automatic', 'import']);
    t.decimal('score', 5, 2);
    t.timestamp('expiresAt');

    t.index('customerId');
    t.index('segmentId');
    t.index('isActive');
    t.index('source');
    t.index('expiresAt');
    t.unique(['customerId', 'segmentId']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('customerSegmentMembership');
};
