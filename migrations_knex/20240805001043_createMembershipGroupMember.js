/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membership_group_member', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('group_id').notNullable().references('id').inTable('membership_group').onDelete('CASCADE');
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.string('membership_number', 100);
    t.enu('status', ['active', 'inactive', 'pending', 'removed'], { useNative: true, enumName: 'membership_group_member_status' }).notNullable().defaultTo('active');
    t.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expires_at');
    t.string('invitation_email', 255);
    t.enu('invitation_status', ['none', 'sent', 'accepted', 'declined', 'expired'], { useNative: true, enumName: 'membership_invitation_status' }).defaultTo('none');
    t.timestamp('invitation_sent_at');
    t.timestamp('invitation_accepted_at');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('group_id');
    t.index('customer_id');
    t.index('is_primary');
    t.index('status');
    t.index('joined_at');
    t.index('expires_at');
    t.index('invitation_email');
    t.index('invitation_status');
    t.unique(['group_id', 'customer_id']);
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX membership_group_member_membership_number_unique ON membership_group_member (membership_number) WHERE membership_number IS NOT NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membership_group_member')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_group_member_status'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_invitation_status'));
};
