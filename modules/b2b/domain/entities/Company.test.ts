import { Company } from './Company';

describe('Company Entity', () => {
  describe('create', () => {
    it('should create a company with default values', () => {
      const company = Company.create({
        organizationId: 'org-1',
        name: 'Acme Corp',
      });
      expect(company.companyId).toBeDefined();
      expect(company.name).toBe('Acme Corp');
      expect(company.status).toBe('pending');
      expect(company.paymentTerms).toBe('net30');
      expect(company.outstandingBalance).toBe(0);
      expect(company.isSubsidiary).toBe(false);
    });

    it('should create a company with custom values', () => {
      const company = Company.create({
        organizationId: 'org-1',
        name: 'Acme Corp',
        legalName: 'Acme Corporation Inc.',
        taxId: '12-3456789',
        paymentTerms: 'net60',
        creditLimit: 50000,
        contactEmail: 'billing@acme.com',
        parentId: 'parent-1',
      });
      expect(company.legalName).toBe('Acme Corporation Inc.');
      expect(company.taxId).toBe('12-3456789');
      expect(company.paymentTerms).toBe('net60');
      expect(company.creditLimit).toBe(50000);
      expect(company.isSubsidiary).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const props = {
        companyId: 'comp-1',
        organizationId: 'org-1',
        name: 'Acme',
        status: 'approved' as const,
        paymentTerms: 'net15' as const,
        outstandingBalance: 1000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      const company = Company.reconstitute(props);
      expect(company.companyId).toBe('comp-1');
      expect(company.status).toBe('approved');
      expect(company.paymentTerms).toBe('net15');
    });
  });

  describe('lifecycle', () => {
    it('should approve a pending company', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.approve();
      expect(company.status).toBe('approved');
    });

    it('should not approve a non-pending company', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.approve();
      expect(() => company.approve()).toThrow('Cannot approve company in status: approved');
    });

    it('should suspend and reactivate', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.approve();
      company.suspend();
      expect(company.status).toBe('suspended');
      company.reactivate();
      expect(company.status).toBe('approved');
    });

    it('should not suspend a terminated company', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.terminate();
      expect(() => company.suspend()).toThrow('Cannot suspend a terminated company');
    });

    it('should not reactivate a non-suspended company', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      expect(() => company.reactivate()).toThrow('Cannot reactivate company in status: pending');
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.updateProfile({ name: 'Acme Updated', contactEmail: 'new@acme.com' });
      expect(company.name).toBe('Acme Updated');
      expect(company.contactEmail).toBe('new@acme.com');
    });
  });

  describe('credit management', () => {
    it('should set credit limit', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.setCreditLimit(10000);
      expect(company.creditLimit).toBe(10000);
    });

    it('should not set negative credit limit', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      expect(() => company.setCreditLimit(-1)).toThrow('Credit limit cannot be negative');
    });

    it('should check available credit', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme', creditLimit: 1000 });
      expect(company.hasAvailableCredit(500)).toBe(true);
      company.increaseBalance(600);
      expect(company.hasAvailableCredit(500)).toBe(false);
      expect(company.hasAvailableCredit(400)).toBe(true);
    });

    it('should allow unlimited credit when no limit set', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      expect(company.hasAvailableCredit(999999)).toBe(true);
    });

    it('should increase and decrease balance', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.increaseBalance(500);
      expect(company.outstandingBalance).toBe(500);
      company.decreaseBalance(200);
      expect(company.outstandingBalance).toBe(300);
    });

    it('should not decrease below zero', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.increaseBalance(100);
      company.decreaseBalance(200);
      expect(company.outstandingBalance).toBe(0);
    });
  });

  describe('setPaymentTerms', () => {
    it('should update payment terms', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      company.setPaymentTerms('net60');
      expect(company.paymentTerms).toBe('net60');
    });
  });

  describe('toJSON', () => {
    it('should return all props as plain object', () => {
      const company = Company.create({ organizationId: 'org-1', name: 'Acme' });
      const json = company.toJSON();
      expect(json.name).toBe('Acme');
      expect(json.status).toBe('pending');
      expect(json.companyId).toBeDefined();
    });
  });
});
