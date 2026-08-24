/**
 * Fraud Controller
 * Handles admin/merchant fraud prevention operations
 */

import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';
import type { FraudRule, RuleType, CheckStatus, BlacklistType, RiskLevel } from '../../infrastructure/repositories/PaymentBillingDataRepository';

const fraudRepo = paymentBillingDataRepository.fraud;

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

// ============================================================================
// Fraud Rules
// ============================================================================

export const getFraudRules: AsyncHandler = async (req, res, _next) => {
  const { activeOnly } = req.query;
  const rules = await fraudRepo.getRules(activeOnly !== 'false');
  res.json({ success: true, data: rules });
  
};

export const getFraudRule: AsyncHandler = async (req, res, _next) => {
  const rule = await fraudRepo.getRule(req.params.id);
  if (!rule) {
    res.status(404).json({ success: false, message: 'Rule not found' });
    return;
  }
  res.json({ success: true, data: rule });
  
};

export const createFraudRule: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<FraudRule> & { name: string; ruleType: RuleType; conditions: Record<string, unknown> };
  if (!body.name?.trim()) {
    res.status(400).json({ success: false, message: 'name is required' });
    return;
  }
  if (!body.ruleType?.trim()) {
    res.status(400).json({ success: false, message: 'ruleType is required' });
    return;
  }
  if (!body.conditions || typeof body.conditions !== 'object') {
    res.status(400).json({ success: false, message: 'conditions is required' });
    return;
  }
  const rule = await fraudRepo.saveRule(body);
  res.status(201).json({ success: true, data: rule });
  
};

export const updateFraudRule: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<FraudRule> & { name: string; ruleType: RuleType; conditions: Record<string, unknown> };
  const rule = await fraudRepo.saveRule({
    fraudRuleId: req.params.id,
    ...body,
  });
  res.json({ success: true, data: rule });
  
};

export const deleteFraudRule: AsyncHandler = async (req, res, _next) => {
  await fraudRepo.deleteRule(req.params.id);
  res.json({ success: true, message: 'Rule deactivated' });
  
};

// ============================================================================
// Fraud Checks
// ============================================================================

export const getFraudChecks: AsyncHandler = async (req, res, _next) => {
  const { status, riskLevel, customerId, limit, offset } = req.query;
  const result = await fraudRepo.getChecks(
    { status: status as CheckStatus | undefined, riskLevel: riskLevel as RiskLevel | undefined, customerId: customerId as string },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
  
};

export const getFraudCheck: AsyncHandler = async (req, res, _next) => {
  const check = await fraudRepo.getCheck(req.params.id);
  if (!check) {
    res.status(404).json({ success: false, message: 'Fraud check not found' });
    return;
  }
  res.json({ success: true, data: check });
  
};

export const getPendingReviews: AsyncHandler = async (req, res, _next) => {
  const checks = await fraudRepo.getPendingReviews();
  res.json({ success: true, data: checks });
  
};

export const reviewFraudCheck: AsyncHandler = async (req, res, _next) => {
  const body = req.body as { decision: 'approved' | 'rejected'; notes?: string };
  const reviewedBy = req.user?.userId || req.user?.organizationId || '';
  await fraudRepo.reviewCheck(req.params.id, body.decision, reviewedBy, body.notes);
  res.json({ success: true, message: 'Review submitted' });
  
};

// ============================================================================
// Blacklist
// ============================================================================

export const getBlacklist: AsyncHandler = async (req, res, _next) => {
  const { type, isActive, limit, offset } = req.query;
  const result = await fraudRepo.getBlacklist(
    { type: type as BlacklistType | undefined, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
  
};

export const addToBlacklist: AsyncHandler = async (req, res, _next) => {
  const addedBy = req.user?.userId || req.user?.organizationId;
  const body = req.body as {
    type: BlacklistType;
    value: string;
    reason?: string;
    source?: string;
    relatedOrderId?: string;
    relatedCustomerId?: string;
    expiresAt?: Date;
  };
  if (!body.type?.trim()) {
    res.status(400).json({ success: false, message: 'type is required' });
    return;
  }
  if (!body.value?.trim()) {
    res.status(400).json({ success: false, message: 'value is required' });
    return;
  }
  const entry = await fraudRepo.addToBlacklist({ ...body, addedBy });
  res.status(201).json({ success: true, data: entry });
  
};

export const removeFromBlacklist: AsyncHandler = async (req, res, _next) => {
  await fraudRepo.removeFromBlacklist(req.params.id);
  res.json({ success: true, message: 'Entry removed from blacklist' });
  
};
