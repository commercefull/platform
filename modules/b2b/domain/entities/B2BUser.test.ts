import { B2BUser } from './B2BUser';

describe('B2BUser Entity', () => {
  describe('create', () => {
    it('should create a user with default values', () => {
      const user = B2BUser.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        email: 'john@acme.com',
      });
      expect(user.userId).toBeDefined();
      expect(user.email).toBe('john@acme.com');
      expect(user.role).toBe('buyer');
      expect(user.status).toBe('invited');
      expect(user.spendingLimits).toEqual({});
    });

    it('should create a user with custom values', () => {
      const user = B2BUser.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        email: 'jane@acme.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'approver',
        spendingLimits: { perOrderLimit: 5000, monthlyLimit: 20000 },
        department: 'Procurement',
        costCenter: 'CC-100',
      });
      expect(user.role).toBe('approver');
      expect(user.spendingLimits.perOrderLimit).toBe(5000);
      expect(user.department).toBe('Procurement');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const props = {
        userId: 'user-1',
        companyId: 'comp-1',
        organizationId: 'org-1',
        email: 'test@acme.com',
        role: 'admin' as const,
        status: 'active' as const,
        spendingLimits: {},
        invitedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      const user = B2BUser.reconstitute(props);
      expect(user.userId).toBe('user-1');
      expect(user.role).toBe('admin');
      expect(user.isActive).toBe(true);
    });
  });

  describe('lifecycle', () => {
    it('should activate an invited user', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      user.activate();
      expect(user.status).toBe('active');
      expect(user.activatedAt).toBeDefined();
    });

    it('should not activate a non-invited user', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      user.activate();
      expect(() => user.activate()).toThrow('in status: active');
    });

    it('should suspend and reactivate', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      user.activate();
      user.suspend();
      expect(user.status).toBe('suspended');
      user.reactivate();
      expect(user.status).toBe('active');
    });

    it('should not suspend a removed user', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      user.activate();
      user.remove();
      expect(() => user.suspend()).toThrow('in status: removed');
    });
  });

  describe('spending limits', () => {
    it('should check per-order limit', () => {
      const user = B2BUser.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        email: 'a@b.com',
        spendingLimits: { perOrderLimit: 1000 },
      });
      expect(user.canPlaceOrder(500, 0, 'perOrderLimit')).toBe(true);
      expect(user.canPlaceOrder(1500, 0, 'perOrderLimit')).toBe(false);
    });

    it('should check monthly limit', () => {
      const user = B2BUser.create({
        companyId: 'comp-1',
        organizationId: 'org-1',
        email: 'a@b.com',
        spendingLimits: { monthlyLimit: 5000 },
      });
      expect(user.canPlaceOrder(1000, 3000, 'monthlyLimit')).toBe(true);
      expect(user.canPlaceOrder(3000, 3000, 'monthlyLimit')).toBe(false);
    });

    it('should allow unlimited when no limit set', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      expect(user.canPlaceOrder(999999, 0, 'perOrderLimit')).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      user.updateProfile({ firstName: 'John', department: 'IT' });
      expect(user.firstName).toBe('John');
      expect(user.department).toBe('IT');
    });
  });

  describe('setRole', () => {
    it('should update role', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      user.setRole('admin');
      expect(user.role).toBe('admin');
    });
  });

  describe('recordLogin', () => {
    it('should record login timestamp', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      expect(user.lastLoginAt).toBeUndefined();
      user.recordLogin();
      expect(user.lastLoginAt).toBeDefined();
    });
  });

  describe('fullName', () => {
    it('should return full name', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com', firstName: 'John', lastName: 'Doe' });
      expect(user.fullName).toBe('John Doe');
    });

    it('should fallback to email when no name', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      expect(user.fullName).toBe('a@b.com');
    });
  });

  describe('toJSON', () => {
    it('should return all props', () => {
      const user = B2BUser.create({ companyId: 'comp-1', organizationId: 'org-1', email: 'a@b.com' });
      const json = user.toJSON();
      expect(json.email).toBe('a@b.com');
      expect(json.userId).toBeDefined();
    });
  });
});
