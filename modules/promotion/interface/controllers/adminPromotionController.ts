import { jsonResponse, redirectResponse } from 'libs/apiResponse';
/**
 * Promotion Controller
 * Handles promotion management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import { toMinorUnits } from '../../../../libs/money';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { ListPromotionsCommand } from '../../application/useCases/ListPromotions';
import { CreatePromotionCommand } from '../../application/useCases/CreatePromotion';
import { UpdatePromotionCommand } from '../../application/useCases/UpdatePromotion';
import { DeletePromotionCommand } from '../../application/useCases/DeletePromotion';
import {
  listPromotionsUseCase,
  createPromotionUseCase,
  updatePromotionUseCase,
  deletePromotionUseCase,
} from '../../application/useCases/wired';
import { managePromotionsUseCase, evaluatePromotionsUseCase } from '../../application/wired';
import type { PromotionEvaluationContext } from '../../application/useCases/EvaluatePromotions';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// List Promotions
// ============================================================================

export const listPromotions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { status, type, search, limit, offset, orderBy, orderDirection } = req.query;

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (type) filters.type = type;
  if (search) filters.search = search as string;

  const command = new ListPromotionsCommand(filters, {
    limit: parseInt(limit as string) || 50,
    offset: parseInt(offset as string) || 0,
    orderBy: (orderBy as string) || 'createdAt',
    direction: (orderDirection as 'ASC' | 'DESC') || 'DESC',
  });

  const result = await listPromotionsUseCase.execute(command);

  // Calculate pagination info
  const page = Math.floor((result.offset || 0) / (result.limit || 50)) + 1;
  const pages = Math.ceil(result.total / (result.limit || 50));

  adminRespond(req, res, 'promotions/index', {
    pageName: 'Promotions',
    promotions: result.data,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      page,
      pages,
      hasMore: result.hasMore,
    },
    filters: {
      status: status || '',
      type: type || '',
      search: search || '',
    },

    success: req.query.success || null,
  });
};

// ============================================================================
// Create Promotion Form
// ============================================================================

export const createPromotionForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'promotions/create', {
    pageName: 'Create Promotion',
  });
};

// ============================================================================
// Create Promotion
// ============================================================================

export const createPromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const {
      code,
      name,
      description,
      type,
      value,
      currency,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      usageLimitPerCustomer,
      startsAt,
      endsAt,
    } = body as {
      code?: string;
      name: string;
      description?: string;
      type: 'percentage' | 'fixed_amount' | 'free_shipping';
      value: string;
      currency?: string;
      minOrderAmount?: string;
      maxDiscountAmount?: string;
      usageLimit?: string;
      usageLimitPerCustomer?: string;
      startsAt?: string;
      endsAt?: string;
    };

    const promotionCurrency = currency || 'USD';
    const command = new CreatePromotionCommand({
      name: name,
      type: type,
      value: type === 'fixed_amount' ? toMinorUnits(parseFloat(value), promotionCurrency) : parseFloat(value),
      code: code,
      description: description,
      minOrderAmountCents: minOrderAmount ? toMinorUnits(parseFloat(minOrderAmount), promotionCurrency) : undefined,
      maxDiscountAmountCents: maxDiscountAmount ? toMinorUnits(parseFloat(maxDiscountAmount), promotionCurrency) : undefined,
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      usageLimitPerCustomer: usageLimitPerCustomer ? parseInt(usageLimitPerCustomer) : undefined,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
    });

    const result = await createPromotionUseCase.execute(command);

    redirectResponse(res, `/hub/promotions/${result.promotionId}?success=Promotion created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    // Reload form with error
    adminRespond(req, res, 'promotions/create', {
      pageName: 'Create Promotion',
      error: (error as Error).message || 'Failed to create promotion',
      formData: req.body as HttpRequestBody,
    });
  }
};

// ============================================================================
// View Promotion
// ============================================================================

export const viewPromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { promotionId } = req.params;

  const details = await managePromotionsUseCase.getWithDetails(promotionId);

  if (!details) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Promotion not found',
    });
    return;
  }

  const { promotion, actions } = details;
  const primaryAction = actions[0];

  adminRespond(req, res, 'promotions/view', {
    pageName: `Promotion: ${promotion.name}`,
    promotion: {
      ...promotion,
      type: primaryAction?.actionType,
      value: primaryAction?.value !== undefined ? Number(primaryAction.value) : undefined,
    },

    success: req.query.success || null,
  });
};

// ============================================================================
// Edit Promotion Form
// ============================================================================

export const editPromotionForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { promotionId } = req.params;

  const promotion = await managePromotionsUseCase.findById(promotionId);

  if (!promotion) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Promotion not found',
    });
    return;
  }

  adminRespond(req, res, 'promotions/edit', {
    pageName: `Edit: ${promotion.name}`,
    promotion,
  });
};

// ============================================================================
// Update Promotion
// ============================================================================

interface PromotionFormFields {
  name?: string;
  description?: string | null;
  status?: string;
  value?: string;
  minOrderAmount?: string;
  maxDiscountAmount?: string;
  currency?: string;
  usageLimit?: string;
  usageLimitPerCustomer?: string;
  startsAt?: string;
  endsAt?: string;
  isActive?: string | boolean;
}

function buildPromotionUpdates(body: PromotionFormFields): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  const verbatim = (field: keyof PromotionFormFields, key: string): void => {
    const value = body[field];
    if (value !== undefined) updates[key] = value;
  };
  const convert = <T>(field: keyof PromotionFormFields, key: string, fn: (v: string) => T): void => {
    const value = body[field] as string | undefined;
    if (value !== undefined) updates[key] = value ? fn(value) : undefined;
  };

  verbatim('name', 'name');
  verbatim('description', 'description');
  verbatim('status', 'status');
  const updateCurrency = body.currency || 'USD';
  if (body.value !== undefined) updates.value = parseFloat(body.value);
  convert('minOrderAmount', 'minOrderAmountCents', v => toMinorUnits(parseFloat(v), updateCurrency));
  convert('maxDiscountAmount', 'maxDiscountAmountCents', v => toMinorUnits(parseFloat(v), updateCurrency));
  convert('usageLimit', 'usageLimit', v => parseInt(v));
  convert('usageLimitPerCustomer', 'usageLimitPerCustomer', v => parseInt(v));
  convert('startsAt', 'startsAt', v => new Date(v));
  convert('endsAt', 'endsAt', v => new Date(v));
  if (body.isActive !== undefined) updates.isActive = body.isActive === 'true' || body.isActive === true;
  return updates;
}

export const updatePromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { promotionId } = req.params;

  // Map form fields to update object
  const body = req.body as HttpRequestBody;
  const updates = buildPromotionUpdates(body as PromotionFormFields);

  const command = new UpdatePromotionCommand(promotionId, updates);
  await updatePromotionUseCase.execute(command);

  redirectResponse(res, `/hub/promotions/${promotionId}?success=Promotion updated successfully`);
};

// ============================================================================
// Delete Promotion (AJAX)
// ============================================================================

export const deletePromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { promotionId } = req.params;

  const command = new DeletePromotionCommand(promotionId);
  await deletePromotionUseCase.execute(command);

  jsonResponse(res, 200, { success: true, message: 'Promotion deleted successfully' });
};

// ============================================================================
// Promotion Preview (server-side evaluation via EvaluatePromotionsUseCase)
// ============================================================================

interface PreviewItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  categoryId?: string;
  isDigital?: boolean;
}

interface PreviewBody {
  items?: PreviewItem[];
  subtotal?: string;
  shippingAmount?: string;
  customerId?: string;
  customerGroup?: string;
  isFirstOrder?: string;
  shippingMethodId?: string;
  paymentMethodId?: string;
  couponCode?: string;
  currency?: string;
  itemQty?: string;
  cartTotal?: string;
}

// Build sample cart items from request (single synthetic item when no list given)
function previewItems(body: PreviewBody): PreviewItem[] {
  if (Array.isArray(body.items)) return body.items;
  return [
    {
      productId: 'sample-product',
      name: 'Sample Product',
      quantity: parseInt(body.itemQty as string, 10) || 1,
      unitPriceCents: toMinorUnits(
        parseFloat(body.cartTotal as string) || parseFloat(body.subtotal as string) || 100,
        body.currency || 'USD',
      ),
    },
  ];
}

function buildPreviewContext(body: PreviewBody): PromotionEvaluationContext {
  const currency = body.currency || 'USD';
  const items = previewItems(body);
  return {
    items: items.map(item => ({
      productId: item.productId || 'sample-product',
      name: item.name || 'Sample Product',
      quantity: item.quantity || 1,
      unitPriceCents: item.unitPriceCents || 0,
      categoryId: item.categoryId,
      isDigital: item.isDigital,
    })),
    subtotalCents: body.subtotal
      ? toMinorUnits(parseFloat(body.subtotal as string), currency)
      : items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    shippingAmountCents: toMinorUnits(parseFloat(body.shippingAmount as string) || 0, currency),
    customerId: body.customerId || undefined,
    customerGroup: body.customerGroup || undefined,
    isFirstOrder: body.isFirstOrder === 'true',
    shippingMethodId: body.shippingMethodId || undefined,
    paymentMethodId: body.paymentMethodId || undefined,
    couponCode: body.couponCode || undefined,
    currency,
  };
}

export const previewPromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as PreviewBody;
    const context = buildPreviewContext(body);

    const result = await evaluatePromotionsUseCase.execute(context);

    jsonResponse(res, 200, {
      success: true,
      totalDiscountAmountCents: result.totalDiscountAmountCents,
      shippingDiscountAmountCents: result.shippingDiscountAmountCents,
      freeShipping: result.freeShipping,
      lineItemDiscounts: result.lineItemDiscounts,
      freeItems: result.freeItems,
      appliedPromotions: result.appliedPromotions,
      message: result.message,
      finalTotalCents: context.subtotalCents - result.totalDiscountAmountCents,
    });
  } catch (error: unknown) {
    logger.warn('Error previewing promotion:', error);
    jsonResponse(res, 500, { success: false, error: (error as Error).message });
  }
};
