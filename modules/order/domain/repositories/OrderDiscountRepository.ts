export type DiscountType = 'percentage' | 'fixedAmount' | 'freeShipping' | 'buyXGetY' | 'giftCard';

export interface OrderDiscount {
  orderDiscountId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  orderItemId?: string;
  code?: string;
  name: string;
  description?: string;
  type: DiscountType;
  /** Polymorphic operand: percentage or fixed amount. */
  value: number;
  /** Discount amount in integer cents. */
  discountAmountCents: number;
}

export type OrderDiscountCreateParams = Omit<OrderDiscount, 'orderDiscountId' | 'createdAt' | 'updatedAt'>;

export interface OrderDiscountRepository {
  findByOrder(orderId: string): Promise<OrderDiscount[]>;
  create(params: OrderDiscountCreateParams): Promise<OrderDiscount>;
}
