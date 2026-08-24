/**
 * SOC2 Control Catalogue
 *
 * Maps SOC2 Trust Services Criteria to platform audit-log evidence.
 * Each control references the audit category and actions that provide evidence.
 */

import { AuditCategory } from '../entities/AuditLog';

export interface Soc2Control {
  control_id: string;
  category: AuditCategory;
  description: string;
  evidenceActions: string[];
  frequency: 'continuous' | 'daily' | 'monthly' | 'quarterly' | 'annually';
}

export const SOC2_CONTROLS: readonly Soc2Control[] = [
  // Security (Common Criteria)
  {
    control_id: 'CC6.1',
    category: 'authentication',
    description: 'Logical and physical security controls to manage access',
    evidenceActions: ['login', 'logout', 'password_change', 'mfa_enable', 'mfa_disable'],
    frequency: 'continuous',
  },
  {
    control_id: 'CC6.2',
    category: 'authorization',
    description: 'Access permissions are provisioned and de-provisioned',
    evidenceActions: ['role_grant', 'role_revoke', 'permission_grant', 'permission_revoke'],
    frequency: 'continuous',
  },
  {
    control_id: 'CC6.3',
    category: 'authorization',
    description: 'Access to systems is restricted based on need',
    evidenceActions: ['access_denied', 'unauthorized_attempt'],
    frequency: 'continuous',
  },
  {
    control_id: 'CC7.1',
    category: 'security',
    description: 'Detection and monitoring of security events',
    evidenceActions: ['security_alert', 'intrusion_detected', 'rate_limit_triggered'],
    frequency: 'continuous',
  },
  {
    control_id: 'CC7.2',
    category: 'security',
    description: 'Incident response procedures',
    evidenceActions: ['incident_created', 'incident_resolved', 'incident_escalated'],
    frequency: 'continuous',
  },
  // Availability
  {
    control_id: 'A1.1',
    category: 'configuration',
    description: 'Capacity and availability monitoring',
    evidenceActions: ['deployment', 'config_change', 'rollback', 'health_check'],
    frequency: 'continuous',
  },
  // Processing Integrity
  {
    control_id: 'PI1.1',
    category: 'payment',
    description: 'Payment processing integrity',
    evidenceActions: ['payment_initiated', 'payment_captured', 'payment_refunded', 'payment_failed'],
    frequency: 'continuous',
  },
  // Confidentiality
  {
    control_id: 'C1.1',
    category: 'dataAccess',
    description: 'Confidential data access is logged and monitored',
    evidenceActions: ['data_export', 'data_view', 'customer_data_access'],
    frequency: 'continuous',
  },
  {
    control_id: 'C1.2',
    category: 'dataModification',
    description: 'Confidential data modifications are tracked',
    evidenceActions: ['data_update', 'data_delete', 'customer_anonymize', 'customer_delete'],
    frequency: 'continuous',
  },
  // Privacy
  {
    control_id: 'P2.1',
    category: 'compliance',
    description: 'Personal data collection and use is documented',
    evidenceActions: ['consent_recorded', 'consent_updated', 'consent_withdrawn'],
    frequency: 'continuous',
  },
  {
    control_id: 'P3.1',
    category: 'compliance',
    description: 'Data subject requests are processed within SLA',
    evidenceActions: ['dsr_created', 'dsr_verified', 'dsr_completed', 'dsr_rejected', 'dsr_overdue'],
    frequency: 'continuous',
  },
  {
    control_id: 'P4.1',
    category: 'compliance',
    description: 'Key rotation and cryptographic controls',
    evidenceActions: ['key_rotation_started', 'key_rotation_completed', 'key_retired'],
    frequency: 'quarterly',
  },
  {
    control_id: 'P5.1',
    category: 'dataModification',
    description: 'Data retention and disposal',
    evidenceActions: ['data_retention_policy_updated', 'data_purged', 'data_anonymized'],
    frequency: 'monthly',
  },
] as const;

export function getControlsByCategory(category: AuditCategory): Soc2Control[] {
  return SOC2_CONTROLS.filter(c => c.category === category);
}

export function getControlById(controlId: string): Soc2Control | undefined {
  return SOC2_CONTROLS.find(c => c.control_id === controlId);
}

export function getEvidenceActionsForControl(controlId: string): string[] {
  const control = getControlById(controlId);
  return control?.evidenceActions ?? [];
}
