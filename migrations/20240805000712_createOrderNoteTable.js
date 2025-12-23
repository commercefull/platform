exports.up = function (knex) {
  return knex.schema.createTable('orderNote', t => {
    t.uuid('orderNoteId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.text('content').notNullable();
    t.boolean('isCustomerVisible').notNullable().defaultTo(false);
    t.string('createdBy', 255);

    t.index('orderId');
    t.index('isCustomerVisible');
    t.index('createdAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('orderNote');
};
