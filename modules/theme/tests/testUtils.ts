/**
 * Shared test utilities for theme use-case tests.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { generateUUID } from '../../../libs/uuid';
import { Theme } from '../domain/entities/Theme';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({ generateUUID: jest.fn() }));

export const emitMock = jest.mocked(eventBus.emit);
export const uuidMock = jest.mocked(generateUUID);

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

export function createTheme(overrides: Partial<Parameters<typeof Theme.create>[0]> = {}): Theme {
  return Theme.create({
    themeId: 'theme-1',
    slug: 'default-theme',
    name: 'Default Theme',
    settingsSchema: { groups: [] },
    defaultSettings: {},
    layout: { regions: ['header', 'main', 'footer'], pageLayouts: [] },
    components: { components: [] },
    ...overrides,
  });
}

