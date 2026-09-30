import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

const scryptAsync = (password: string, salt: Buffer, keyLength: number, params: ScryptParams): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, params, (err, key) => (err ? reject(err) : resolve(key)));
  });

/**
 * Stored format is self-describing so parameters can be upgraded later:
 *   $scrypt$N=<cost>,r=<blockSize>,p=<parallelization>$<salt-base64>$<key-base64>
 * Old rows keep working after a param bump — verify reads the stored params.
 */
const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 64 } as const;
const SALT_LENGTH = 16;
const FORMAT = 'scrypt';

interface ScryptParts extends ScryptParams {
  salt: Buffer;
  key: Buffer;
}

function parseHash(stored: string): ScryptParts | undefined {
  // $scrypt$N=16384,r=8,p=1$<salt>$<key>
  const match = stored.match(/^\$scrypt\$N=(\d+),r=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/);
  if (!match) {
    return undefined;
  }
  const [, N, r, p, salt, key] = match;
  return {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    salt: Buffer.from(salt, 'base64'),
    key: Buffer.from(key, 'base64'),
  };
}

function formatHash(parts: ScryptParts): string {
  return `$${FORMAT}$N=${parts.N},r=${parts.r},p=${parts.p}$${parts.salt.toString('base64')}$${parts.key.toString('base64')}`;
}

/** Hash a password/token with scrypt and a fresh random salt. */
export const hashString = async (value: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(value, salt, SCRYPT.keyLength, SCRYPT);
  return formatHash({ ...SCRYPT, salt, key });
};

/**
 * Constant-time comparison against a stored hash. Returns false for any
 * format this module did not produce (e.g. legacy bcrypt hashes) — those
 * rows require a password reset rather than verification.
 */
export const compareString = async (value: string, storedHash: string): Promise<boolean> => {
  const parts = parseHash(storedHash);
  if (!parts) {
    return false;
  }
  const derived = await scryptAsync(value, parts.salt, parts.key.length, parts);
  return timingSafeEqual(derived, parts.key);
};
