/**
 * Create OIDC Provider table
 */

exports.up = function (knex) {
  return knex.schema.createTable('oidcProvider', (table) => {
    table.string('providerId').primary();
    table.string('organizationId').notNullable().index();
    table.string('name').notNullable();
    table.text('issuerUrl').notNullable();
    table.string('clientId').notNullable();
    table.text('clientSecret').notNullable();
    table.jsonb('scopes').notNullable().defaultTo('["openid","email","profile"]');
    table.text('redirectUri').notNullable();
    table.boolean('usePkce').defaultTo(true);
    table.jsonb('claimMapping').notNullable().defaultTo('{}');
    table.boolean('isActive').defaultTo(true);
    table.boolean('useDiscovery').defaultTo(true);
    table.text('authorizationEndpoint');
    table.text('tokenEndpoint');
    table.text('userinfoEndpoint');
    table.text('jwksUri');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('oidcProvider');
};
