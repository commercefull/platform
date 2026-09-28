/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('segmentDefinition');
  if (hasTable) return;

  await knex.schema.createTable('segmentDefinition', t => {
    t.uuid('segmentId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name').notNullable();
    t.string('code').notNullable().unique();
    t.text('description').nullable();
    t.jsonb('conditions').notNullable().defaultTo('{}');
    t.string('matchMode').notNullable().defaultTo('all');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isSystem').notNullable().defaultTo(false);
    t.string('color').nullable();
    t.string('icon').nullable();
    t.integer('memberCount').notNullable().defaultTo(0);
    t.timestamp('lastEvaluatedAt').nullable();
    t.uuid('organizationId').nullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deletedAt').nullable();

    t.index(['isActive', 'deletedAt'], 'idx_segmentDef_active');
    t.index(['organizationId', 'isActive'], 'idx_segmentDef_org_active');
    t.index(['code'], 'idx_segmentDef_code');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('segmentDefinition');
};
