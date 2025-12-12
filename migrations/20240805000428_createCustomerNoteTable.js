exports.up = function(knex) {
  return knex.schema.createTable('customerNote', t => {
    t.uuid('customerNoteId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('title', 255);
    t.text('content').notNullable();
    t.string('type', 50).defaultTo('general').checkIn(['general', 'support', 'order', 'payment', 'shipping', 'preference', 'flag']);
    t.boolean('isInternal').notNullable().defaultTo(true);
    t.boolean('isPinned').notNullable().defaultTo(false);
    t.string('relatedEntityType', 50);
    t.uuid('relatedEntityId');

    t.index('customerId');
    t.index('type');
    t.index('isPinned');
    t.index('relatedEntityType');
    t.index('relatedEntityId');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customerNote');
};
