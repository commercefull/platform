exports.up = function (knex) {
  return knex.schema.createTable('loyaltyTier', t => {
    t.uuid('loyaltyTierId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('description');
    t.enum('type', ['points', 'amount']).notNullable();
    t.integer('pointsThreshold').notNullable();
    t.decimal('multiplier', 3, 2).notNullable().defaultTo(1.0);
    t.jsonb('benefits').notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index('pointsThreshold');
    t.index('isActive');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('loyaltyTier');
};
