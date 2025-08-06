exports.up = function(knex) {
  return knex.schema.createTable('productReviewVote', t => {
    t.uuid('productReviewVoteId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('reviewId').notNullable().references('productReviewId').inTable('productReview').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.string('sessionId', 255);
    t.boolean('isHelpful').notNullable();
    t.inet('ipAddress');
    t.text('userAgent');

    t.index('reviewId');
    t.index('customerId');
    t.index('sessionId');
    t.index('isHelpful');
    t.unique(['reviewId', 'customerId'], { predicate: knex.raw('"customerId" IS NOT NULL') });
    t.unique(['reviewId', 'sessionId'], { predicate: knex.raw('"sessionId" IS NOT NULL AND "customerId" IS NULL') });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productReviewVote');
};
