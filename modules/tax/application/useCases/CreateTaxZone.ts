/**
 * CreateTaxZone Use Case
 *
 * Creates a tax zone after validating required fields — a zone must have at
 * least one country — and normalizing defaults.
 */

import { TaxZone } from '../../taxTypes';
import { TaxValidationError } from '../../domain/errors/TaxErrors';

export interface CreateTaxZoneCommand {
  name?: string;
  code?: string;
  description?: string;
  isDefault?: boolean;
  countries?: string[];
  states?: string[];
  postcodes?: string[];
  cities?: string[];
  isActive?: boolean;
}

interface TaxZoneWritePort {
  createTaxZone(zone: Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxZone>;
}

export class CreateTaxZoneUseCase {
  constructor(private readonly commands: TaxZoneWritePort) {}

  async execute(command: CreateTaxZoneCommand): Promise<TaxZone> {
    const { name, code, description, isDefault, countries, states, postcodes, cities, isActive } = command;

    if (!name || !code || !countries || !Array.isArray(countries) || countries.length === 0) {
      throw new TaxValidationError('Name, code, and at least one country are required');
    }

    return this.commands.createTaxZone({
      name,
      code,
      description,
      isDefault: isDefault !== undefined ? isDefault : false,
      countries,
      states: states || [],
      postcodes: postcodes || [],
      cities: cities || [],
      isActive: isActive !== undefined ? isActive : true,
    });
  }
}
