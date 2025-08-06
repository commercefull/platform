exports.up = function(knex) {
  return knex.schema.createTable('merchantEmailVerification', t => {
    t.uuid('merchantEmailVerificationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('token', 255).notNullable();
    t.timestamp('expiresAt').notNullable();
    t.boolean('isUsed').notNullable().defaultTo(false);
    t.index('merchantId');
    t.index('token');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('merchantEmailVerification');
};
