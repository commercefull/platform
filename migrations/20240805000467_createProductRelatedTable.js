exports.up = function(knex) {
  return knex.schema.createTable('productRelated', t => {
    t.uuid('productRelatedId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('relatedProductId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.enum('type', ['related', 'accessory', 'bundle']).notNullable().defaultTo('related');
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('isAutomated').notNullable().defaultTo(false);
    

    t.index('productId');
    t.index('relatedProductId');
    t.index('type');
    t.index('position');
    t.index('isAutomated');
    t.unique(['productId', 'relatedProductId', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productRelated');
};
