exports.up = function(knex) {
  return knex.schema.createTable('promotionAction', t => {
    t.uuid('promotionActionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionId').notNullable().references('promotionId').inTable('promotion').onDelete('CASCADE');
    t.string('name', 255);
    t.text('description');
    t.enum('actionType', ['discount', 'freeShipping', 'giftCard', 'coupon', 'custom']).notNullable();
    t.jsonb('value').notNullable();
    t.string('targetType', 100);
    t.jsonb('targetIds');
    t.integer('sortOrder').notNullable().defaultTo(0);
    

    t.index('promotionId');
    t.index('actionType');
    t.index('targetType');
    t.index('sortOrder');
    t.unique(['promotionId', 'actionType', 'targetType', 'sortOrder']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotionAction');
};
