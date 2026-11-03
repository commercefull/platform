exports.up = async function (knex) {
  const hasAdminUser = await knex.schema.hasTable('adminUser');
  if (!hasAdminUser) {
    await knex.schema.createTable('adminUser', table => {
      table.uuid('adminId').primary().defaultTo(knex.raw('uuidv7()'));
      table.string('email', 255).notNullable();
      table.string('name', 255).notNullable();
      table.string('passwordHash', 255).notNullable();
      table.string('role', 50).notNullable();
      table.jsonb('permissions').notNullable().defaultTo('[]');
      table.string('status', 20).notNullable().defaultTo('active');
      table.timestamp('lastLoginAt').nullable();
      table.timestamp('deletedAt').nullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      table.unique(['email']);
      table.index(['status']);
    });
  }

  const hasUser = await knex.schema.hasTable('user');
  if (!hasUser) {
    await knex.schema.createTable('user', table => {
      table.uuid('userId').primary().defaultTo(knex.raw('uuidv7()'));
      table.string('email', 255).notNullable();
      table.string('passwordHash', 255).notNullable();
      table.string('userType', 20).notNullable();
      table.string('status', 20).notNullable().defaultTo('active');
      table.string('firstName', 100).nullable();
      table.string('lastName', 100).nullable();
      table.boolean('emailVerified').notNullable().defaultTo(false);
      table.boolean('phoneVerified').notNullable().defaultTo(false);
      table.boolean('mfaEnabled').notNullable().defaultTo(false);
      table.integer('loginCount').notNullable().defaultTo(0);
      table.integer('failedLoginAttempts').notNullable().defaultTo(0);
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      table.unique(['email']);
      table.index(['userType']);
      table.index(['status']);
    });
  }

  const hasAdminUserRole = await knex.schema.hasTable('adminUserRole');
  if (!hasAdminUserRole) {
    await knex.schema.createTable('adminUserRole', table => {
      table.uuid('userId').notNullable().references('userId').inTable('user').onDelete('CASCADE');
      table.uuid('roleId').notNullable().references('roleId').inTable('role').onDelete('CASCADE');
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

      table.primary(['userId', 'roleId']);
      table.index(['roleId']);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('adminUserRole');
  await knex.schema.dropTableIfExists('user');
  await knex.schema.dropTableIfExists('adminUser');
};
