/**
 * Migration: Create Extended Loyalty Tier Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('loyaltyTier');
  
  if (!hasTable) {
    await knex.schema.createTable('loyaltyTier', table => {
      table.uuid('tierId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('programId').nullable();
      table.string('name', 100).notNullable();
      table.text('description').nullable();
      table.integer('level').notNullable();
      table.integer('pointsThreshold').notNullable();
      table.integer('purchasesThreshold').defaultTo(0);
      table.decimal('pointsMultiplier', 5, 2).defaultTo(1);
      table.jsonb('benefits').defaultTo('[]');
      table.string('iconUrl', 500).nullable();
      table.string('color', 20).nullable();
      table.boolean('isActive').defaultTo(true);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.index('programId');
      table.index('level');
      table.index('isActive');
    });
  } else {
    // Add extended fields if they don't exist
    const hasIconUrl = await knex.schema.hasColumn('loyaltyTier', 'iconUrl');
    if (!hasIconUrl) {
      await knex.schema.alterTable('loyaltyTier', table => {
        table.string('iconUrl', 500).nullable();
        table.string('color', 20).nullable();
        table.integer('purchasesThreshold').defaultTo(0);
      });
    }
  }
};

exports.down = async function (knex) {
  const hasIconUrl = await knex.schema.hasColumn('loyaltyTier', 'iconUrl');
  if (hasIconUrl) {
    await knex.schema.alterTable('loyaltyTier', table => {
      table.dropColumn('iconUrl');
      table.dropColumn('color');
      table.dropColumn('purchasesThreshold');
    });
  }
};
