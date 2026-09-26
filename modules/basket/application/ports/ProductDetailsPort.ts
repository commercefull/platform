/**
 * ProductDetailsPort
 * Read-only product info needed when adding items to a basket
 * (sku/name resolution when the client did not supply them).
 */
export interface ProductDetailsPort {
  findProductDetails(productId: string): Promise<{ sku: string; name: string } | null>;
}
