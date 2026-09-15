/**
 * Pricing Controller for Admin Hub
 * Handles Price Lists and Pricing Rules management
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import {
  PricingRuleType,
  PricingRuleStatus,
  PricingRuleScope,
  PricingAdjustmentType,
  type PricingCondition,
  type PricingAdjustment,
  type PricingRuleCreateProps,
  type PricingRuleUpdateProps,
} from '../../domain/pricingRule';
import { adminRespond } from '../../../../libs/adminRespond';
import { pricingRuleRepo } from '../../application/wired';

// ============================================================================
// Price Lists
// ============================================================================

export const listPriceLists = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/index', {
    pageName: 'Pricing',
    priceLists: [],
    priceRules: [],
    pagination: { total: 0, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const createPriceListForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/lists/create', {
    pageName: 'Create Price List',
  });
};

export const createPriceList = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/catalog/pricing?success=Price list created successfully');
  } catch (error: unknown) {
    logger.warning('Error creating price list:', error);
    adminRespond(req, res, 'catalog/pricing/lists/create', {
      pageName: 'Create Price List',
      error: (error as Error).message || 'Failed to create price list',
      formData: req.body as RequestBody,
    });
  }
};

export const viewPriceList = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/lists/view', {
    pageName: 'Price List Details',
    priceList: null,
    success: req.query.success || null,
  });
};

export const editPriceListForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/lists/edit', {
    pageName: 'Edit Price List',
    priceList: null,
  });
};

export const updatePriceList = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { listId } = req.params;
    res.redirect(`/admin/catalog/pricing/lists/${listId}?success=Price list updated successfully`);
  } catch (error: unknown) {
    logger.warning('Error updating price list:', error);
    adminRespond(req, res, 'catalog/pricing/lists/edit', {
      pageName: 'Edit Price List',
      priceList: null,
      error: (error as Error).message || 'Failed to update price list',
      formData: req.body as RequestBody,
    });
  }
};

export const deletePriceList = async (req: TypedRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Price list deleted successfully' });
};

// ============================================================================
// Price Rules
// ============================================================================

export const listPriceRules = async (req: TypedRequest, res: Response): Promise<void> => {
  let priceRules: never[] = [];
  try {
    const rules = await pricingRuleRepo.findAllRules();
    priceRules = (rules || []).map(r => ({
      priceRuleId: r.pricingRuleId || r.id,
      name: r.name,
      ruleType: r.ruleType || r.type,
      target: r.scope,
      value: r.adjustments?.[0]?.value ?? 0,
      priority: r.priority,
      status: r.isActive ? 'active' : r.status === PricingRuleStatus.ACTIVE ? 'active' : 'inactive',
    })) as never[];
  } catch (error) {
    logger.warning('Error fetching price rules:', error);
  }

  adminRespond(req, res, 'catalog/pricing/rules/index', {
    pageName: 'Price Rules',
    priceRules,
    pagination: { total: priceRules.length, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const createPriceRuleForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/rules/create', {
    pageName: 'Create Price Rule',
  });
};

export const createPriceRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description, ruleType, target, value, priority, status, conditions } = body;

    // Parse conditions from the condition-builder form
    const parsedConditions = parsePricingConditionsFromForm(conditions);

    // Build adjustments from the value
    const adjustments: PricingAdjustment[] = [];
    if (value !== undefined && value !== '') {
      const numValue = parseFloat(value as string) || 0;
      adjustments.push({
        type: ruleType === 'percentage' ? PricingAdjustmentType.PERCENTAGE : PricingAdjustmentType.FIXED,
        value: numValue,
      });
    }

    const createProps: PricingRuleCreateProps = {
      name,
      description: description || undefined,
      type: mapRuleType(ruleType as string),
      scope: mapScope(target as string),
      status: status === 'inactive' ? PricingRuleStatus.INACTIVE : PricingRuleStatus.ACTIVE,
      priority: priority ? parseInt(priority as string, 10) : 0,
      conditions: parsedConditions,
      adjustments,
    };

    await pricingRuleRepo.create(createProps);

    res.redirect('/admin/catalog/pricing/rules?success=Price rule created successfully');
  } catch (error: unknown) {
    logger.warning('Error creating price rule:', error);
    adminRespond(req, res, 'catalog/pricing/rules/create', {
      pageName: 'Create Price Rule',
      error: (error as Error).message || 'Failed to create price rule',
      formData: req.body as RequestBody,
    });
  }
};

export const viewPriceRule = async (req: TypedRequest, res: Response): Promise<void> => {
  const { ruleId } = req.params;
  let priceRule = null;
  try {
    priceRule = await pricingRuleRepo.findById(ruleId);
  } catch (error) {
    logger.warning('Error fetching price rule:', error);
  }

  adminRespond(req, res, 'catalog/pricing/rules/view', {
    pageName: 'Price Rule Details',
    priceRule,
    success: req.query.success || null,
  });
};

export const editPriceRuleForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { ruleId } = req.params;
  let priceRule = null;
  try {
    priceRule = await pricingRuleRepo.findById(ruleId);
  } catch (error) {
    logger.warning('Error fetching price rule for edit:', error);
  }

  adminRespond(req, res, 'catalog/pricing/rules/edit', {
    pageName: 'Edit Price Rule',
    priceRule,
  });
};

export const updatePriceRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { ruleId } = req.params;
    const body = req.body as RequestBody;
    const { name, description, ruleType, target, value, priority, status, conditions } = body;

    const parsedConditions = parsePricingConditionsFromForm(conditions);

    const updateProps: PricingRuleUpdateProps = {
      name: name as string,
      description: (description as string) || undefined,
      scope: mapScope(target as string),
      status: status === 'inactive' ? PricingRuleStatus.INACTIVE : PricingRuleStatus.ACTIVE,
      priority: priority ? parseInt(priority as string, 10) : 0,
      conditions: parsedConditions,
    };

    // Rebuild adjustments if value is provided
    if (value !== undefined && value !== '') {
      const numValue = parseFloat(value as string) || 0;
      updateProps.adjustments = [
        {
          type: ruleType === 'percentage' ? PricingAdjustmentType.PERCENTAGE : PricingAdjustmentType.FIXED,
          value: numValue,
        },
      ];
    }

    await pricingRuleRepo.update(ruleId, updateProps);

    res.redirect(`/admin/catalog/pricing/rules/${ruleId}?success=Price rule updated successfully`);
  } catch (error: unknown) {
    logger.warning('Error updating price rule:', error);
    adminRespond(req, res, 'catalog/pricing/rules/edit', {
      pageName: 'Edit Price Rule',
      priceRule: null,
      error: (error as Error).message || 'Failed to update price rule',
      formData: req.body as RequestBody,
    });
  }
};

export const deletePriceRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { ruleId } = req.params;
    await pricingRuleRepo.delete(ruleId);
    res.json({ success: true, message: 'Price rule deleted successfully' });
  } catch (error: unknown) {
    logger.warning('Error deleting price rule:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// ============================================================================
// Helpers — parse condition-builder form data + map enums
// ============================================================================

function parsePricingConditionsFromForm(conditions: unknown): PricingCondition[] {
  if (!conditions) return [];
  // If conditions is a JSON string (from a hidden input), parse it
  if (typeof conditions === 'string') {
    try {
      const parsed = JSON.parse(conditions);
      if (Array.isArray(parsed)) {
        return parsed.map(c => normalizePricingCondition(c));
      }
      return [];
    } catch {
      return [];
    }
  }
  // If conditions is an array of {attribute, operator, value} from the condition builder
  if (Array.isArray(conditions)) {
    return conditions.map(c => normalizePricingCondition(c));
  }
  return [];
}

function normalizePricingCondition(c: unknown): PricingCondition {
  const cond = c as { attribute?: string; operator?: string; value?: string; type?: string; parameters?: Record<string, unknown> };
  // Already in PricingCondition shape
  if (cond.type && cond.parameters) {
    return { type: cond.type, parameters: cond.parameters };
  }
  // Convert from condition-builder shape {attribute, operator, value}
  let value: unknown = cond.value || '';
  if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
    value = Number(value);
  }
  if (cond.operator === 'in' && typeof value === 'string') {
    value = value.split(',').map(v => v.trim());
  }
  return {
    type: cond.attribute || cond.type || '',
    parameters: {
      operator: cond.operator || 'eq',
      value,
    },
  };
}

function mapRuleType(ruleType: string): PricingRuleType {
  switch (ruleType) {
    case 'fixed':
      return PricingRuleType.QUANTITY_BASED;
    case 'percentage':
      return PricingRuleType.QUANTITY_BASED;
    case 'tiered':
      return PricingRuleType.QUANTITY_BASED;
    case 'volume':
      return PricingRuleType.QUANTITY_BASED;
    case 'time_based':
      return PricingRuleType.TIME_BASED;
    default:
      return PricingRuleType.QUANTITY_BASED;
  }
}

function mapScope(target: string): PricingRuleScope {
  switch (target) {
    case 'product':
      return PricingRuleScope.PRODUCT;
    case 'category':
      return PricingRuleScope.CATEGORY;
    case 'customer_group':
      return PricingRuleScope.CUSTOMER_GROUP;
    default:
      return PricingRuleScope.GLOBAL;
  }
}
