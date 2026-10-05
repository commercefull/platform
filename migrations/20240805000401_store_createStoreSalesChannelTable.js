exports.up = async function (knex) {
  if (await knex.schema.hasTable('storeSalesChannel')) return;

  await knex.schema.createTable('storeSalesChannel', t => {
    t.uuid('storeSalesChannelId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('storeId').notNullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('salesChannelId').notNullable().references('salesChannelId').inTable('salesChannel').onDelete('CASCADE');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.jsonb('settings').notNullable().defaultTo('{}');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.unique(['storeId', 'salesChannelId']);
    t.index('storeId');
    t.index('salesChannelId');
    t.index('isActive');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storeSalesChannel');
};
