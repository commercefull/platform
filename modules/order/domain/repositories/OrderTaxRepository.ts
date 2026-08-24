export interface OrderTax {
  orderTaxId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  orderItemId?: string;
  taxType: string;
  name: string;
  rate: number;
  amount: number;
  jurisdiction?: string;
  taxProvider?: string;
  providerTaxId?: string;
  isIncludedInPrice: boolean;
}

export type OrderTaxCreateParams = Omit<OrderTax, 'orderTaxId' | 'createdAt' | 'updatedAt'>;

export interface OrderTaxRepository {
  findByOrder(orderId: string): Promise<OrderTax[]>;
  create(params: OrderTaxCreateParams): Promise<OrderTax>;
}
