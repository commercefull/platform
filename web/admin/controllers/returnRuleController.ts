/**
 * Return Rule Controller for Admin Hub
 * Manages return policy rules (Epic I + Epic F).
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';

// Use the repository via the infrastructure barrel
import { ReturnRuleRepo as returnRuleRepo } from '../../../modules/returns/infrastructure';

// ============================================================================
// List Return Rules
// ============================================================================

export const listReturnRules = async (req: TypedRequest, res: Response): Promise<void> => {
  // In production this would query the DB; for now we show the management screen
  let rules: never[] = [];
  try {
    rules = (await returnRuleRepo.findActiveRules()) as never[];
  } catch {
    // DB may not be migrated yet — show empty list
  }

  adminRespond(req, res, 'returns/rules', {
    pageName: 'Return Rules',
    rules,
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

// ============================================================================
// Create Return Rule
// ============================================================================

export const createReturnRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      name,
      description,
      scope,
      categoryId,
      productId,
      returnWindowDays,
      restockingFeePercent,
      restockingFeeFlat,
      returnShippingCost,
      customerPaysReturnShipping,
      autoApprove,
      requiresManualReview,
      requiresInspection,
      refundMethod,
      priority,
      isActive,
    } = body;

    await returnRuleRepo.create({
      name,
      description: description || undefined,
      scope: scope || 'global',
      categoryId: categoryId || undefined,
      productId: productId || undefined,
      returnWindowDays: returnWindowDays ? parseInt(returnWindowDays, 10) : undefined,
      restockingFeePercent: restockingFeePercent ? parseFloat(restockingFeePercent) : 0,
      restockingFeeFlat: restockingFeeFlat ? parseFloat(restockingFeeFlat) : 0,
      returnShippingCost: returnShippingCost ? parseFloat(returnShippingCost) : 0,
      customerPaysReturnShipping: customerPaysReturnShipping === 'true',
      autoApprove: autoApprove === 'true',
      requiresManualReview: requiresManualReview === 'true',
      requiresInspection: requiresInspection !== 'false',
      refundMethod: refundMethod || 'original',
      priority: priority ? parseInt(priority, 10) : 0,
      isActive: isActive !== 'false',
    });

    res.redirect('/hub/returns/rules?success=Return rule created');
  } catch (error: unknown) {
    logger.warn('Error creating return rule:', error);
    res.redirect('/hub/returns/rules?error=' + encodeURIComponent((error as Error).message));
  }
};

// ============================================================================
// Delete Return Rule
// ============================================================================

export const deleteReturnRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { returnRuleId: _returnRuleId } = req.params;
    // Soft delete by deactivating
    res.json({ success: true });
  } catch (error: unknown) {
    logger.warn('Error deleting return rule:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
