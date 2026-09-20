import type { HttpRequest, HttpResponse } from 'libs/http';
import { couponDiscountRepository, type CreateCouponInput, type UpdateCouponInput } from '../../application/wired';

const couponRepo = couponDiscountRepository.coupons;

interface ValidateCouponBody {
  code: string;
  orderTotal: string;
  customerId?: string;
  organizationId?: string;
}

interface CalculateDiscountBody {
  code: string;
  orderTotal: string;
  items?: unknown[];
  organizationId?: string;
}

/**
 * Get all active coupons
 */
export const getActiveCoupons = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId, limit, offset, orderBy, direction } = req.query;

  const coupons = await couponRepo.findActiveCoupons(organizationId as string | undefined, {
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
  const coupon = await couponRepo.findById(id);

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

  const coupon = await couponRepo.findByCode(code, organizationId as string | undefined);

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

  // Validate required fields
  if (!couponData.code || !couponData.name || !couponData.type) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: code, name, and type are required',
    });
    return;
  }

  // Check if code already exists
  const existingCoupon = await couponRepo.findByCode(couponData.code, couponData.organizationId);
  if (existingCoupon) {
    res.status(400).json({
      success: false,
      message: 'Coupon code already exists',
    });
    return;
  }

  // Default values are handled by the repository

  const coupon = await couponRepo.create(couponData);

  res.status(201).json({
    success: true,
    data: coupon,
    message: 'Coupon created successfully',
  });
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
  const existingCoupon = await couponRepo.findById(id);
  if (!existingCoupon) {
    res.status(404).json({
      success: false,
      message: 'Coupon not found',
    });
    return;
  }

  // Code cannot be changed via update (it's excluded from UpdateCouponInput)

  const updatedCoupon = await couponRepo.update(id, couponData);

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
  const existingCoupon = await couponRepo.findById(id);
  if (!existingCoupon) {
    res.status(404).json({
      success: false,
      message: 'Coupon not found',
    });
    return;
  }

  await couponRepo.delete(id);

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
  const { code, orderTotal, customerId, organizationId } = req.body;

  // Validation
  if (!code || orderTotal === undefined) {
    res.status(400).json({
      success: false,
      message: 'Coupon code and order total are required',
    });
    return;
  }

  // Validate the coupon
  const result = await couponRepo.validate(code, parseFloat(orderTotal), customerId, organizationId);

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
};

/**
 * Get coupon usage
 */
export const getCouponUsage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if coupon exists
  const existingCoupon = await couponRepo.findById(id);
  if (!existingCoupon) {
    res.status(404).json({
      success: false,
      message: 'Coupon not found',
    });
    return;
  }

  const usage = await couponRepo.getUsage(id);

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
  const { code, orderTotal, items: _items, organizationId } = req.body;

  // Validation
  if (!code || orderTotal === undefined) {
    res.status(400).json({
      success: false,
      message: 'Coupon code and order total are required',
    });
    return;
  }

  // Get coupon
  const coupon = await couponRepo.findByCode(code, organizationId);
  if (!coupon) {
    res.status(404).json({
      success: false,
      message: 'Coupon not found',
    });
    return;
  }

  // Calculate discount
  const discountAmount = couponRepo.calculateDiscount(coupon, parseFloat(orderTotal));

  res.status(200).json({
    success: true,
    data: {
      coupon,
      orderTotal: parseFloat(orderTotal),
      discountAmount,
      finalTotal: parseFloat(orderTotal) - discountAmount,
    },
  });
};
