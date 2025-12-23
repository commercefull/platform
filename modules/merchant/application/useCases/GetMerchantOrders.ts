/**
 * GetMerchantOrders Use Case
 * Lists orders filtered by merchant (multi-tenant isolation)
 */

export interface GetMerchantOrdersInput {
  merchantId: string;
  status?: string;
  paymentStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface MerchantOrder {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: Date;
}

export interface GetMerchantOrdersOutput {
  orders: MerchantOrder[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface MerchantOrderRepository {
  findByMerchant(
    merchantId: string,
    filters: {
      status?: string;
      paymentStatus?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
    },
    limit: number,
    offset: number,
    orderBy: string,
    orderDirection: 'asc' | 'desc',
  ): Promise<{ orders: MerchantOrder[]; total: number }>;
}

export class GetMerchantOrdersUseCase {
  constructor(private readonly repo: MerchantOrderRepository) {}

  async execute(input: GetMerchantOrdersInput): Promise<GetMerchantOrdersOutput> {
    if (!input.merchantId) {
      throw new Error('Merchant ID is required');
    }

    const limit = input.limit || 20;
    const offset = input.offset || 0;
    const orderBy = input.orderBy || 'createdAt';
    const orderDirection = input.orderDirection || 'desc';

    const { orders, total } = await this.repo.findByMerchant(
      input.merchantId,
      {
        status: input.status,
        paymentStatus: input.paymentStatus,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        search: input.search,
      },
      limit,
      offset,
      orderBy,
      orderDirection,
    );

    return {
      orders,
      total,
      limit,
      offset,
      hasMore: offset + orders.length < total,
    };
  }
}
