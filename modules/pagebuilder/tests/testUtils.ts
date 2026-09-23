/**
 * Shared test utilities for pagebuilder use-case tests.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { PageDraft } from '../domain/entities/PageDraft';
import { blockSchemaRegistry } from '../domain/services/BlockSchemaRegistry';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({ generateUUID: jest.fn() }));


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

let registered = false;
export function registerBuiltInBlocks(): void {
  if (!registered) {
    blockSchemaRegistry.registerBuiltIns();
    registered = true;
  }
}

export function createPageDraft(overrides: Partial<Parameters<typeof PageDraft.create>[0]> = {}): PageDraft {
  return PageDraft.create({
    draftId: 'draft-1',
    organizationId: 'org-1',
    title: 'Home',
    slug: 'home',
    pageType: 'page',
    ...overrides,
  });
}
