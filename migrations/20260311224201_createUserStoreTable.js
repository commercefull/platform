exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('userStore');
  if (hasTable) return;

  await knex.schema.createTable('userStore', table => {
    table.uuid('userStoreId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('userId').notNullable();
    table.uuid('storeId').notNullable().references('storeId').inTable('store').onDelete('CASCADE');
    table.string('role', 50).notNullable();
    table.boolean('isPrimary').notNullable().defaultTo(false);
    table.boolean('isActive').notNullable().defaultTo(true);
    table.jsonb('permissions').notNullable().defaultTo('[]');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.unique(['userId', 'storeId']);
    table.index(['userId']);
    table.index(['storeId']);
    table.index(['role']);
    table.index(['isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('userStore');
};
