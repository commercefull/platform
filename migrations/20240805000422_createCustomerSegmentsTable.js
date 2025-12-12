exports.up = function(knex) {
  return knex.schema.createTable('customerSegments', t => {
    t.uuid('customerSegmentId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('description');
    t.jsonb('conditions');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isAutomatic').notNullable().defaultTo(false);
    t.timestamp('lastRun');
    t.integer('memberCount').defaultTo(0);
    t.integer('priority').defaultTo(0);
    

    t.index('name');
    t.index('isActive');
    t.index('isAutomatic');
    t.index('priority');
  })

};

exports.down = function(knex) {
  return knex.schema.dropTable('customerSegments');
};
