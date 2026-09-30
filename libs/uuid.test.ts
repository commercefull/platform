import { generateUUID, isUuid } from './uuid';

describe('libs/uuid', () => {
  describe('generateUUID', () => {
    it('generates a valid UUID', () => {
      expect(isUuid(generateUUID())).toBe(true);
    });

    it('generates UUIDv7 (version nibble is 7)', () => {
      const id = generateUUID();
      expect(id[14]).toBe('7');
    });

    it('sets the RFC 4122 variant bits (10xx)', () => {
      const id = generateUUID();
      expect(id[19].match(/[89ab]/)).not.toBeNull();
    });

    it('embeds the current Unix-ms timestamp in the first 48 bits', () => {
      const before = Date.now();
      const id = generateUUID();
      const after = Date.now();
      const ts = parseInt(id.replace(/-/g, '').slice(0, 12), 16);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it('is time-ordered — later UUIDs sort higher', async () => {
      const first = generateUUID();
      await new Promise(r => setTimeout(r, 2));
      const second = generateUUID();
      expect(second > first).toBe(true);
    });

    it('generates unique values', () => {
      const ids = new Set(Array.from({ length: 1000 }, generateUUID));
      expect(ids.size).toBe(1000);
    });
  });

  describe('isUuid', () => {
    it('accepts v4 and v7 uuids', () => {
      expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUuid(generateUUID())).toBe(true);
    });

    it('rejects non-uuid values', () => {
      expect(isUuid('')).toBe(false);
      expect(isUuid('not-a-uuid')).toBe(false);
      expect(isUuid('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isUuid('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
      expect(isUuid(null)).toBe(false);
      expect(isUuid(undefined)).toBe(false);
      expect(isUuid(123)).toBe(false);
    });
  });
});
