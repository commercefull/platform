/**
 * Fraud domain record types — rules, checks, and blacklist entries.
 *
 * Record shapes match the `fraudRule` / `fraudCheck` / `fraudBlacklist`
 * database schema. Infrastructure (`fraudRepo`) re-exports these so the
 * domain remains the single source of truth.
 */

export type RuleType = 'velocity' | 'amount' | 'location' | 'device' | 'pattern' | 'blacklist' | 'custom';
export type RuleAction = 'flag' | 'block' | 'review' | 'allow';
export type CheckStatus = 'pending' | 'passed' | 'flagged' | 'blocked' | 'reviewed' | 'overridden';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type BlacklistType = 'email' | 'ip' | 'phone' | 'address' | 'card_bin' | 'device_id' | 'customer';

export interface FraudRule {
  fraudRuleId: string;
  name: string;
  description?: string;
  ruleType: RuleType;
  entityType: string;
  conditions: Record<string, unknown>;
  action: RuleAction;
  riskScore: number;
  priority: number;
  isActive: boolean;
  triggerCount: number;
  lastTriggeredAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FraudCheck {
  fraudCheckId: string;
  orderId?: string;
  customerId?: string;
  checkType: string;
  status: CheckStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  triggeredRules?: unknown[];
  signals?: Record<string, unknown>;
  deviceFingerprint?: Record<string, unknown>;
  ipAddress?: string;
  ipCountry?: string;
  ipCity?: string;
  ipIsProxy: boolean;
  ipIsVpn: boolean;
  ipIsTor: boolean;
  billingCountry?: string;
  shippingCountry?: string;
  addressMismatch: boolean;
  highRiskCountry: boolean;
  previousOrders: number;
  previousChargebacks: number;
  orderAmountCents?: number;
  currency?: string;
  isFirstOrder: boolean;
  isGuestCheckout: boolean;
  paymentMethod?: string;
  cardBin?: string;
  cardCountry?: string;
  cardBinMismatch: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewDecision?: string;
  reviewNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FraudBlacklist {
  fraudBlacklistId: string;
  type: BlacklistType;
  value: string;
  reason?: string;
  source: string;
  relatedOrderId?: string;
  relatedCustomerId?: string;
  isActive: boolean;
  expiresAt?: Date;
  addedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
