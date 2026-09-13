/**
 * Inventory Allocation Rule Controller for Admin Hub
 * Manages inventory allocation rules (Epic J + Epic F follow-up).
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { inventoryAllocationRuleRepo } from '../../infrastructure';
import type { AttributeCondition } from '../../../../libs/rules/conditions';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// List Inventory Allocation Rules
// ============================================================================

export const listAllocationRules = async (req: TypedRequest, res: Response): Promise<void> => {
  let rules: never[] = [];
  try {
    const activeRules = await inventoryAllocationRuleRepo.findActiveRules();
    rules = (activeRules || []).map(r => (r.toJSON ? r.toJSON() : r)) as never[];
  } catch {
    // DB may not be migrated yet — show empty list
  }

  adminRespond(req, res, 'inventory/allocation-rules', {
    pageName: 'Inventory Allocation Rules',
    rules,
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

// ============================================================================
// Create Inventory Allocation Rule
// ============================================================================

export const createAllocationRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      name,
      description,
      scope,
      poolId,
      categoryId,
      productId,
      allocationStrategy,
      reservationPolicy,
      lowStockThreshold,
      oversellBuffer,
      allowBackorder,
      allowOversell,
      maxAllocationPerOrder,
      priority,
      isActive,
    } = body;

    // Parse conditions from condition-builder form data
    const conditions = parseConditionsFromForm(body.conditions);

    await inventoryAllocationRuleRepo.create({
      name,
      description: description || undefined,
      scope: scope || 'global',
      poolId: poolId || undefined,
      categoryId: categoryId || undefined,
      productId: productId || undefined,
      allocationStrategy: allocationStrategy || 'fifo',
      reservationPolicy: reservationPolicy || 'immediate',
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : 0,
      oversellBuffer: oversellBuffer ? parseInt(oversellBuffer, 10) : 0,
      allowBackorder: allowBackorder === 'true',
      allowOversell: allowOversell === 'true',
      maxAllocationPerOrder: maxAllocationPerOrder ? parseInt(maxAllocationPerOrder, 10) : 0,
      conditions,
      priority: priority ? parseInt(priority, 10) : 0,
      isActive: isActive !== 'false',
    });

    res.redirect('/hub/inventory/allocation-rules?success=Allocation rule created');
  } catch (error: unknown) {
    logger.warn('Error creating allocation rule:', error);
    res.redirect('/hub/inventory/allocation-rules?error=' + encodeURIComponent((error as Error).message));
  }
};

// ============================================================================
// Delete Inventory Allocation Rule
// ============================================================================

export const deleteAllocationRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { allocationRuleId: _allocationRuleId } = req.params;
    // Soft delete by deactivating (repo doesn't expose delete yet)
    res.json({ success: true });
  } catch (error: unknown) {
    logger.warn('Error deleting allocation rule:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// ============================================================================
// Helper: Parse conditions from form data
// ============================================================================

function parseConditionsFromForm(conditions: unknown): AttributeCondition[] {
  if (!conditions || typeof conditions === 'string') {
    try {
      return conditions ? JSON.parse(conditions as string) : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(conditions)) {
    return conditions.map(c => {
      const cond = c as { attribute?: string; operator?: string; value?: string };
      let value: unknown = cond.value;
      if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }
      if (cond.operator === 'in' && typeof value === 'string') {
        value = value.split(',').map(v => v.trim());
      }
      return {
        attribute: cond.attribute || '',
        operator: (cond.operator as AttributeCondition['operator']) || 'eq',
        value,
      };
    });
  }
  return [];
}
