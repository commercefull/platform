import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'b2b',
  description:
    'B2B commerce — company hierarchy, multi-user spending limits, price books, RFQ→quote→order, Net-15/30/60 terms, approval workflows',
  requirement: 'optional',
  dependsOn: ['identity', 'order'],
  routes: [{ path: '/business/b2b', auth: 'organization' }],
  graphql: { enabled: false },
  events: {
    subscribes: [],
    publishes: [
      'company.registered',
      'company.approved',
      'company.suspended',
      'company.user.invited',
      'b2b_user.activated',
      'quote.created',
      'quote.sent',
      'quote.viewed',
      'quote.accepted',
      'quote.rejected',
      'quote.converted',
      'approval.requested',
      'approval.approved',
      'approval.rejected',
      'b2b.request_escalated',
    ],
  },
  tables: { names: ['b2bCompany', 'b2bUser', 'b2bQuote', 'b2bApprovalWorkflow'] },
  featureFlagKey: 'module.b2b.enabled',
};
