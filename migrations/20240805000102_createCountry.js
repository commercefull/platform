/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('country', t => {
      t.uuid('countryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.string('code', 2).notNullable().unique();
      t.string('name', 100).notNullable();
      t.integer('numericCode');
      t.string('alpha3Code', 3);
      t.uuid('defaultCurrencyId').references('currencyId').inTable('currency');
      t.boolean('isActive').notNullable().defaultTo(true);
      t.string('flagIcon', 255);
      t.string('region', 100);
      t.index('code');
      t.index('defaultCurrencyId');
      t.index('isActive');
      t.index('region');
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('country');
};
