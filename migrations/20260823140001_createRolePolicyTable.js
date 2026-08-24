exports.up = function (knex) {
  return knex.schema.createTable('rolePolicy', t => {
    t.uuid('rolePolicyId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    // Scope — null means system-wide default; org-scoped overrides
    t.string('organizationId').nullable();
    t.string('storeId').nullable();

    // Role identity
    t.string('roleName').notNullable(); // e.g. 'admin', 'manager', 'cashier', 'viewer', 'custom'
    t.string('description');

    // Policy — JSONB array of permission rules
    // Each rule: { resource, action, fields?, condition? }
    // resource: '*' | 'product' | 'order' | 'inventory' | ...
    // action: '*' | 'view' | 'create' | 'update' | 'delete' | 'manage' | 'export' | ...
    // fields: ['*'] | ['price', 'stock'] — field-level scoping
    // condition: { storeId: '$user.storeId' } — runtime-evaluated constraints
    t.jsonb('permissions').notNullable().defaultTo(knex.raw("'[]'"));

    // Whether this role is user-customizable or system-defined
    t.boolean('isSystem').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);

    t.unique(['organizationId', 'storeId', 'roleName']);
    t.index('organizationId');
    t.index('roleName');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('rolePolicy');
};
