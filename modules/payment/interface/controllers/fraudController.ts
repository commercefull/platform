/**
 * Fraud Controller
 * Handles admin/merchant fraud prevention operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { manageFraudRecordsUseCase } from '../../application/useCases/wired';
import { FraudRule, RuleType, CheckStatus, BlacklistType, RiskLevel } from '../../application/wired';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

function respondError(res: HttpResponse, error: unknown, fallback: string): void {
  res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) || fallback });
}

// ============================================================================
// Fraud Rules
// ============================================================================

export const getFraudRules: AsyncHandler = async (req, res, _next) => {
  const { activeOnly } = req.query;
  const rules = await manageFraudRecordsUseCase.listRules(activeOnly !== 'false');
  res.json({ success: true, data: rules });
};

export const getFraudRule: AsyncHandler = async (req, res, _next) => {
  try {
    res.json({ success: true, data: await manageFraudRecordsUseCase.getRule(req.params.id) });
  } catch (error) {
    respondError(res, error, 'Rule not found');
  }
};

export const createFraudRule: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<FraudRule> & { name: string; ruleType: RuleType; conditions: Record<string, unknown> };
  try {
    const rule = await manageFraudRecordsUseCase.saveRule(body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    respondError(res, error, 'Failed to create fraud rule');
  }
};

export const updateFraudRule: AsyncHandler = async (req, res, _next) => {
  const body = req.body as Partial<FraudRule> & { name: string; ruleType: RuleType; conditions: Record<string, unknown> };
  const rule = await manageFraudRecordsUseCase.updateRule(req.params.id, body);
  res.json({ success: true, data: rule });
};

export const deleteFraudRule: AsyncHandler = async (req, res, _next) => {
  await manageFraudRecordsUseCase.deleteRule(req.params.id);
  res.json({ success: true, message: 'Rule deactivated' });
};

// ============================================================================
// Fraud Checks
// ============================================================================

export const getFraudChecks: AsyncHandler = async (req, res, _next) => {
  const { status, riskLevel, customerId, limit, offset } = req.query;
  const result = await manageFraudRecordsUseCase.listChecks(
    { status: status as CheckStatus | undefined, riskLevel: riskLevel as RiskLevel | undefined, customerId: customerId as string },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
};

export const getFraudCheck: AsyncHandler = async (req, res, _next) => {
  try {
    res.json({ success: true, data: await manageFraudRecordsUseCase.getCheck(req.params.id) });
  } catch (error) {
    respondError(res, error, 'Fraud check not found');
  }
};

export const getPendingReviews: AsyncHandler = async (req, res, _next) => {
  const checks = await manageFraudRecordsUseCase.getPendingReviews();
  res.json({ success: true, data: checks });
};

export const reviewFraudCheck: AsyncHandler = async (req, res, _next) => {
  const body = req.body as { decision?: string; notes?: string };
  const reviewedBy = req.user?.userId || req.user?.organizationId || '';
  try {
    await manageFraudRecordsUseCase.reviewCheck(req.params.id, body.decision, reviewedBy, body.notes);
    res.json({ success: true, message: 'Review submitted' });
  } catch (error) {
    respondError(res, error, 'Failed to submit review');
  }
};

// ============================================================================
// Blacklist
// ============================================================================

export const getBlacklist: AsyncHandler = async (req, res, _next) => {
  const { type, isActive, limit, offset } = req.query;
  const result = await manageFraudRecordsUseCase.listBlacklist(
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
  try {
    const entry = await manageFraudRecordsUseCase.addToBlacklist({ ...body, addedBy });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    respondError(res, error, 'Failed to add blacklist entry');
  }
};

export const removeFromBlacklist: AsyncHandler = async (req, res, _next) => {
  await manageFraudRecordsUseCase.removeFromBlacklist(req.params.id);
  res.json({ success: true, message: 'Entry removed from blacklist' });
};
