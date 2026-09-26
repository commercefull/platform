/**
 * CreateTaxCategory Use Case
 *
 * Creates a tax category after validating required fields and normalizing
 * defaults.
 */

import { TaxCategory } from '../../taxTypes';
import { TaxValidationError } from '../../domain/errors/TaxErrors';

export interface CreateTaxCategoryCommand {
  name?: string;
  code?: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: string;
  isActive?: boolean;
}

interface TaxCategoryWritePort {
  createTaxCategory(category: Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxCategory>;
}

export class CreateTaxCategoryUseCase {
  constructor(private readonly commands: TaxCategoryWritePort) {}

  async execute(command: CreateTaxCategoryCommand): Promise<TaxCategory> {
    const { name, code, description, isDefault, sortOrder, isActive } = command;

    if (!name || !code) {
      throw new TaxValidationError('Name and code are required');
    }

    return this.commands.createTaxCategory({
      name,
      code,
      description,
      isDefault: isDefault !== undefined ? isDefault : false,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      isActive: isActive !== undefined ? isActive : true,
    });
  }
}
