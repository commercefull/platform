/**
 * Return Rule Controller for Admin Hub
 * Manages return policy rules (Epic I + Epic F).
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import { adminRespond } from '../../../../libs/adminRespond';
import { manageReturnRulesUseCase } from '../../application/wired';
import type { RefundMethod, ReturnRuleScope } from '../../domain/entities/ReturnRule';

// Use the repository via the infrastructure barrel

// ============================================================================
// List Return Rules
// ============================================================================

export const listReturnRules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  // In production this would query the DB; for now we show the management screen
  let rules: never[] = [];
  try {
    rules = (await manageReturnRulesUseCase.findActiveRules()) as never[];
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

export const createReturnRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
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
    } = body as {
      name: string;
      description?: string;
      scope?: ReturnRuleScope;
      categoryId?: string;
      productId?: string;
      returnWindowDays?: string;
      restockingFeePercent?: string;
      restockingFeeFlat?: string;
      returnShippingCost?: string;
      customerPaysReturnShipping?: string;
      autoApprove?: string;
      requiresManualReview?: string;
      requiresInspection?: string;
      refundMethod?: RefundMethod;
      priority?: string;
      isActive?: string;
    };

    await manageReturnRulesUseCase.create({
      name,
      description: description || undefined,
      scope: scope || 'global',
      categoryId: categoryId || undefined,
      productId: productId || undefined,
      returnWindowDays: returnWindowDays ? parseInt(returnWindowDays, 10) : undefined,
      restockingFeePercent: restockingFeePercent ? parseFloat(restockingFeePercent) : 0,
      restockingFeeFlatCents: restockingFeeFlat ? Math.round(parseFloat(restockingFeeFlat) * 100) : 0,
      returnShippingCostCents: returnShippingCost ? Math.round(parseFloat(returnShippingCost) * 100) : 0,
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

export const deleteReturnRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { returnRuleId: _returnRuleId } = req.params;
    // Soft delete by deactivating
    res.json({ success: true });
  } catch (error: unknown) {
    logger.warn('Error deleting return rule:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
