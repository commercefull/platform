import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  type CreateCouponInput,
  type UpdateCouponInput,
  createCouponUseCase,
  validateCouponCodeUseCase,
  calculateCouponDiscountUseCase,
  manageCouponsUseCase,
} from '../../application/wired';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';

interface ValidateCouponBody {
  code: string;
  orderTotalCents: string;
  customerId?: string;
  organizationId?: string;
}

interface CalculateDiscountBody {
  code: string;
  orderTotalCents: string;
  items?: unknown[];
  organizationId?: string;
}

/**
 * Get all active coupons
 */
export const getActiveCoupons = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId, limit, offset, orderBy, direction } = req.query;

  const coupons = await manageCouponsUseCase.findActiveCoupons(organizationId as string | undefined, {
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
    orderBy: orderBy as string | undefined,
    direction: direction as 'ASC' | 'DESC' | undefined,
  });

  res.status(200).json({
    success: true,
    data: coupons || [],
    pagination: {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    },
  });
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const coupon = await manageCouponsUseCase.findById(id);

  if (!coupon) {
    res.status(404).json({ success: false, message: 'Coupon not found' });
    return;
  }

  res.status(200).json({ success: true, data: coupon });
};

/**
 * Get coupon by code
 */
export const getCouponByCode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code } = req.params;
  const { organizationId } = req.query;

  const coupon = await manageCouponsUseCase.findByCode(code, organizationId as string | undefined);

  if (!coupon) {
    res.status(404).json({ success: false, message: 'Coupon not found' });
    return;
  }

  res.status(200).json({ success: true, data: coupon });
};

/**
 * Create a new coupon
 */
export const createCoupon = async (
  req: HttpRequest<Record<string, string>, unknown, CreateCouponInput>,
  res: HttpResponse,
): Promise<void> => {
  const couponData = { ...req.body } as CreateCouponInput & { type: string };

  // Map external type strings to the canonical CouponType enum values
  const typeMapping: Record<string, string> = {
    fixed_amount: 'fixedAmount',
    free_shipping: 'freeShipping',
    buy_x_get_y: 'buyXGetY',
    first_order: 'firstOrder',
    gift_card: 'giftCard',
    percentage: 'percentage',
  };
  if (typeof couponData.type === 'string' && typeMapping[couponData.type]) {
    couponData.type = typeMapping[couponData.type] as unknown as CreateCouponInput['type'];
  }

  try {
    const coupon = await createCouponUseCase.execute(couponData);

    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Update an existing coupon
 */
export const updateCoupon = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateCouponInput>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const couponData = req.body;

  // Check if coupon exists
  const existingCoupon = await manageCouponsUseCase.findById(id);
  if (!existingCoupon) {
    res.status(404).json({
      success: false,
      message: 'Coupon not found',
    });
    return;
  }

  // Code cannot be changed via update (it's excluded from UpdateCouponInput)

  const updatedCoupon = await manageCouponsUseCase.update(id, couponData);

  res.status(200).json({
    success: true,
    data: updatedCoupon,
    message: 'Coupon updated successfully',
  });
};

/**
 * Delete a coupon
 */
export const deleteCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if coupon exists
  const existingCoupon = await manageCouponsUseCase.findById(id);
  if (!existingCoupon) {
    res.status(404).json({
      success: false,
      message: 'Coupon not found',
    });
    return;
  }

  await manageCouponsUseCase.delete(id);

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully',
  });
};

/**
 * Validate a coupon for a cart
 */
export const validateCoupon = async (
  req: HttpRequest<Record<string, string>, unknown, ValidateCouponBody>,
  res: HttpResponse,
): Promise<void> => {
  const { code, orderTotalCents, customerId, organizationId } = req.body;

  try {
    const result = await validateCouponCodeUseCase.execute({
      code,
      orderTotalCents,
      customerId,
      organizationId,
    });

    if (!result.valid) {
      res.status(400).json({
        success: false,
        data: result,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Get coupon usage
 */
export const getCouponUsage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if coupon exists
  const existingCoupon = await manageCouponsUseCase.findById(id);
  if (!existingCoupon) {
    res.status(404).json({
      success: false,
      message: 'Coupon not found',
    });
    return;
  }

  const usage = await manageCouponsUseCase.getUsage(id);

  res.status(200).json({
    success: true,
    data: {
      coupon: existingCoupon,
      usage,
      totalUsage: existingCoupon.usageCount,
      remainingUsage: existingCoupon.maxUsage ? existingCoupon.maxUsage - existingCoupon.usageCount : null,
    },
  });
};

/**
 * Calculate coupon discount for a cart
 */
export const calculateCouponDiscount = async (
  req: HttpRequest<Record<string, string>, unknown, CalculateDiscountBody>,
  res: HttpResponse,
): Promise<void> => {
  const { code, orderTotalCents, items: _items, organizationId } = req.body;

  try {
    const result = await calculateCouponDiscountUseCase.execute({ code, orderTotalCents, organizationId });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};
