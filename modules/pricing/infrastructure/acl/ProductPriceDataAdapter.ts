/**
 * ProductPriceDataAdapter
 *
 * ACL adapter implementing pricing's ProductPriceDataPort.
 * Translates product's productRepo + productVariantRepo into
 * pricing's ProductPriceData / VariantPriceData vocabulary.
 *
 * Only this adapter may import from product's infrastructure.
 */

import {
  ProductPriceDataPort,
  ProductPriceData,
  VariantPriceData,
} from '../../application/ports/ProductPriceDataPort';
import productCatalogRepository from '../../../product/infrastructure/repositories/ProductCatalogRepository';

const productRepo = productCatalogRepository.products;
const productVariantRepo = productCatalogRepository.variants;

export class ProductPriceDataAdapter implements ProductPriceDataPort {
  async findProductById(productId: string): Promise<ProductPriceData | null> {
    const product = await productRepo.findById(productId);
    if (!product) return null;
    return {
      productId: product.productId,
      categoryId: product.categoryId,
    };
  }

  async findVariantById(variantId: string): Promise<VariantPriceData | null> {
    const variant = await productVariantRepo.findById(variantId);
    if (!variant) return null;
    return {
      variantId: variant.id,
      productId: variant.productId,
      price: variant.price,
    };
  }

  async findDefaultVariantForProduct(productId: string): Promise<VariantPriceData | null> {
    const variant = await productVariantRepo.findDefaultForProduct(productId);
    if (!variant) return null;
    return {
      variantId: variant.id,
      productId: variant.productId,
      price: variant.price,
    };
  }
}
