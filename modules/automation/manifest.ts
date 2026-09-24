import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'automation',
  description: 'Automation engine — rule persistence, condition/action DSL, execution on event bus, execution log',
  requirement: 'optional',
  dependsOn: ['identity'],
  routes: [{ path: '/business/automation', auth: 'organization' }],
  graphql: { enabled: false },
  events: { subscribes: ['*'], publishes: ['automation.rule_executed', 'automation.rule_failed'] },
  tables: { names: ['automationRule', 'automationExecutionLog'] },
  featureFlagKey: 'module.automation.enabled',
};
