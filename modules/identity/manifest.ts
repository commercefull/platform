import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'identity',
  description: 'Authentication, authorization, user management',
  requirement: 'required',
  routes: [
    { path: '/customer', auth: 'customer' },
    { path: '/business', auth: 'organization' },
  ],
  graphql: { enabled: true },
  events: {
    subscribes: ['identity.password_reset'],
    publishes: [
      'customer.registered',
      'organization.approved',
      'organization.settlement_created',
      'organization.payout_processed',
      'identity.sso.login',
      'identity.sso.config_created',
      'identity.sso.config_updated',
      'identity.sso.config_deleted',
      'identity.scim.user_provisioned',
      'identity.scim.user_deprovisioned',
      'identity.scim.user_updated',
    ],
  },
  tables: { names: ['managedAdminUser', 'merchant', 'role', 'samlProvider', 'oidcProvider', 'scimProvisioningRecord'] },
};
