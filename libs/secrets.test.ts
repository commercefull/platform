jest.mock('./logger', () => ({
  logger: { info: jest.fn(), warning: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { validateSecret, validateAllSecrets, getSecret, validateCorsOrigins } from './secrets';

describe('secrets', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('validateSecret (non-production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('returns valid secret value', () => {
      const value = 'a-very-secure-secret-that-is-long-enough';
      expect(validateSecret('TEST_SECRET', value)).toBe(value);
    });

    it('generates ephemeral dev secret when missing', () => {
      const result = validateSecret('MISSING_SECRET', undefined);
      expect(result).toContain('dev-missing_secret-');
      expect(result.length).toBeGreaterThan(10);
    });

    it('generates ephemeral dev secret when empty', () => {
      const result = validateSecret('EMPTY_SECRET', '');
      expect(result).toContain('dev-empty_secret-');
    });

    it('still returns insecure placeholder value in non-production (with warning)', () => {
      const result = validateSecret('TEST_SECRET', 'your-secret-key-should-be-in-env');
      expect(result).toBe('your-secret-key-should-be-in-env');
    });

    it('still returns short secret in non-production (with warning)', () => {
      const result = validateSecret('TEST_SECRET', 'short');
      expect(result).toBe('short');
    });
  });

  describe('validateSecret (production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('throws when secret is missing', () => {
      expect(() => validateSecret('MY_SECRET', undefined)).toThrow('Missing required secret: MY_SECRET');
    });

    it('throws when secret is empty', () => {
      expect(() => validateSecret('MY_SECRET', '')).toThrow('Missing required secret: MY_SECRET');
    });

    it('throws when secret is an insecure placeholder', () => {
      expect(() => validateSecret('MY_SECRET', 'your-secret-key-should-be-in-env')).toThrow('Insecure placeholder');
    });

    it('throws when secret is too short', () => {
      expect(() => validateSecret('MY_SECRET', 'short-secret')).toThrow('at least 32 characters');
    });

    it('accepts a valid long secret', () => {
      const value = 'a-very-secure-production-secret-with-32+chars';
      expect(validateSecret('MY_SECRET', value)).toBe(value);
    });
  });

  describe('validateAllSecrets', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('returns all required secrets in non-production', () => {
      const secrets = validateAllSecrets();
      expect(secrets.CUSTOMER_JWT_SECRET).toBeDefined();
      expect(secrets.ORGANIZATION_JWT_SECRET).toBeDefined();
      expect(secrets.ADMIN_JWT_SECRET).toBeDefined();
      expect(secrets.B2B_JWT_SECRET).toBeDefined();
      expect(secrets.SESSION_SECRET).toBeDefined();
    });

    it('throws in production when secrets are missing', () => {
      process.env.NODE_ENV = 'production';
      expect(() => validateAllSecrets()).toThrow('Missing required secret');
    });

    it('succeeds in production when all secrets are set', () => {
      process.env.NODE_ENV = 'production';
      process.env.CUSTOMER_JWT_SECRET = 'a-very-secure-customer-secret-32+chars';
      process.env.ORGANIZATION_JWT_SECRET = 'a-very-secure-org-secret-32+chars!!';
      process.env.ADMIN_JWT_SECRET = 'a-very-secure-admin-secret-32+chars!!';
      process.env.B2B_JWT_SECRET = 'a-very-secure-b2b-secret-32+chars!!!!';
      process.env.SESSION_SECRET = 'a-very-secure-session-secret-32+chars';

      const secrets = validateAllSecrets();
      expect(secrets.CUSTOMER_JWT_SECRET).toBe('a-very-secure-customer-secret-32+chars');
    });
  });

  describe('getSecret', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('returns validated secret value', () => {
      process.env.MY_TEST_SECRET = 'a-valid-secret-that-is-long-enough!!';
      expect(getSecret('MY_TEST_SECRET')).toBe('a-valid-secret-that-is-long-enough!!');
    });

    it('generates ephemeral secret when not set', () => {
      delete process.env.NONEXISTENT_SECRET;
      const result = getSecret('NONEXISTENT_SECRET');
      expect(result).toContain('dev-nonexistent_secret-');
    });
  });

  describe('validateCorsOrigins', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('returns localhost origins in non-production', () => {
      const origins = validateCorsOrigins();
      expect(origins).toContain('http://localhost:3000');
    });

    it('throws in production when ALLOWED_ORIGINS is not set', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOWED_ORIGINS;
      expect(() => validateCorsOrigins()).toThrow('ALLOWED_ORIGINS must be set');
    });

    it('throws in production when ALLOWED_ORIGINS is empty', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = '';
      expect(() => validateCorsOrigins()).toThrow('ALLOWED_ORIGINS must be set');
    });

    it('throws in production when ALLOWED_ORIGINS contains placeholder', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://yourdomain.com';
      expect(() => validateCorsOrigins()).toThrow('placeholder origin');
    });

    it('accepts real origins in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://shop.example.org,https://admin.example.org';
      const origins = validateCorsOrigins();
      expect(origins).toEqual(['https://shop.example.org', 'https://admin.example.org']);
    });
  });
});
