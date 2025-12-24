/**
 * Migration: Create Store Channel Junction Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('storeChannel');
  if (hasTable) return;

  await knex.schema.createTable('storeChannel', table => {
    table.uuid('storeChannelId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('storeId', 50).notNullable();
    table.string('channelId', 50).notNullable();
    table.string('status', 20).defaultTo('active'); // 'active', 'inactive', 'pending'
    table.timestamp('launchDate').nullable();
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['storeId', 'channelId']);
    table.index('storeId');
    table.index('channelId');
    table.index('status');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storeChannel');
};
