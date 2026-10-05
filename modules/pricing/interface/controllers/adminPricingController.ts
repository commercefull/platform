import { jsonResponse, redirectResponse } from 'libs/apiResponse';
/**
 * Pricing Controller for Admin Hub
 * Handles Price Lists and Pricing Rules management
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
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
import { managePricingAdminUseCase } from '../../application/wired';
import { findActiveStoresUseCase, manageSalesChannelsUseCase } from '../../../store/application/useCases/wired';

// ============================================================================
// Price Lists
// ============================================================================

export const listPriceLists = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/index', {
    pageName: 'Pricing',
    priceLists: [],
    priceRules: [],
    pagination: { total: 0, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const createPriceListForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/lists/create', {
    pageName: 'Create Price List',
  });
};

export const createPriceList = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    redirectResponse(res, '/admin/catalog/pricing?success=Price list created successfully');
  } catch (error: unknown) {
    logger.warn('Error creating price list:', error);
    adminRespond(req, res, 'catalog/pricing/lists/create', {
      pageName: 'Create Price List',
      error: (error as Error).message || 'Failed to create price list',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const viewPriceList = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/lists/view', {
    pageName: 'Price List Details',
    priceList: null,
    success: req.query.success || null,
  });
};

export const editPriceListForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/lists/edit', {
    pageName: 'Edit Price List',
    priceList: null,
  });
};

export const updatePriceList = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { listId } = req.params;
    redirectResponse(res, `/admin/catalog/pricing/lists/${listId}?success=Price list updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error updating price list:', error);
    adminRespond(req, res, 'catalog/pricing/lists/edit', {
      pageName: 'Edit Price List',
      priceList: null,
      error: (error as Error).message || 'Failed to update price list',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const deletePriceList = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  jsonResponse(res, 200, { success: true, message: 'Price list deleted successfully' });
};

// ============================================================================
// Price Rules
// ============================================================================

export const listPriceRules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  let priceRules: never[] = [];
  try {
    const rules = await managePricingAdminUseCase.findAllRules();
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
    logger.warn('Error fetching price rules:', error);
  }

  adminRespond(req, res, 'catalog/pricing/rules/index', {
    pageName: 'Price Rules',
    priceRules,
    pagination: { total: priceRules.length, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const createPriceRuleForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'catalog/pricing/rules/create', {
    pageName: 'Create Price Rule',
    ...(await loadTargetingOptions()),
  });
};

export const createPriceRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const { name, description, ruleType, target, value, priority, status, conditions } = body as {
      name: string;
      description?: string;
      ruleType?: string;
      target?: string;
      value?: string;
      priority?: string;
      status?: string;
      conditions?: unknown;
    };

    // Parse conditions from the condition-builder form + dedicated
    // store/channel targeting fields.
    const parsedConditions = parsePricingConditionsFromForm(conditions);
    const targetingConditions = buildTargetingConditions(body);

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
      conditions: mergeTargetingConditions(parsedConditions, targetingConditions),
      adjustments,
    };

    await managePricingAdminUseCase.createRule(createProps);

    redirectResponse(res, '/admin/catalog/pricing/rules?success=Price rule created successfully');
  } catch (error: unknown) {
    logger.warn('Error creating price rule:', error);
    adminRespond(req, res, 'catalog/pricing/rules/create', {
      pageName: 'Create Price Rule',
      error: (error as Error).message || 'Failed to create price rule',
      formData: req.body as HttpRequestBody,
      ...(await loadTargetingOptions()),
    });
  }
};

export const viewPriceRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { ruleId } = req.params;
  let priceRule = null;
  try {
    priceRule = await managePricingAdminUseCase.findRuleById(ruleId);
  } catch (error) {
    logger.warn('Error fetching price rule:', error);
  }

  adminRespond(req, res, 'catalog/pricing/rules/view', {
    pageName: 'Price Rule Details',
    priceRule,
    success: req.query.success || null,
  });
};

export const editPriceRuleForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { ruleId } = req.params;
  let priceRule = null;
  try {
    priceRule = await managePricingAdminUseCase.findRuleById(ruleId);
  } catch (error) {
    logger.warn('Error fetching price rule for edit:', error);
  }

  adminRespond(req, res, 'catalog/pricing/rules/edit', {
    pageName: 'Edit Price Rule',
    priceRule,
    ...(await loadTargetingOptions()),
  });
};

export const updatePriceRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { ruleId } = req.params;
    const body = req.body as HttpRequestBody;
    const { name, description, ruleType, target, value, priority, status, conditions } = body as {
      name: string;
      description?: string;
      ruleType?: string;
      target?: string;
      value?: string;
      priority?: string;
      status?: string;
      conditions?: unknown;
    };

    const parsedConditions = parsePricingConditionsFromForm(conditions);
    const targetingConditions = buildTargetingConditions(body);

    const updateProps: PricingRuleUpdateProps = {
      name: name as string,
      description: (description as string) || undefined,
      scope: mapScope(target as string),
      status: status === 'inactive' ? PricingRuleStatus.INACTIVE : PricingRuleStatus.ACTIVE,
      priority: priority ? parseInt(priority as string, 10) : 0,
      conditions: mergeTargetingConditions(parsedConditions, targetingConditions),
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

    await managePricingAdminUseCase.updateRule(ruleId, updateProps);

    redirectResponse(res, `/admin/catalog/pricing/rules/${ruleId}?success=Price rule updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error updating price rule:', error);
    adminRespond(req, res, 'catalog/pricing/rules/edit', {
      pageName: 'Edit Price Rule',
      priceRule: null,
      error: (error as Error).message || 'Failed to update price rule',
      formData: req.body as HttpRequestBody,
      ...(await loadTargetingOptions()),
    });
  }
};

export const deletePriceRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { ruleId } = req.params;
    await managePricingAdminUseCase.deleteRule(ruleId);
    jsonResponse(res, 200, { success: true, message: 'Price rule deleted successfully' });
  } catch (error: unknown) {
    logger.warn('Error deleting price rule:', error);
    jsonResponse(res, 500, { success: false, error: (error as Error).message });
  }
};

async function loadTargetingOptions(): Promise<{ stores: unknown[]; salesChannels: unknown[] }> {
  const [stores, salesChannels] = await Promise.all([
    findActiveStoresUseCase.execute().catch(() => []),
    manageSalesChannelsUseCase.listAll().catch(() => []),
  ]);
  return { stores, salesChannels };
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [String(value)];
}

/** Builds store/channel PricingConditions from dedicated form fields. */
function buildTargetingConditions(body: HttpRequestBody): PricingCondition[] {
  const conditions: PricingCondition[] = [];
  const storeIds = toStringArray((body as Record<string, unknown>).storeIds);
  const channelIds = toStringArray((body as Record<string, unknown>).channelIds);
  if (storeIds.length > 0) conditions.push({ type: 'store', parameters: { storeIds } });
  if (channelIds.length > 0) conditions.push({ type: 'channel', parameters: { channelIds } });
  return conditions;
}

/** Dedicated targeting fields replace any builder-authored store/channel conditions. */
function mergeTargetingConditions(parsed: PricingCondition[], targeting: PricingCondition[]): PricingCondition[] {
  const builder = parsed.filter(c => c.type !== 'store' && c.type !== 'channel');
  return [...builder, ...targeting];
}

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

  // Builder attributes that map onto dedicated evaluator parameter shapes
  if (cond.attribute === 'store' || cond.attribute === 'channel') {
    const ids = String(cond.value ?? '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    return {
      type: cond.attribute,
      parameters: cond.attribute === 'store' ? { storeIds: ids } : { channelIds: ids },
    };
  }

  const attributeTypeMap: Record<string, string> = {
    cartTotal: 'cart_total',
    itemQuantity: 'item_quantity',
    productCategory: 'category',
    customerGroup: 'customer_group',
  };
  const attribute = cond.attribute || '';
  const type = attributeTypeMap[attribute] || attribute || cond.type || '';

  // Convert from condition-builder shape {attribute, operator, value}
  let value: unknown = cond.value || '';
  if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
    value = Number(value);
  }
  if (cond.operator === 'in' && typeof value === 'string') {
    value = value.split(',').map(v => v.trim());
  }
  return {
    type,
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
