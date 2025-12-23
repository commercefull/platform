exports.up = function (knex) {
  return knex.schema.createTable('productQaVote', t => {
    t.uuid('productQaVoteId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('questionId').references('productQaId').inTable('productQa').onDelete('CASCADE');
    t.uuid('answerId').references('productQaAnswerId').inTable('productQaAnswer').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.string('sessionId', 255);
    t.boolean('isHelpful').notNullable();
    t.string('ipAddress', 45);
    t.text('userAgent');

    t.index('questionId');
    t.index('answerId');
    t.index('customerId');
    t.index('sessionId');
    t.index('isHelpful');
    t.unique(['questionId', 'customerId']);
    t.unique(['answerId', 'customerId']);
    t.unique(['questionId', 'sessionId']);
    t.unique(['answerId', 'sessionId']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('productQaVote');
};
