/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentRedirect', t => {
    t.uuid('contentRedirectId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.text('sourceUrl').notNullable().comment('The source URL pattern to match for redirection');
    t.text('targetUrl').notNullable().comment('The target URL to redirect to');
    t.enu('statusCode', [301, 302, 303, 307, 308], { useNative: true, enumName: 'redirect_status_code_type' }).notNullable().defaultTo(301).comment('HTTP status code to use for the redirect');
    t.boolean('isRegex').notNullable().defaultTo(false).comment('Whether sourceUrl is a regex pattern');
    t.boolean('isActive').notNullable().defaultTo(true).comment('Whether this redirect is active');
    t.integer('hits').notNullable().defaultTo(0).comment('Count of times this redirect was used');
    t.timestamp('lastUsed').comment('When this redirect was last used');
    t.text('notes').comment('Administrative notes about this redirect');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now()).comment('When this redirect was created');
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now()).comment('When this redirect was last updated');
    t.uuid('createdBy').comment('Reference to admin user who created this redirect');
    t.uuid('updatedBy').comment('Reference to admin user who last updated this redirect');
    t.index('sourceUrl');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentRedirect');
};
