import { query } from '../../../../libs/db';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

export interface ProductStoreAvailabilityInput {
  productId: string;
  variantId?: string;
  storeId?: string;
}

export interface ProductStoreAvailabilityOutput {
  productId: string;
  variantId?: string;
  sku: string;
  totalQuantity: number;
  stores: Array<{
    storeId: string;
    storeName: string;
    locationId: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }>;
}

export class GetProductStoreAvailabilityUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: ProductStoreAvailabilityInput): Promise<ProductStoreAvailabilityOutput> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const variant = input.variantId
      ? await this.productRepository.findVariantById(input.variantId)
      : await this.productRepository.getDefaultVariant(input.productId);

    const params: any[] = [input.productId, input.variantId || null];
    let storeClause = '';
    if (input.storeId) {
      params.push(input.storeId);
      storeClause = ` AND l."storeId" = $${params.length}`;
    }

    const rows = await query<Record<string, any>[]>(
      `SELECT l."storeId", s.name as "storeName", i."locationId",
              i.quantity, i."reservedQuantity", i."availableQuantity"
       FROM inventory i
       INNER JOIN "inventoryLocation" l ON l."locationId" = i."locationId"
       LEFT JOIN store s ON s."storeId" = l."storeId"
       WHERE i."productId" = $1
         AND i."variantId" IS NOT DISTINCT FROM $2
         AND l."storeId" IS NOT NULL${storeClause}
       ORDER BY s.name ASC NULLS LAST`,
      params,
    );

    const stores = (rows || []).map(row => ({
      storeId: row.storeId,
      storeName: row.storeName || 'Unknown Store',
      locationId: row.locationId,
      quantity: parseInt(row.quantity || '0', 10),
      reservedQuantity: parseInt(row.reservedQuantity || '0', 10),
      availableQuantity: parseInt(row.availableQuantity || '0', 10),
    }));

    const resolvedSku = variant?.sku || product.sku || input.variantId || input.productId;

    return {
      productId: input.productId,
      variantId: input.variantId,
      sku: resolvedSku,
      totalQuantity: stores.reduce((sum, store) => sum + store.quantity, 0),
      stores,
    };
  }
}
