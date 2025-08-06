exports.up = function(knex) {
  return knex.schema.createTable('productQa', t => {
    t.uuid('productQaId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.text('question').notNullable();
    t.string('askerName', 255);
    t.string('askerEmail', 255);
    t.enum('status', ['pending', 'answered', 'closed']).notNullable().defaultTo('pending');
    t.boolean('isAnonymous').notNullable().defaultTo(false);
    t.integer('helpfulCount').notNullable().defaultTo(0);
    t.integer('viewCount').notNullable().defaultTo(0);
    t.jsonb('metadata');

    t.index('productId');
    t.index('customerId');
    t.index('status');
    t.index('helpfulCount');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productQa');
};
