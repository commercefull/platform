/**
 * Store currency membership — which currencies a store sells in.
 * Each store has one or more supported currencies; exactly one is the
 * default used when no explicit currency is selected.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('storeCurrency', t => {
      t.uuid('storeCurrencyId').primary().defaultTo(knex.raw('uuidv7()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('storeId').notNullable().references('storeId').inTable('store').onDelete('CASCADE');
      t.uuid('currencyId').notNullable().references('currencyId').inTable('currency');
      t.boolean('isDefault').notNullable().defaultTo(false);
      t.boolean('isActive').notNullable().defaultTo(true);
      t.unique(['storeId', 'currencyId']);
      t.index('storeId');
      t.index('currencyId');
    })
    .then(() =>
      // At most one default currency per store
      knex.raw('CREATE UNIQUE INDEX "storeCurrency_oneDefaultPerStore" ON "storeCurrency" ("storeId") WHERE "isDefault"'),
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('storeCurrency');
};
