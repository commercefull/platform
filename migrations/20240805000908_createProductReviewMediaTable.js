exports.up = function (knex) {
  return knex.schema.createTable('productReviewMedia', t => {
    t.uuid('productReviewMediaId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('reviewId').notNullable().references('productReviewId').inTable('productReview').onDelete('CASCADE');
    t.enum('type', ['image', 'video', 'document']).notNullable();
    t.text('url').notNullable();
    t.string('filename', 255);
    t.integer('filesize');
    t.string('mimeType', 100);
    t.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');

    t.index('reviewId');
    t.index('type');
    t.index('status');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('productReviewMedia');
};
