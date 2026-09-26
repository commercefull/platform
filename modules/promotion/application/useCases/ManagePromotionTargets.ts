import type {
  PromotionCart,
  PromotionCategory,
  PromotionProductDiscount,
} from '../../../../libs/db/types';

export type PromotionCartCreateParams = Pick<PromotionCart, 'basketId' | 'promotionId' | 'discountAmountCents' | 'status'> &
  Partial<Pick<PromotionCart, 'promotionCouponId' | 'couponCode' | 'currencyCode' | 'appliedBy'>>;
export type PromotionCartUpdateParams = Partial<Pick<PromotionCart, 'discountAmountCents' | 'status'>>;

export type PromotionCategoryCreateParams = Pick<PromotionCategory, 'productCategoryId' | 'promotionId' | 'displayOrder'> &
  Partial<
    Pick<
      PromotionCategory,
      'bannerText' | 'bannerColor' | 'bannerBackgroundColor' | 'bannerImageUrl' | 'isDisplayedOnCategoryPage' | 'isDisplayedOnProductPage'
    >
  >;
export type PromotionCategoryUpdateParams = Partial<Omit<PromotionCategoryCreateParams, 'productCategoryId' | 'promotionId'>>;

export interface PromotionCartPort {
  create(props: PromotionCartCreateParams): Promise<PromotionCart>;
  update(id: string, props: PromotionCartUpdateParams): Promise<PromotionCart>;
  getById(id: string): Promise<PromotionCart | null>;
  getByBasketId(basketId: string): Promise<PromotionCart[]>;
  delete(id: string): Promise<boolean>;
}

export interface PromotionCategoryPort {
  create(props: PromotionCategoryCreateParams): Promise<PromotionCategory>;
  update(id: string, props: PromotionCategoryUpdateParams): Promise<PromotionCategory>;
  getById(id: string): Promise<PromotionCategory | null>;
  getByCategoryId(categoryId: string): Promise<PromotionCategory[]>;
  getByPromotionId(promotionId: string): Promise<PromotionCategory[]>;
  getActivePromotions(): Promise<PromotionCategory[]>;
  delete(id: string): Promise<boolean>;
}

export type ProductDiscountCreateParams = {
  promotionId?: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  currencyCode?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  priority?: number;
  appliesTo?: 'specific_products' | 'all_products';
  minimumQuantity?: number;
  maximumQuantity?: number;
  minimumAmountCents?: number;
  maximumDiscountAmountCents?: number;
  stackable?: boolean;
  displayOnProductPage?: boolean;
  displayInListing?: boolean;
  badgeText?: string;
  badgeStyle?: Record<string, unknown>;
  organizationId?: string;
};
export type ProductDiscountUpdateParams = Partial<ProductDiscountCreateParams>;

export interface ProductDiscountPort {
  create(input: ProductDiscountCreateParams): Promise<PromotionProductDiscount>;
  update(id: string, input: ProductDiscountUpdateParams): Promise<PromotionProductDiscount>;
  findById(id: string): Promise<PromotionProductDiscount | null>;
  findActive(organizationId?: string): Promise<PromotionProductDiscount[]>;
  delete(id: string): Promise<boolean>;
  findDiscountsForProduct(productId: string, organizationId?: string): Promise<PromotionProductDiscount[]>;
  findDiscountsForCategory(categoryId: string, organizationId?: string): Promise<PromotionProductDiscount[]>;
}

export class ManagePromotionTargetsUseCase {
  constructor(
    private readonly carts: PromotionCartPort,
    private readonly categories: PromotionCategoryPort,
    private readonly discounts: ProductDiscountPort,
  ) {}

  // Cart promotions
  async createCartPromotion(props: PromotionCartCreateParams) {
    return this.carts.create(props);
  }
  async updateCartPromotion(id: string, props: PromotionCartUpdateParams) {
    return this.carts.update(id, props);
  }
  async getCartPromotionById(id: string) {
    return this.carts.getById(id);
  }
  async getCartPromotionsByBasketId(basketId: string) {
    return this.carts.getByBasketId(basketId);
  }
  async deleteCartPromotion(id: string) {
    return this.carts.delete(id);
  }

  // Category promotions
  async createCategoryPromotion(props: PromotionCategoryCreateParams) {
    return this.categories.create(props);
  }
  async updateCategoryPromotion(id: string, props: PromotionCategoryUpdateParams) {
    return this.categories.update(id, props);
  }
  async getCategoryPromotionById(id: string) {
    return this.categories.getById(id);
  }
  async getCategoryPromotionsByCategoryId(categoryId: string) {
    return this.categories.getByCategoryId(categoryId);
  }
  async getCategoryPromotionsByPromotionId(promotionId: string) {
    return this.categories.getByPromotionId(promotionId);
  }
  async getActiveCategoryPromotions() {
    return this.categories.getActivePromotions();
  }
  async deleteCategoryPromotion(id: string) {
    return this.categories.delete(id);
  }

  // Product discounts
  async createProductDiscount(input: ProductDiscountCreateParams) {
    return this.discounts.create(input);
  }
  async updateProductDiscount(id: string, input: ProductDiscountUpdateParams) {
    return this.discounts.update(id, input);
  }
  async findProductDiscountById(id: string) {
    return this.discounts.findById(id);
  }
  async findActiveProductDiscounts(organizationId?: string) {
    return this.discounts.findActive(organizationId);
  }
  async deleteProductDiscount(id: string) {
    return this.discounts.delete(id);
  }
  async findDiscountsForProduct(productId: string, organizationId?: string) {
    return this.discounts.findDiscountsForProduct(productId, organizationId);
  }
  async findDiscountsForCategory(categoryId: string, organizationId?: string) {
    return this.discounts.findDiscountsForCategory(categoryId, organizationId);
  }
}
