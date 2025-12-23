/**
 * Fraud Controller
 * Handles admin/merchant fraud prevention operations
 */

import { logger } from '../../../../libs/logger';
import { Request, Response, NextFunction } from 'express';
import * as fraudRepo from '../../repos/fraudRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Fraud Rules
// ============================================================================

export const getFraudRules: AsyncHandler = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const rules = await fraudRepo.getRules(activeOnly !== 'false');
    res.json({ success: true, data: rules });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFraudRule: AsyncHandler = async (req, res, next) => {
  try {
    const rule = await fraudRepo.getRule(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }
    res.json({ success: true, data: rule });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFraudRule: AsyncHandler = async (req, res, next) => {
  try {
    const rule = await fraudRepo.saveRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFraudRule: AsyncHandler = async (req, res, next) => {
  try {
    const rule = await fraudRepo.saveRule({
      fraudRuleId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, data: rule });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFraudRule: AsyncHandler = async (req, res, next) => {
  try {
    await fraudRepo.deleteRule(req.params.id);
    res.json({ success: true, message: 'Rule deactivated' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Fraud Checks
// ============================================================================

export const getFraudChecks: AsyncHandler = async (req, res, next) => {
  try {
    const { status, riskLevel, customerId, limit, offset } = req.query;
    const result = await fraudRepo.getChecks(
      { status: status as any, riskLevel: riskLevel as any, customerId: customerId as string },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFraudCheck: AsyncHandler = async (req, res, next) => {
  try {
    const check = await fraudRepo.getCheck(req.params.id);
    if (!check) {
      res.status(404).json({ success: false, message: 'Fraud check not found' });
      return;
    }
    res.json({ success: true, data: check });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingReviews: AsyncHandler = async (req, res, next) => {
  try {
    const checks = await fraudRepo.getPendingReviews();
    res.json({ success: true, data: checks });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewFraudCheck: AsyncHandler = async (req, res, next) => {
  try {
    const reviewedBy = (req as any).userId || (req as any).merchantId;
    await fraudRepo.reviewCheck(req.params.id, req.body.decision, reviewedBy, req.body.notes);
    res.json({ success: true, message: 'Review submitted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Blacklist
// ============================================================================

export const getBlacklist: AsyncHandler = async (req, res, next) => {
  try {
    const { type, isActive, limit, offset } = req.query;
    const result = await fraudRepo.getBlacklist(
      { type: type as any, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToBlacklist: AsyncHandler = async (req, res, next) => {
  try {
    const addedBy = (req as any).userId || (req as any).merchantId;
    const entry = await fraudRepo.addToBlacklist({ ...req.body, addedBy });
    res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeFromBlacklist: AsyncHandler = async (req, res, next) => {
  try {
    await fraudRepo.removeFromBlacklist(req.params.id);
    res.json({ success: true, message: 'Entry removed from blacklist' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};
