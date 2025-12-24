/**
 * Migration: Create Assortment Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortment');
  if (hasTable) return;

  await knex.schema.createTable('assortment', table => {
    table.uuid('assortmentId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('organizationId', 50).notNullable();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('scopeType', 20).notNullable(); // 'store', 'seller', 'account', 'channel'
    table.boolean('isDefault').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable();

    table.index('organizationId');
    table.index('scopeType');
    table.index('isDefault');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortment');
};
