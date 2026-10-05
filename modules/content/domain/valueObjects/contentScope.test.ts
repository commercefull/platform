import { matchesContentScope } from './contentScope';

const ctx = { storeId: 'store-1', channelId: 'ch-1', locale: 'de-DE' };

describe('matchesContentScope', () => {
  it('should match when conditions are absent or not an object', () => {
    expect(matchesContentScope(undefined, ctx)).toBe(true);
    expect(matchesContentScope(null, ctx)).toBe(true);
    expect(matchesContentScope('scoped', ctx)).toBe(true);
    expect(matchesContentScope([], ctx)).toBe(true);
    expect(matchesContentScope({}, ctx)).toBe(true);
  });

  it('should match an empty scope array as "applies to all"', () => {
    expect(matchesContentScope({ storeIds: [] }, ctx)).toBe(true);
    expect(matchesContentScope({ storeIds: [], channelIds: [], locales: [] }, ctx)).toBe(true);
  });

  it('should match when the store is in storeIds', () => {
    expect(matchesContentScope({ storeIds: ['store-1', 'store-2'] }, ctx)).toBe(true);
  });

  it('should not match when the store is outside storeIds', () => {
    expect(matchesContentScope({ storeIds: ['store-9'] }, ctx)).toBe(false);
  });

  it('should hide store-scoped content when no store resolved', () => {
    expect(matchesContentScope({ storeIds: ['store-1'] }, { ...ctx, storeId: undefined })).toBe(false);
  });

  it('should match the channel in channelIds', () => {
    expect(matchesContentScope({ channelIds: ['ch-1'] }, ctx)).toBe(true);
    expect(matchesContentScope({ channelIds: ['ch-2'] }, ctx)).toBe(false);
  });

  it('should match locales exactly or by language prefix', () => {
    expect(matchesContentScope({ locales: ['de-DE'] }, ctx)).toBe(true);
    expect(matchesContentScope({ locales: ['de'] }, ctx)).toBe(true);
    expect(matchesContentScope({ locales: ['de-CH'] }, { ...ctx, locale: 'de' })).toBe(true);
    expect(matchesContentScope({ locales: ['fr-FR'] }, ctx)).toBe(false);
  });

  it('should require every set dimension to match', () => {
    expect(matchesContentScope({ storeIds: ['store-1'], channelIds: ['ch-9'] }, ctx)).toBe(false);
    expect(matchesContentScope({ storeIds: ['store-1'], channelIds: ['ch-1'], locales: ['de-DE'] }, ctx)).toBe(true);
  });
});
