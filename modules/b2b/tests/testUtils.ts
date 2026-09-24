/**
 * Shared test utilities for b2b use-case tests.
 * Mocks module boundaries (eventBus, logger) and provides typed lazy port
 * mocks plus entity factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { Company } from '../domain/entities/Company';
import { B2BUser } from '../domain/entities/B2BUser';
import { Quote } from '../domain/entities/Quote';
import { ApprovalWorkflow } from '../domain/entities/ApprovalWorkflow';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

export function createCompany(overrides: Partial<Parameters<typeof Company.create>[0]> = {}): Company {
  return Company.create({ organizationId: 'org-1', name: 'Acme Corp', ...overrides });
}

export function createB2BUser(overrides: Partial<Parameters<typeof B2BUser.create>[0]> = {}): B2BUser {
  return B2BUser.create({
    companyId: 'co-1',
    organizationId: 'org-1',
    email: 'user@acme.test',
    ...overrides,
  });
}

export function createQuote(overrides: Partial<Parameters<typeof Quote.create>[0]> = {}): Quote {
  return Quote.create({
    companyId: 'co-1',
    organizationId: 'org-1',
    requestedBy: 'user-1',
    ...overrides,
  });
}

export function createApprovalWorkflow(
  overrides: Partial<Parameters<typeof ApprovalWorkflow.create>[0]> = {},
): ApprovalWorkflow {
  return ApprovalWorkflow.create({
    companyId: 'co-1',
    organizationId: 'org-1',
    type: 'purchase_order',
    referenceId: 'ref-1',
    referenceNumber: 'ORD-1',
    requestedBy: 'user-1',
    requestedByEmail: 'user@acme.test',
    amountCents: 1000,
    approvers: [{ approverId: 'mgr-1', approverEmail: 'mgr@acme.test' }],
    ...overrides,
  });
}
