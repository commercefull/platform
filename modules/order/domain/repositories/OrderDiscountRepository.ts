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
  value: number;
  discountAmount: number;
}

export type OrderDiscountCreateParams = Omit<OrderDiscount, 'orderDiscountId' | 'createdAt' | 'updatedAt'>;

export interface OrderDiscountRepository {
  findByOrder(orderId: string): Promise<OrderDiscount[]>;
  create(params: OrderDiscountCreateParams): Promise<OrderDiscount>;
}
