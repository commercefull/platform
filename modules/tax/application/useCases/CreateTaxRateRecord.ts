/**
 * CreateTaxRateRecord Use Case
 *
 * Creates a catalog tax rate (bound to a tax category and zone) after
 * validating required fields and normalizing defaults. Named `…Record` to
 * distinguish it from the legacy `CreateTaxRateUseCase`, which targets a
 * different input model used by the GraphQL layer.
 */

import { TaxRate, TaxRateType } from '../../taxTypes';
import { TaxValidationError } from '../../domain/errors/TaxErrors';

export interface CreateTaxRateRecordCommand {
  name?: string;
  description?: string;
  rate?: string | number;
  taxCategoryId?: string;
  taxZoneId?: string;
  priority?: string | number;
  isActive?: boolean;
  type?: string;
  isCompound?: boolean;
  includeInPrice?: boolean;
  isShippingTaxable?: boolean;
  startDate?: Date | string | number;
}

// JSON bodies carry dates as ISO strings or epoch numbers — coerce to Date.
// Values below 1e12 are treated as epoch seconds, larger values as milliseconds.
const coerceDate = (value: Date | string | number): Date => {
  const date = value instanceof Date ? value : typeof value === 'number' ? new Date(value < 1e12 ? value * 1000 : value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TaxValidationError('startDate must be a valid date');
  }
  return date;
};

interface TaxRateWritePort {
  createTaxRate(rate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRate>;
}

export class CreateTaxRateRecordUseCase {
  constructor(private readonly commands: TaxRateWritePort) {}

  async execute(command: CreateTaxRateRecordCommand): Promise<TaxRate> {
    const {
      name,
      description,
      rate,
      taxCategoryId,
      taxZoneId,
      priority,
      isActive,
      type,
      isCompound,
      includeInPrice,
      isShippingTaxable,
      startDate,
    } = command;

    if (!name || rate === undefined || !taxCategoryId || !taxZoneId) {
      throw new TaxValidationError('Name, rate, tax category ID, and tax zone ID are required');
    }

    return this.commands.createTaxRate({
      name,
      description,
      rate: parseFloat(String(rate)),
      taxCategoryId,
      taxZoneId,
      priority: priority ? parseInt(String(priority)) : 1,
      isActive: isActive !== undefined ? isActive : true,
      type: (type || 'percentage') as TaxRateType,
      isCompound: isCompound !== undefined ? isCompound : false,
      includeInPrice: includeInPrice !== undefined ? includeInPrice : false,
      isShippingTaxable: isShippingTaxable !== undefined ? isShippingTaxable : false,
      startDate: startDate ? coerceDate(startDate) : new Date(),
    });
  }
}
