exports.up = function(knex) {
  return knex.schema.createTable('productReview', t => {
    t.uuid('productReviewId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('product_variant').onDelete('CASCADE');
    t.uuid('customerId').references('id').inTable('customer').onDelete('SET NULL');
    t.uuid('orderId').references('id').inTable('order');
    t.integer('rating').notNullable().checkIn([1, 2, 3, 4, 5]);
    t.string('title', 255);
    t.text('content');
    t.enu('status', null, { useNative: true, existingType: true, enumName: 'reviewStatus' }).notNullable().defaultTo('pending');
    t.boolean('isVerifiedPurchase').notNullable().defaultTo(false);
    t.boolean('isHighlighted').notNullable().defaultTo(false);
    t.integer('helpfulCount').notNullable().defaultTo(0);
    t.integer('unhelpfulCount').notNullable().defaultTo(0);
    t.integer('reportCount').notNullable().defaultTo(0);
    t.string('reviewerName', 255);
    t.string('reviewerEmail', 255);
    t.text('adminResponse');
    t.timestamp('adminResponseDate');
    t.jsonb('metadata');

    t.index('productId');
    t.index('variantId');
    t.index('customerId');
    t.index('orderId');
    t.index('rating');
    t.index('status');
    t.index('isVerifiedPurchase');
    t.index('isHighlighted');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productReview');
};
