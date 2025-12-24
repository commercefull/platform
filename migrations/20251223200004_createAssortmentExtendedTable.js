/**
 * Migration: Create Extended Assortment Table (if not exists) or add extended fields
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortment');
  
  if (!hasTable) {
    await knex.schema.createTable('assortment', table => {
      table.uuid('assortmentId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('organizationId').notNullable();
      table.string('name', 255).notNullable();
      table.text('description').nullable();
      table.string('scopeType', 30).notNullable(); // 'global', 'store', 'channel', 'seller', 'account'
      table.boolean('isDefault').defaultTo(false);
      table.boolean('isActive').defaultTo(true);
      table.jsonb('metadata').defaultTo('{}');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      table.timestamp('deletedAt').nullable();

      table.index('organizationId');
      table.index('scopeType');
      table.index('isDefault');
      table.index('isActive');
    });
  } else {
    // Add extended fields if they don't exist
    const hasIsActive = await knex.schema.hasColumn('assortment', 'isActive');
    if (!hasIsActive) {
      await knex.schema.alterTable('assortment', table => {
        table.boolean('isActive').defaultTo(true);
        table.jsonb('metadata').defaultTo('{}');
      });
    }
  }
};

exports.down = async function (knex) {
  const hasIsActive = await knex.schema.hasColumn('assortment', 'isActive');
  if (hasIsActive) {
    await knex.schema.alterTable('assortment', table => {
      table.dropColumn('isActive');
      table.dropColumn('metadata');
    });
  }
};
