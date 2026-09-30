import { compareString, hashString } from './hash';

describe('hashString / compareString', () => {
  it('round-trips a password', async () => {
    const stored = await hashString('password123');
    expect(await compareString('password123', stored)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashString('password123');
    expect(await compareString('password124', stored)).toBe(false);
  });

  it('produces unique salted hashes for the same input', async () => {
    const [a, b] = await Promise.all([hashString('password123'), hashString('password123')]);
    expect(a).not.toBe(b);
    // Both still verify — the salt travels inside the stored hash.
    expect(await compareString('password123', a)).toBe(true);
    expect(await compareString('password123', b)).toBe(true);
  });

  it('embeds the algorithm and parameters in the stored hash', async () => {
    const stored = await hashString('password123');
    expect(stored).toMatch(/^\$scrypt\$N=\d+,r=\d+,p=\d+\$[^$]+\$[^$]+$/);
  });

  it('returns false for legacy bcrypt and unknown formats instead of throwing', async () => {
    expect(await compareString('password123', '$2b$10$wADyOBQwHwy0mz49WoGA.OcCrjAAXaYnMhsOrWWQ9FzUmXkrq6.aC')).toBe(false);
    expect(await compareString('password123', 'not-a-hash')).toBe(false);
    expect(await compareString('password123', '')).toBe(false);
  });

  it('verifies hashes produced with different stored parameters', async () => {
    // Simulate a param upgrade: derive with lower cost manually, still verifies.
    const { scrypt } = await import('node:crypto');
    const derived = await new Promise<Buffer>((resolve, reject) => {
      scrypt('pw', Buffer.from('somesalt'), 64, { N: 4096, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key)));
    });
    const stored = `$scrypt$N=4096,r=8,p=1$${Buffer.from('somesalt').toString('base64')}$${derived.toString('base64')}`;
    expect(await compareString('pw', stored)).toBe(true);
    expect(await compareString('other', stored)).toBe(false);
  });
});
