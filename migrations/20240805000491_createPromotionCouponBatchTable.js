exports.up = function(knex) {
  return knex.schema.createTable('promotionCouponBatch', t => {
    t.uuid('promotionCouponBatchId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.text('description');
    t.string('prefix', 50);
    t.string('suffix', 50);
    t.string('codePattern', 100);
    t.integer('codeLength').notNullable().defaultTo(8);
    t.integer('quantity').notNullable().defaultTo(1);
    t.integer('generatedCount').notNullable().defaultTo(0);
    t.enum('status', ['draft', 'pending', 'completed', 'failed', 'cancelled']).notNullable().defaultTo('pending');
    t.timestamp('expiryDate');
    t.uuid('merchantId').references('merchantId').inTable('merchant').onDelete('CASCADE');
    

    t.index('status');
    t.index('merchantId');
    t.index('expiryDate');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotionCouponBatch');
};
