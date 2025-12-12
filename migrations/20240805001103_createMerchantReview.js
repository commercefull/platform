/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantReview', t => {
    t.uuid('merchantReviewId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order');
    t.integer('rating').notNullable();
    t.string('title', 255);
    t.text('content');
    t.boolean('isVerifiedPurchase').notNullable().defaultTo(false);
    t.boolean('isApproved').notNullable().defaultTo(false);
    t.boolean('isPublished').notNullable().defaultTo(false);
    t.timestamp('publishedAt');
    t.enum('status', ['pending', 'approved', 'rejected', 'removed']).notNullable().defaultTo('pending');
    t.timestamp('reviewedAt');
    t.uuid('reviewedBy');
    t.text('reviewNotes');
    
    t.check('rating BETWEEN 1 AND 5');
    t.index('merchantId');
    t.index('customerId');
    t.index('orderId');
    t.index('rating');
    t.index('isVerifiedPurchase');
    t.index('isApproved');
    t.index('isPublished');
    t.index('status');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantReview');
};
