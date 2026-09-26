/**
 * UpdateTaxZone Use Case
 *
 * Updates a tax zone, validating that it exists and enforcing the zone
 * invariant that a countries update must leave at least one country.
 */

import { TaxZone } from '../../taxTypes';
import { TaxValidationError, TaxZoneNotFoundError } from '../../domain/errors/TaxErrors';

export interface UpdateTaxZoneCommand {
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

interface TaxZoneUpdatePort {
  findTaxZoneById(id: string): Promise<TaxZone | null>;
  updateTaxZone(id: string, zone: Partial<Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TaxZone>;
}

export class UpdateTaxZoneUseCase {
  constructor(private readonly port: TaxZoneUpdatePort) {}

  async execute(id: string, command: UpdateTaxZoneCommand): Promise<TaxZone> {
    const existing = await this.port.findTaxZoneById(id);

    if (!existing) {
      throw new TaxZoneNotFoundError(id);
    }

    const updatedTaxZone: Partial<Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>> = {};
    const { name, code, description, isDefault, countries, states, postcodes, cities, isActive } = command;

    if (name !== undefined) updatedTaxZone.name = name;
    if (code !== undefined) updatedTaxZone.code = code;
    if (description !== undefined) updatedTaxZone.description = description;
    if (isDefault !== undefined) updatedTaxZone.isDefault = isDefault;
    if (countries !== undefined) {
      if (!Array.isArray(countries) || countries.length === 0) {
        throw new TaxValidationError('At least one country is required');
      }
      updatedTaxZone.countries = countries;
    }
    if (states !== undefined) updatedTaxZone.states = states;
    if (postcodes !== undefined) updatedTaxZone.postcodes = postcodes;
    if (cities !== undefined) updatedTaxZone.cities = cities;
    if (isActive !== undefined) updatedTaxZone.isActive = isActive;

    return this.port.updateTaxZone(id, updatedTaxZone);
  }
}
