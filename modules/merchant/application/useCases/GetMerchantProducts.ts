/**
 * GetMerchantProducts Use Case
 * Lists products filtered by merchant (multi-tenant isolation)
 */

export interface GetMerchantProductsInput {
  merchantId: string;
  status?: string;
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface MerchantProduct {
  productId: string;
  name: string;
  sku: string;
  price: number;
  status: string;
  stockQuantity: number;
  categoryName?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMerchantProductsOutput {
  products: MerchantProduct[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface MerchantProductRepository {
  findByMerchant(
    merchantId: string,
    filters: {
      status?: string;
      search?: string;
      categoryId?: string;
    },
    limit: number,
    offset: number,
    orderBy: string,
    orderDirection: 'asc' | 'desc',
  ): Promise<{ products: MerchantProduct[]; total: number }>;
}

export class GetMerchantProductsUseCase {
  constructor(private readonly repo: MerchantProductRepository) {}

  async execute(input: GetMerchantProductsInput): Promise<GetMerchantProductsOutput> {
    if (!input.merchantId) {
      throw new Error('Merchant ID is required');
    }

    const limit = input.limit || 20;
    const offset = input.offset || 0;
    const orderBy = input.orderBy || 'createdAt';
    const orderDirection = input.orderDirection || 'desc';

    const { products, total } = await this.repo.findByMerchant(
      input.merchantId,
      {
        status: input.status,
        search: input.search,
        categoryId: input.categoryId,
      },
      limit,
      offset,
      orderBy,
      orderDirection,
    );

    return {
      products,
      total,
      limit,
      offset,
      hasMore: offset + products.length < total,
    };
  }
}
