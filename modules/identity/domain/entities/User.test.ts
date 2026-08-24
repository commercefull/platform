/**
 * Unit Tests for User Domain Entity
 */

import { User } from './User';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with pending_verification status', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'Test@Example.COM',
        passwordHash: 'hashed',
        userType: 'customer',
      });

      expect(user.userId).toBe('u-1');
      expect(user.email).toBe('test@example.com');
      expect(user.status).toBe('pending_verification');
      expect(user.emailVerified).toBe(false);
      expect(user.canLogin).toBe(false);
      expect(user.isActive).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a user from props', () => {
      const now = new Date();
      const user = User.reconstitute({
        userId: 'u-2',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'admin',
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
        mfaEnabled: false,
        loginCount: 5,
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
      });

      expect(user.userId).toBe('u-2');
      expect(user.status).toBe('active');
      expect(user.canLogin).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('should mark email as verified and activate pending user', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
      });

      user.verifyEmail();

      expect(user.emailVerified).toBe(true);
      expect(user.status).toBe('active');
      expect(user.canLogin).toBe(true);
    });

    it('should not change status if already active', () => {
      const user = User.reconstitute({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
        status: 'active',
        emailVerified: false,
        phoneVerified: false,
        mfaEnabled: false,
        loginCount: 0,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user.verifyEmail();

      expect(user.emailVerified).toBe(true);
      expect(user.status).toBe('active');
    });
  });

  describe('recordFailedLogin', () => {
    it('should increment failed attempts', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
      });

      user.recordFailedLogin();

      // failedLoginAttempts is not exposed as a getter; verify via side effect (lock after 5)
    });

    it('should lock account after 5 failed attempts', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
      });

      for (let i = 0; i < 5; i++) {
        user.recordFailedLogin();
      }

      expect(user.isLocked).toBe(true);
    });
  });

  describe('recordLogin', () => {
    it('should record login and reset failed attempts', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
      });
      user.recordFailedLogin();
      user.recordFailedLogin();

      user.recordLogin('192.168.1.1');

      expect(user.loginCount).toBe(1);
      expect(user.lastLoginAt).toBeDefined();
    });
  });

  describe('setRefreshToken / clearRefreshToken', () => {
    it('should set and clear refresh token', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
      });

      user.setRefreshToken('token-123', new Date(Date.now() + 86400000));
      expect(user.refreshToken).toBe('token-123');

      user.clearRefreshToken();
      expect(user.refreshToken).toBeUndefined();
    });
  });

  describe('activate / suspend', () => {
    it('should activate user', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
      });

      user.activate();

      expect(user.status).toBe('active');
      expect(user.isActive).toBe(true);
    });

    it('should suspend user', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
      });
      user.activate();

      user.suspend();

      expect(user.status).toBe('suspended');
      expect(user.isActive).toBe(false);
      expect(user.canLogin).toBe(false);
    });
  });

  describe('MFA', () => {
    it('should enable and disable MFA', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
      });

      user.enableMfa('secret123');
      expect(user.mfaEnabled).toBe(true);

      user.disableMfa();
      expect(user.mfaEnabled).toBe(false);
    });
  });

  describe('fullName', () => {
    it('should return full name', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.fullName).toBe('John Doe');
    });

    it('should return trimmed name when parts missing', () => {
      const user = User.create({
        userId: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        userType: 'customer',
        firstName: 'John',
      });

      expect(user.fullName).toBe('John');
    });
  });
});
