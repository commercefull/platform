exports.up = function (knex) {
  return knex.schema.createTable('productReview', t => {
    t.uuid('productReviewId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.uuid('orderId').references('orderId').inTable('order');
    t.integer('rating').notNullable().checkIn([1, 2, 3, 4, 5]);
    t.string('title', 255);
    t.text('content');
    t.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
    t.boolean('isVerifiedPurchase').notNullable().defaultTo(false);
    t.boolean('isHighlighted').notNullable().defaultTo(false);
    t.integer('helpfulCount').notNullable().defaultTo(0);
    t.integer('unhelpfulCount').notNullable().defaultTo(0);
    t.integer('reportCount').notNullable().defaultTo(0);
    t.string('reviewerName', 255);
    t.string('reviewerEmail', 255);
    t.text('adminResponse');
    t.timestamp('adminResponseDate');

    t.index('productId');
    t.index('productVariantId');
    t.index('customerId');
    t.index('orderId');
    t.index('rating');
    t.index('status');
    t.index('isVerifiedPurchase');
    t.index('isHighlighted');
    t.index('createdAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('productReview');
};
