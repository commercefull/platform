exports.up = function(knex) {
  return knex.schema.createTable('productReviewVote', t => {
    t.uuid('productReviewVoteId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('reviewId').notNullable().references('productReviewId').inTable('productReview').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('sessionId', 255).notNullable();
    t.boolean('isHelpful').notNullable();
    t.string('ipAddress', 45);
    t.text('userAgent');

    t.index('reviewId');
    t.index('customerId');
    t.index('sessionId');
    t.index('isHelpful');
    t.unique(['reviewId', 'customerId']);
    t.unique(['reviewId', 'sessionId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productReviewVote');
};
