/**
 * Shared test helpers for the tax module.
 * Provides typed port mocks and domain/raw-record factories.
 */

import type { CustomerTaxExemption } from '../taxTypes';
import type { TaxQueryPort } from '../application/useCases/CalculateOrderTax';
import type { TaxExemptionUpdatePort } from '../application/useCases/ApproveTaxExemption';
import type { TaxExemptionCreatePort } from '../application/useCases/CreateTaxExemption';
import type { TaxAdminPort } from '../application/useCases/ManageAdminTax';
import type { CreateTaxRateUseCase } from '../application/useCases/CreateTaxRate';
import type { GetTaxRateForAddressUseCase } from '../application/useCases/GetTaxRateForAddress';

export function createTaxQueryPort(): jest.Mocked<TaxQueryPort> {
  return {
    getTaxRateForAddress: jest.fn().mockResolvedValue(10),
    getTaxRateForAddressAndCategory: jest.fn().mockResolvedValue(0),
    findCustomerTaxExemptions: jest.fn().mockResolvedValue([]),
  };
}

export function createExemptionUpdatePort(): jest.Mocked<TaxExemptionUpdatePort> {
  return {
    updateTaxExemption: jest.fn(),
  };
}

export function createExemptionCreatePort(): jest.Mocked<TaxExemptionCreatePort> {
  return {
    createTaxExemption: jest.fn(),
  };
}

export function createTaxAdminPort(): jest.Mocked<TaxAdminPort> {
  return {
    findAllTaxRates: jest.fn(),
    createTaxRate: jest.fn(),
    updateTaxRate: jest.fn(),
    softDeleteTaxRate: jest.fn(),
    findAllTaxZones: jest.fn(),
    createTaxZone: jest.fn(),
    updateTaxZone: jest.fn(),
    softDeleteTaxZone: jest.fn(),
    findAllTaxClasses: jest.fn(),
    createTaxClass: jest.fn(),
    updateTaxClass: jest.fn(),
    softDeleteTaxClass: jest.fn(),
  };
}

export function createTaxRateRepository(): jest.Mocked<ConstructorParameters<typeof CreateTaxRateUseCase>[0]> {
  return {
    createTaxRate: jest.fn(),
  };
}

export function createRatesForAddressRepository(): jest.Mocked<
  ConstructorParameters<typeof GetTaxRateForAddressUseCase>[0]
> {
  return {
    findRatesForAddress: jest.fn().mockResolvedValue([]),
  };
}

export function createCustomerTaxRepository(): jest.Mocked<ConstructorParameters<typeof GetTaxRateForAddressUseCase>[1]> {
  return {
    getTaxExemption: jest.fn().mockResolvedValue(null),
  };
}

/**
 * Raw `CustomerTaxExemption` record as returned by the tax query repository.
 */
export function createCustomerTaxExemption(overrides: Partial<CustomerTaxExemption> = {}): CustomerTaxExemption {
  return {
    id: 'ex-1',
    customerId: 'cust-1',
    type: 'resale',
    status: 'approved',
    name: 'Resale Certificate',
    exemptionNumber: 'EX-123',
    startDate: Date.now(),
    isVerified: true,
    exemptionPercent: 100,
    applicableTaxCategoryIds: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

/**
 * Real `TaxExemption` domain entity (constructed directly — the entity has no
 * `create`/`reconstitute` factory, the public constructor is the factory).
 */
