exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "couponBatchStatus" AS ENUM (
      'draft',
      'pending',
      'completed',
      'failed',
      'cancelled'
    );
  `)
  .then(() => knex.schema.createTable('coupon_batch', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 255).notNullable();
    t.text('description');
    t.string('prefix', 50);
    t.string('suffix', 50);
    t.string('codePattern', 100);
    t.integer('codeLength').notNullable().defaultTo(8);
    t.integer('quantity').notNullable().defaultTo(1);
    t.integer('generatedCount').notNullable().defaultTo(0);
    t.enu('status', null, { useNative: true, existingType: true, enumName: 'couponBatchStatus' }).notNullable().defaultTo('pending');
    t.timestamp('expiryDate');
    t.uuid('merchantId').references('id').inTable('merchant');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('status');
    t.index('merchantId');
    t.index('expiryDate');
    t.index('createdAt');
  }));
};

exports.down = function(knex) {
  return knex.schema.dropTable('coupon_batch')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS "couponBatchStatus";'));
};
