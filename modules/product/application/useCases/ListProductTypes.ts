import type { ProductTypeRow, ProductTypePort } from '../../domain/repositories/ProductCatalogPorts';

export class ListProductTypesUseCase {
  constructor(private readonly productTypeRepository: ProductTypePort) {}

  async execute(): Promise<ProductTypeRow[]> {
    return this.productTypeRepository.findAll();
  }
}
