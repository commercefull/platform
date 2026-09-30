import { jsonResponse } from "libs/apiResponse";
/**
 * Coupon Controller
 *
 * HTTP interface for coupon management.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { CreateCouponCommand, ValidateCouponCommand } from '../../application/useCases';
import {
  applyCouponUseCase,
  createCouponUseCase,
  manageCouponsUseCase,
  redeemCouponUseCase,
  validateCouponUseCase,
} from '../../application/wired';

interface CreateCouponBody {
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  createdBy: string;
  description?: string;
  currency?: string;
  minOrderValueCents?: number;
  maxDiscountAmountCents?: number;
  usageType?: 'single_use' | 'multi_use' | 'unlimited';
  usageLimit?: number;
  customerUsageLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  applicableCustomerGroups?: string[];
  excludedProducts?: string[];
  excludedCategories?: string[];
  metadata?: Record<string, unknown>;
}

interface ValidateCouponBody {
  code?: string;
  orderValueCents: number;
  customerId?: string;
  items?: Array<{ productId: string; categoryId?: string; quantity: number; priceCents: number }>;
}

interface ApplyCouponBody {
  couponCode?: string;
  code?: string;
  basketId: string;
  customerId?: string;
  orderTotalCents: number;
  items?: Array<{ productId: string; categoryId?: string; quantity: number; priceCents: number }>;
}

interface RedeemCouponBody {
  code: string;
  orderId: string;
  customerId?: string;
  discountAmountCents: number;
}

export const createCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as CreateCouponBody;
  const useCase = createCouponUseCase;
  const command = new CreateCouponCommand(
    body.code,
    body.name,
    body.type,
    body.value,
    body.createdBy,
    body.description,
    body.currency,
    body.minOrderValueCents,
    body.maxDiscountAmountCents,
    body.usageType,
    body.usageLimit,
    body.customerUsageLimit,
    body.startsAt ? new Date(body.startsAt) : undefined,
    body.expiresAt ? new Date(body.expiresAt) : undefined,
    body.applicableProducts,
    body.applicableCategories,
    body.applicableCustomerGroups,
    body.excludedProducts,
    body.excludedCategories,
    body.metadata,
  );
  const coupon = await useCase.execute(command);
  jsonResponse(res, 201, { success: true, data: coupon });
};

export const validateCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = (req.body || {}) as ValidateCouponBody;
  const useCase = validateCouponUseCase;
  const command = new ValidateCouponCommand(body.code || req.params.code, body.orderValueCents, body.customerId, body.items);
  const result = await useCase.execute(command);
  if (!result.valid) {
    jsonResponse(res, 400, { success: false, error: { message: result.error || 'Invalid coupon' } });
    return;
  }
  jsonResponse(res, 200, { success: true, data: result });
};

export const applyCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as ApplyCouponBody;
  const useCase = applyCouponUseCase;
  const result = await useCase.execute({
    couponCode: body.couponCode || body.code || '',
    basketId: body.basketId,
    customerId: body.customerId,
    orderTotalCents: body.orderTotalCents,
    items: body.items,
  });
  jsonResponse(res, 200, { success: true, data: result });
};

export const redeemCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as RedeemCouponBody;
  const useCase = redeemCouponUseCase;
  const result = await useCase.execute({
    couponCode: body.code,
    orderId: body.orderId,
    customerId: body.customerId,
    discountAmountCents: body.discountAmountCents,
  });
  jsonResponse(res, 200, { success: true, data: result });
};

export const getCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { couponId } = req.params;

  // Validate UUID format to prevent route collisions (e.g. /coupons/inventory-receipts)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!couponId || !uuidRegex.test(couponId)) {
    jsonResponse(res, 400, { success: false, error: 'Invalid coupon ID format' });
    return;
  }

  const coupon = await manageCouponsUseCase.findById(couponId);
  if (!coupon) {
    jsonResponse(res, 404, { success: false, error: 'Coupon not found' });
    return;
  }
  jsonResponse(res, 200, { success: true, data: coupon });
};

export const listCoupons = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const result = await manageCouponsUseCase.findAll(
    {
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      type: req.query.type as string | undefined,
      usageType: req.query.usageType as string | undefined,
    },
    {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    },
  );
  jsonResponse(res, 200, { success: true, data: result });
};

export const deleteCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  await manageCouponsUseCase.delete(req.params.couponId);
  jsonResponse(res, 200, { success: true, message: 'Coupon deleted' });
};

export default {
  createCoupon,
  validateCoupon,
  applyCoupon,
  redeemCoupon,
  getCoupon,
  listCoupons,
  deleteCoupon,
};
