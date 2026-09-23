/**
 * Shared test utilities for organization unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (event bus) before the use cases under test are evaluated.
 */

import { eventBus } from '../../../libs/events/eventBus';
import type { CreateOrganizationRepository } from '../application/useCases/CreateOrganization';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

export function createOrganizationRepository(): jest.Mocked<CreateOrganizationRepository> {
  const repository: jest.Mocked<CreateOrganizationRepository> = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  repository.findByEmail.mockResolvedValue(null);
  repository.create.mockImplementation(params =>
    Promise.resolve({
      organizationId: 'org-1',
      name: String(params.name),
      email: String(params.email),
      status: String(params.status),
      createdAt: new Date('2026-01-01'),
    }),
  );
  return repository;
}
