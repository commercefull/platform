import { ProductTypeRepository, ProductType } from '../../infrastructure/repositories/ProductTypeRepository';

export class ListProductTypesUseCase {
  constructor(private readonly productTypeRepository: ProductTypeRepository) {}

  async execute(): Promise<ProductType[]> {
    return this.productTypeRepository.findAll();
  }
}
