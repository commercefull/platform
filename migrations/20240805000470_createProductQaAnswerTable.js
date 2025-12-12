exports.up = function(knex) {
  return knex.schema.createTable('productQaAnswer', t => {
    t.uuid('productQaAnswerId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('questionId').notNullable().references('productQaId').inTable('productQa').onDelete('CASCADE');
    t.text('answer').notNullable();
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.string('responderName', 255);
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.integer('helpfulCount').notNullable().defaultTo(0);
    t.integer('unhelpfulCount').notNullable().defaultTo(0);
    t.enum('status', ['pending', 'answered', 'unanswered']).notNullable().defaultTo('pending');
    

    t.index('questionId');
    t.index('customerId');
    t.index('isVerified');
    t.index('status');
    t.index('helpfulCount');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productQaAnswer');
};
