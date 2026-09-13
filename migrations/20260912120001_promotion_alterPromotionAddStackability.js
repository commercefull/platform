/**
 * Adds `stackability` enum to the `promotion` table, backfilled from `isExclusive`.
 * Keeps `isExclusive` temporarily for backward compatibility — drop in a follow-up
 * migration once all readers are migrated to `stackability`.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('promotion', t => {
      t.enu('stackability', ['none', 'stackable', 'exclusive']).notNullable().defaultTo('stackable');
      t.index('stackability');
    })
    .then(() => {
      // Backfill: isExclusive=true → 'exclusive', false → 'stackable'
      return knex('promotion').where('isExclusive', true).update({ stackability: 'exclusive' });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('promotion', t => {
    t.dropIndex('stackability');
    t.dropColumn('stackability');
  });
};
