exports.up = function(knex) {
  return knex.schema.createTable('productQaVote', t => {
    t.uuid('productQaVoteId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('questionId').references('productQaId').inTable('productQa').onDelete('CASCADE');
    t.uuid('answerId').references('productQaAnswerId').inTable('productQaAnswer').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.string('sessionId', 255);
    t.boolean('isHelpful').notNullable();
    t.inet('ipAddress');
    t.text('userAgent');

    t.index('questionId');
    t.index('answerId');
    t.index('customerId');
    t.index('sessionId');
    t.index('isHelpful');
    t.unique(['questionId', 'customerId'], { predicate: knex.raw('"customerId" IS NOT NULL AND "answerId" IS NULL') });
    t.unique(['answerId', 'customerId'], { predicate: knex.raw('"customerId" IS NOT NULL AND "answerId" IS NOT NULL') });
    t.unique(['questionId', 'sessionId'], { predicate: knex.raw('"sessionId" IS NOT NULL AND "customerId" IS NULL AND "answerId" IS NULL') });
    t.unique(['answerId', 'sessionId'], { predicate: knex.raw('"sessionId" IS NOT NULL AND "customerId" IS NULL AND "answerId" IS NOT NULL') });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productQaVote');
};
