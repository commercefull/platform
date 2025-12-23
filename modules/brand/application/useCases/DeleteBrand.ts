/**
 * DeleteBrand Use Case
 */

import { IBrandRepository } from '../../domain/repositories/BrandRepository';

export interface DeleteBrandInput {
  brandId: string;
}

export interface DeleteBrandOutput {
  success: boolean;
}

export class DeleteBrandUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  async execute(input: DeleteBrandInput): Promise<DeleteBrandOutput> {
    const brand = await this.brandRepository.findById(input.brandId);
    if (!brand) {
      throw new Error(`Brand not found: ${input.brandId}`);
    }

    const success = await this.brandRepository.delete(input.brandId);
    return { success };
  }
}
