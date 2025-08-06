exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "attributeType" AS ENUM (
      'text',
      'textarea',
      'boolean',
      'select',
      'multiselect',
      'date',
      'datetime',
      'price',
      'media',
      'color',
      'number'
    );
    CREATE TYPE "attributeInputType" AS ENUM (
      'text',
      'textarea',
      'boolean',
      'select',
      'multiselect',
      'radio',
      'checkbox',
      'date',
      'price',
      'media',
      'color',
      'number'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "attributeType";
    DROP TYPE IF EXISTS "attributeInputType";
  `);
};
