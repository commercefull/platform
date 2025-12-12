/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('b2bCompanyUser', function(table) {
    table.uuid('b2bCompanyUserId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('b2bCompanyId').notNullable().references('b2bCompanyId').inTable('b2bCompany').onDelete('CASCADE');
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.string('email').notNullable();
    table.string('firstName');
    table.string('lastName');
    table.string('phone');
    table.string('jobTitle');
    table.string('department');
    table.string('role').defaultTo('buyer').checkIn(['admin', 'manager', 'buyer', 'approver', 'viewer']);
    table.jsonb('permissions').defaultTo('[]');
    table.boolean('isActive').defaultTo(true);
    table.boolean('isPrimaryContact').defaultTo(false);
    table.boolean('isBillingContact').defaultTo(false);
    table.boolean('canPlaceOrders').defaultTo(true);
    table.boolean('canViewPrices').defaultTo(true);
    table.boolean('canApproveOrders').defaultTo(false);
    table.boolean('canManageUsers').defaultTo(false);
    table.boolean('canManageCompany').defaultTo(false);
    table.decimal('orderLimit', 15, 2);
    table.decimal('monthlyLimit', 15, 2);
    table.decimal('currentMonthSpend', 15, 2).defaultTo(0);
    table.boolean('requiresApproval').defaultTo(false);
    table.uuid('approverId');
    table.string('inviteToken');
    table.timestamp('invitedAt');
    table.timestamp('inviteExpiresAt');
    table.timestamp('acceptedAt');
    table.timestamp('lastLoginAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt');

    table.unique(['b2bCompanyId', 'email']);
    table.index('b2bCompanyId');
    table.index('customerId');
    table.index('email');
    table.index('role');
    table.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('b2bCompanyUser');
};
