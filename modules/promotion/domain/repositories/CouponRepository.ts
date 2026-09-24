/**
 * Coupon Repository Port
 *
 * Domain interface for coupon data access. Record types match the
 * `promotionCoupon` / `promotionCouponUsage` database schema.
 */

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixedAmount',
  FREE_SHIPPING = 'freeShipping',
  BUY_X_GET_Y = 'buyXGetY',
  FIRST_ORDER = 'firstOrder',
  GIFT_CARD = 'giftCard',
}

export enum CouponGenerationMethod {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  PATTERN = 'pattern',
  IMPORTED = 'imported',
}

export interface PromotionCoupon {
  promotionCouponId: string;
  createdAt: Date;
  updatedAt: Date;
  code: string;
  promotionId?: string;
  name: string;
  description?: string;
  type: CouponType;
  discountAmountCents?: number;
  currencyCode: string;
  minOrderAmountCents?: number;
  maxDiscountAmountCents?: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isOneTimeUse: boolean;
  maxUsage?: number;
  usageCount: number;
  maxUsagePerCustomer?: number;
  generationMethod: CouponGenerationMethod;
  isReferral: boolean;
  referrerId?: string;
  isPublic: boolean;
  organizationId?: string;
}

export interface PromotionCouponUsage {
  promotionCouponUsageId: string;
  createdAt: Date;
  updatedAt: Date;
  promotionCouponId: string;
  orderId?: string;
  customerId?: string;
  discountAmountCents: number;
  currencyCode: string;
  usedAt: Date;
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  promotionId?: string;
  type: CouponType;
  discountAmountCents?: number;
  currencyCode?: string;
  minOrderAmountCents?: number;
  maxDiscountAmountCents?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  isOneTimeUse?: boolean;
  maxUsage?: number;
  maxUsagePerCustomer?: number;
  generationMethod?: CouponGenerationMethod;
  isReferral?: boolean;
  referrerId?: string;
  isPublic?: boolean;
  organizationId?: string;
}

export type UpdateCouponInput = Partial<Omit<CreateCouponInput, 'code'>>;

export interface CouponValidationResult {
  valid: boolean;
  coupon?: PromotionCoupon;
  message?: string;
}

export interface CouponListOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  direction?: 'ASC' | 'DESC';
  isActive?: boolean;
}

export interface CouponRepository {
  findById(id: string): Promise<PromotionCoupon | null>;
  findByCode(code: string, organizationId?: string): Promise<PromotionCoupon | null>;
  findAll(organizationId?: string, options?: CouponListOptions): Promise<PromotionCoupon[]>;
  findActiveCoupons(organizationId?: string, options?: Omit<CouponListOptions, 'isActive'>): Promise<PromotionCoupon[]>;
  create(input: CreateCouponInput): Promise<PromotionCoupon>;
  update(id: string, input: UpdateCouponInput): Promise<PromotionCoupon>;
  delete(id: string): Promise<boolean>;
  recordUsage(
    couponId: string,
    orderId: string,
    customerId?: string,
    discountAmountCents?: number,
    currencyCode?: string,
  ): Promise<PromotionCouponUsage>;
  getUsage(couponId: string): Promise<PromotionCouponUsage[]>;
  getCustomerUsageCount(couponId: string, customerId: string): Promise<number>;
  validate(code: string, orderTotalCents: number, customerId?: string, organizationId?: string): Promise<CouponValidationResult>;
  calculateDiscount(coupon: PromotionCoupon, orderTotalCents: number): number;
}
