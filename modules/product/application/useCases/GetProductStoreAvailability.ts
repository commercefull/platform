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

    const params: unknown[] = [input.productId, input.variantId || null];
    let storeClause = '';
    if (input.storeId) {
      params.push(input.storeId);
      storeClause = ` AND il."storeId" = $${params.length}`;
    }

    interface StoreAvailabilityRow {
      storeId: string;
      storeName: string | null;
      inventoryLocationId: string;
      quantity: number;
      reservedQuantity: number;
      availableQuantity: number;
    }

    const rows = await query<StoreAvailabilityRow[]>(
      `SELECT il."storeId",
              s.name AS "storeName",
              il."inventoryLocationId",
              il.quantity::int AS quantity,
              il."reservedQuantity"::int AS "reservedQuantity",
              il."availableQuantity"::int AS "availableQuantity"
       FROM "inventoryLocation" il
       LEFT JOIN store s ON s."storeId" = il."storeId"
       WHERE il."productId" = $1
         AND il."productVariantId" IS NOT DISTINCT FROM $2
         AND il."storeId" IS NOT NULL${storeClause}
       ORDER BY s.name ASC NULLS LAST`,
      params,
    );

    const stores = (rows || []).map(row => ({
      storeId: row.storeId,
      storeName: row.storeName || 'Unknown Store',
      locationId: row.inventoryLocationId,
      quantity: row.quantity ?? 0,
      reservedQuantity: row.reservedQuantity ?? 0,
      availableQuantity: row.availableQuantity ?? 0,
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
