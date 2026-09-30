import { randomBytes } from 'crypto';

// UUIDv7 (RFC 9562): 48-bit Unix-ms timestamp + random fields, version 7.
// Matches the uuidv7() column defaults used across the schema.
export function generateUUID(): string {
  const ms = BigInt(Date.now());
  const b = randomBytes(16);
  b[0] = Number(ms >> 40n) & 0xff;
  b[1] = Number(ms >> 32n) & 0xff;
  b[2] = Number(ms >> 24n) & 0xff;
  b[3] = Number(ms >> 16n) & 0xff;
  b[4] = Number(ms >> 8n) & 0xff;
  b[5] = Number(ms) & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function isUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
