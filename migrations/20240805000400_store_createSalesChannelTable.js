exports.up = async function (knex) {
  if (await knex.schema.hasTable('salesChannel')) return;

  await knex.schema.createTable('salesChannel', t => {
    t.uuid('salesChannelId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.string('code', 100).notNullable();
    t.string('name', 150).notNullable();
    t.enu('type', ['web', 'marketplace', 'social', 'pos', 'agentic', 'api', 'other']).notNullable();
    t.enu('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.jsonb('config').notNullable().defaultTo('{}');
    t.jsonb('metadata').notNullable().defaultTo('{}');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.unique(['organizationId', 'code']);
    t.index('organizationId');
    t.index('status');
    t.index('type');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('salesChannel');
};
