/**
 * Create SAML Provider table
 */

exports.up = function (knex) {
  return knex.schema.createTable('samlProvider', (table) => {
    table.string('providerId').primary();
    table.string('organizationId').notNullable().index();
    table.string('name').notNullable();
    table.text('entityId').notNullable();
    table.text('ssoUrl').notNullable();
    table.text('sloUrl');
    table.text('certificate').notNullable();
    table.text('spEntityId').notNullable();
    table.text('acsUrl').notNullable();
    table.string('binding').defaultTo('redirect');
    table.string('nameIdFormat').defaultTo('emailAddress');
    table.boolean('signAuthnRequest').defaultTo(false);
    table.text('spPrivateKey');
    table.text('spCertificate');
    table.jsonb('attributeMapping').notNullable().defaultTo('{}');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('samlProvider');
};
