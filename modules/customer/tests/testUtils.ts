/**
 * Shared test helpers for the customer module.
 * Boundary mocks (event bus, uuid, hash, db transaction) + typed port mocks
 * + `libs/db/types` row factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { generateUUID } from '../../../libs/uuid';
import { compareString, hashString } from '../../../libs/hash';
import { withTransaction, type TxClient } from '../../../libs/db';
import type { Customer, CustomerAddress } from '../../../libs/db/types';
import type { CustomerRepository } from '../domain/repositories/CustomerRepository';
import type { CustomerAddressRepository } from '../domain/repositories/CustomerAddressRepository';
import type { StorefrontWishlistRepository, WishlistItem } from '../domain/repositories/StorefrontWishlistRepository';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn(),
}));

jest.mock('../../../libs/hash', () => ({
  __esModule: true,
  compareString: jest.fn(),
  hashString: jest.fn(),
}));

jest.mock('../../../libs/db', () => {
  const actual = jest.requireActual('../../../libs/db');
  return {
    __esModule: true,
    ...actual,
    withTransaction: jest.fn(),
  };
});

export const emitMock = jest.mocked(eventBus.emit);
export const uuidMock = jest.mocked(generateUUID);
export const compareStringMock = jest.mocked(compareString);
export const hashStringMock = jest.mocked(hashString);
export const withTransactionMock = jest.mocked(withTransaction);

beforeEach(() => {
  emitMock.mockClear();
  uuidMock.mockReturnValue('test-uuid');
  hashStringMock.mockResolvedValue('hashed-password');
  compareStringMock.mockResolvedValue(true);
  withTransactionMock.mockImplementation(async fn => fn({} as unknown as TxClient));
});

/**
 * A lazily-created `jest.Mocked<T>`: every accessed method is a `jest.fn`,
 * so tests configure only the methods they exercise.
 */
function lazyMock<T>(): jest.Mocked<T> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
}

export function createCustomerRepository(): jest.Mocked<CustomerRepository> {
  return lazyMock();
}

export function createCustomerAddressRepository(): jest.Mocked<CustomerAddressRepository> {
  return lazyMock();
}

export function createStorefrontWishlistRepository(): jest.Mocked<StorefrontWishlistRepository> {
  return lazyMock();
}

// ---------------------------------------------------------------------------
// Row factories (`libs/db/types` shapes — the repository record contract)
// ---------------------------------------------------------------------------

export function createCustomerRow(overrides: Partial<Customer> = {}): Customer {
  return {
    customerId: 'cust-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    password: '',
    phone: null,
    dateOfBirth: null,
    gender: null,
    avatarUrl: null,
    isActive: true,
    isVerified: true,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    preferredLocaleId: null,
    preferredCurrencyId: null,
    timezone: null,
    referralSource: null,
    referralCode: null,
    referredBy: null,
    acceptsMarketing: false,
    marketingPreferences: null,
    tags: null,
    note: null,
    externalId: null,
    externalSource: null,
    taxExempt: false,
    taxExemptionCertificate: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    verificationToken: null,
    agreeToTerms: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

export function createCustomerAddressRow(overrides: Partial<CustomerAddress> = {}): CustomerAddress {
  return {
    customerAddressId: 'addr-1',
    customerId: 'cust-1',
    firstName: 'Jane',
    lastName: 'Doe',
    company: null,
    addressLine1: '123 Main St',
    addressLine2: null,
    city: 'Springfield',
    state: 'IL',
    postalCode: '12345',
    country: 'US',
    phone: null,
    email: null,
    isDefault: false,
    isDefaultBilling: false,
    isDefaultShipping: false,
    addressType: 'shipping',
    isVerified: false,
    verifiedAt: null,
    verificationData: null,
    additionalInfo: null,
    latitude: null,
    longitude: null,
    name: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createWishlistItem(overrides: Partial<WishlistItem> = {}): WishlistItem {
  return {
    wishlistItemId: 'wish-1',
    customerId: 'cust-1',
    productId: 'prod-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}
