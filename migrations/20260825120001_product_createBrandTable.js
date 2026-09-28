/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('brand', t => {
    t.uuid('brandId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deletedAt');
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.string('slug', 255).notNullable();
    t.text('description');
    t.string('logoUrl', 500);
    t.string('website', 500);
    t.string('countryOfOrigin', 2);
    t.enu('status', ['active', 'inactive', 'archived']).notNullable().defaultTo('active');
    t.jsonb('metadata');
    t.string('externalId', 255);

    t.index('organizationId');
    t.index('slug');
    t.index('name');
    t.index('status');
    t.index('externalId');
    t.unique(['organizationId', 'slug']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('brand');
};
