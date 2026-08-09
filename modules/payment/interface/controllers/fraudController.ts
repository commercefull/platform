/**
 * Fraud Controller
 * Handles admin/merchant fraud prevention operations
 */

import { logger } from '../../../../libs/logger';
import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as fraudRepo from '../../infrastructure/repositories/fraudRepo';

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

// ============================================================================
// Fraud Rules
// ============================================================================

export const getFraudRules: AsyncHandler = async (req, res, _next) => {
  try {
    const { activeOnly } = req.query;
    const rules = await fraudRepo.getRules(activeOnly !== 'false');
    res.json({ success: true, data: rules });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getFraudRule: AsyncHandler = async (req, res, _next) => {
  try {
    const rule = await fraudRepo.getRule(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }
    res.json({ success: true, data: rule });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createFraudRule: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<fraudRepo.FraudRule> & { name: string; ruleType: fraudRepo.RuleType; conditions: Record<string, unknown> };
    const rule = await fraudRepo.saveRule(body);
    res.status(201).json({ success: true, data: rule });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateFraudRule: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as Partial<fraudRepo.FraudRule> & { name: string; ruleType: fraudRepo.RuleType; conditions: Record<string, unknown> };
    const rule = await fraudRepo.saveRule({
      fraudRuleId: req.params.id,
      ...body,
    });
    res.json({ success: true, data: rule });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const deleteFraudRule: AsyncHandler = async (req, res, _next) => {
  try {
    await fraudRepo.deleteRule(req.params.id);
    res.json({ success: true, message: 'Rule deactivated' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Fraud Checks
// ============================================================================

export const getFraudChecks: AsyncHandler = async (req, res, _next) => {
  try {
    const { status, riskLevel, customerId, limit, offset } = req.query;
    const result = await fraudRepo.getChecks(
      { status: status as fraudRepo.CheckStatus | undefined, riskLevel: riskLevel as fraudRepo.RiskLevel | undefined, customerId: customerId as string },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getFraudCheck: AsyncHandler = async (req, res, _next) => {
  try {
    const check = await fraudRepo.getCheck(req.params.id);
    if (!check) {
      res.status(404).json({ success: false, message: 'Fraud check not found' });
      return;
    }
    res.json({ success: true, data: check });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getPendingReviews: AsyncHandler = async (req, res, _next) => {
  try {
    const checks = await fraudRepo.getPendingReviews();
    res.json({ success: true, data: checks });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const reviewFraudCheck: AsyncHandler = async (req, res, _next) => {
  try {
    const body = req.body as { decision: 'approved' | 'rejected'; notes?: string };
    const reviewedBy = req.user?.userId || req.user?.merchantId || '';
    await fraudRepo.reviewCheck(req.params.id, body.decision, reviewedBy, body.notes);
    res.json({ success: true, message: 'Review submitted' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Blacklist
// ============================================================================

export const getBlacklist: AsyncHandler = async (req, res, _next) => {
  try {
    const { type, isActive, limit, offset } = req.query;
    const result = await fraudRepo.getBlacklist(
      { type: type as fraudRepo.BlacklistType | undefined, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const addToBlacklist: AsyncHandler = async (req, res, _next) => {
  try {
    const addedBy = req.user?.userId || req.user?.merchantId;
    const body = req.body as {
      type: fraudRepo.BlacklistType;
      value: string;
      reason?: string;
      source?: string;
      relatedOrderId?: string;
      relatedCustomerId?: string;
      expiresAt?: Date;
    };
    const entry = await fraudRepo.addToBlacklist({ ...body, addedBy });
    res.status(201).json({ success: true, data: entry });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const removeFromBlacklist: AsyncHandler = async (req, res, _next) => {
  try {
    await fraudRepo.removeFromBlacklist(req.params.id);
    res.json({ success: true, message: 'Entry removed from blacklist' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
