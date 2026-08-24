/**
 * ProductPriceDataPort
 *
 * ACL port owned by pricing. Provides read-only access to product
 * and variant data needed for price calculation.
 *
 * Only the adapter may import from product's infrastructure.
 */

export interface ProductPriceData {
  productId: string;
  categoryId?: string;
}

export interface VariantPriceData {
  variantId: string;
  productId: string;
  price: number;
}

export interface ProductPriceDataPort {
  findProductById(productId: string): Promise<ProductPriceData | null>;
  findVariantById(variantId: string): Promise<VariantPriceData | null>;
  findDefaultVariantForProduct(productId: string): Promise<VariantPriceData | null>;
}
