/**
 * ProductDetailsAdapter
 *
 * ACL adapter implementing basket's ProductDetailsPort via the
 * product module's public use case. Only this adapter may import
 * from product's application layer.
 */

import { getProductUseCase } from '../../../product/application/useCases/wired';
import { GetProductCommand } from '../../../product/application/useCases/GetProduct';
import { logger } from '../../../../libs/logger';
import type { ProductDetailsPort } from '../../application/ports/ProductDetailsPort';

export class ProductDetailsAdapter implements ProductDetailsPort {
  async findProductDetails(productId: string): Promise<{ sku: string; name: string } | null> {
    try {
      const product = await getProductUseCase.execute(new GetProductCommand(productId));
      if (!product) return null;
      return { sku: product.sku ?? '', name: product.name };
    } catch (error) {
      logger.debug('Product details lookup failed', { productId, error: (error as Error).message });
      return null;
    }
  }
}
