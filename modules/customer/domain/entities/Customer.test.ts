/**
 * Unit Tests for Customer Entity
 */

import { Customer } from './Customer';
import { CustomerAddressNotFoundError } from '../errors/CustomerErrors';

describe('Customer', () => {
  function createCustomer(): Customer {
    return Customer.create({
      customerId: 'cust-1',
      email: '  John@Example.COM  ',
      firstName: '  John  ',
      lastName: '  Doe  ',
      phone: '  555-1234  ',
    });
  }

  describe('create', () => {
    it('should normalize email to lowercase and trim', () => {
      const customer = createCustomer();
      expect(customer.email).toBe('john@example.com');
    });

    it('should trim firstName and lastName', () => {
      const customer = createCustomer();
      expect(customer.firstName).toBe('John');
      expect(customer.lastName).toBe('Doe');
    });

    it('should trim phone', () => {
      const customer = createCustomer();
      expect(customer.phone).toBe('555-1234');
    });

    it('should default to active status, unverified, USD, en', () => {
      const customer = createCustomer();
      expect(customer.status).toBe('active');
      expect(customer.isVerified).toBe(false);
      expect(customer.preferredCurrency).toBe('USD');
      expect(customer.preferredLanguage).toBe('en');
    });

    it('should start with empty addresses and groups', () => {
      const customer = createCustomer();
      expect(customer.addresses).toHaveLength(0);
      expect(customer.groupIds).toHaveLength(0);
      expect(customer.tags).toHaveLength(0);
      expect(customer.loginCount).toBe(0);
    });
  });

  describe('computed properties', () => {
    it('fullName should combine first and last name', () => {
      const customer = createCustomer();
      expect(customer.fullName).toBe('John Doe');
    });

    it('isActive should be true for active status', () => {
      const customer = createCustomer();
      expect(customer.isActive).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('should update firstName and lastName with trim', () => {
      const customer = createCustomer();
      customer.updateProfile({ firstName: '  Jane  ', lastName: '  Smith  ' });
      expect(customer.firstName).toBe('Jane');
      expect(customer.lastName).toBe('Smith');
    });

    it('should update phone with trim', () => {
      const customer = createCustomer();
      customer.updateProfile({ phone: '  555-9999  ' });
      expect(customer.phone).toBe('555-9999');
    });

    it('should allow clearing phone by passing null', () => {
      const customer = createCustomer();
      customer.updateProfile({ phone: null as never as string | undefined });
      expect(customer.phone).toBeUndefined();
    });
  });

  describe('changeEmail', () => {
    it('should set email and reset verification', () => {
      const customer = createCustomer();
      customer.verifyEmail();
      customer.changeEmail('  new@example.com  ');
      expect(customer.email).toBe('new@example.com');
      expect(customer.isVerified).toBe(false);
      expect(customer.emailVerifiedAt).toBeUndefined();
    });
  });

  describe('verifyEmail', () => {
    it('should set isVerified and emailVerifiedAt', () => {
      const customer = createCustomer();
      customer.verifyEmail();
      expect(customer.isVerified).toBe(true);
      expect(customer.emailVerifiedAt).toBeDefined();
    });
  });

  describe('status transitions', () => {
    it('deactivate should set status to inactive', () => {
      const customer = createCustomer();
      customer.deactivate();
      expect(customer.status).toBe('inactive');
      expect(customer.isActive).toBe(false);
    });

    it('suspend should set status to suspended', () => {
      const customer = createCustomer();
      customer.suspend();
      expect(customer.status).toBe('suspended');
    });

    it('activate should set status to active', () => {
      const customer = createCustomer();
      customer.deactivate();
      customer.activate();
      expect(customer.status).toBe('active');
    });
  });

  describe('recordLogin', () => {
    it('should increment loginCount and set lastLoginAt', () => {
      const customer = createCustomer();
      customer.recordLogin();
      expect(customer.loginCount).toBe(1);
      expect(customer.lastLoginAt).toBeDefined();
    });
  });

  describe('addAddress', () => {
    it('should add a new address', () => {
      const customer = createCustomer();
      customer.addAddress({
        addressId: 'addr-1',
        addressLine1: '123 Main St',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        countryCode: 'US',
        addressType: 'shipping',
        isDefault: false,
      });
      expect(customer.addresses).toHaveLength(1);
    });

    it('should update existing address with same ID', () => {
      const customer = createCustomer();
      customer.addAddress({
        addressId: 'addr-1',
        addressLine1: '123 Main St',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        countryCode: 'US',
        addressType: 'shipping',
        isDefault: false,
      });
      customer.addAddress({
        addressId: 'addr-1',
        addressLine1: '456 Oak Ave',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
        countryCode: 'US',
        addressType: 'shipping',
        isDefault: false,
      });
      expect(customer.addresses).toHaveLength(1);
      expect(customer.addresses[0].addressLine1).toBe('456 Oak Ave');
    });

    it('should set default address when isDefault is true', () => {
      const customer = createCustomer();
      customer.addAddress({
        addressId: 'addr-1',
        addressLine1: '123 Main St',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        countryCode: 'US',
        addressType: 'shipping',
        isDefault: true,
      });
      expect(customer.defaultShippingAddressId).toBe('addr-1');
    });
  });

  describe('removeAddress', () => {
    it('should remove address by ID', () => {
      const customer = createCustomer();
      customer.addAddress({
        addressId: 'addr-1',
        addressLine1: '123 Main St',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        countryCode: 'US',
        addressType: 'shipping',
        isDefault: true,
      });
      customer.removeAddress('addr-1');
      expect(customer.addresses).toHaveLength(0);
      expect(customer.defaultShippingAddressId).toBeUndefined();
    });
  });

  describe('setDefaultAddress', () => {
    it('should set default shipping address', () => {
      const customer = createCustomer();
      customer.addAddress({
        addressId: 'addr-1',
        addressLine1: '123 Main St',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        countryCode: 'US',
        addressType: 'shipping',
        isDefault: false,
      });
      customer.setDefaultAddress('addr-1', 'shipping');
      expect(customer.defaultShippingAddressId).toBe('addr-1');
    });

    it('should throw when address not found', () => {
      const customer = createCustomer();
      expect(() => customer.setDefaultAddress('addr-x', 'shipping')).toThrow(CustomerAddressNotFoundError);
    });
  });

  describe('groups', () => {
    it('joinGroup should add group ID', () => {
      const customer = createCustomer();
      customer.joinGroup('grp-1');
      expect(customer.groupIds).toContain('grp-1');
    });

    it('joinGroup should not duplicate', () => {
      const customer = createCustomer();
      customer.joinGroup('grp-1');
      customer.joinGroup('grp-1');
      expect(customer.groupIds).toHaveLength(1);
    });

    it('leaveGroup should remove group ID', () => {
      const customer = createCustomer();
      customer.joinGroup('grp-1');
      customer.leaveGroup('grp-1');
      expect(customer.groupIds).not.toContain('grp-1');
    });
  });

  describe('tags', () => {
    it('addTag should add tag', () => {
      const customer = createCustomer();
      customer.addTag('vip');
      expect(customer.tags).toContain('vip');
    });

    it('addTag should not duplicate', () => {
      const customer = createCustomer();
      customer.addTag('vip');
      customer.addTag('vip');
      expect(customer.tags).toHaveLength(1);
    });

    it('removeTag should remove tag', () => {
      const customer = createCustomer();
      customer.addTag('vip');
      customer.removeTag('vip');
      expect(customer.tags).not.toContain('vip');
    });
  });

  describe('setTaxExempt', () => {
    it('should set taxExempt true with exemption number', () => {
      const customer = createCustomer();
      customer.setTaxExempt(true, 'EX-123');
      expect(customer.taxExempt).toBe(true);
      expect(customer.taxExemptionNumber).toBe('EX-123');
    });

    it('should clear exemption number when set to false', () => {
      const customer = createCustomer();
      customer.setTaxExempt(true, 'EX-123');
      customer.setTaxExempt(false);
      expect(customer.taxExempt).toBe(false);
      expect(customer.taxExemptionNumber).toBeUndefined();
    });
  });

  describe('toJSON', () => {
    it('should return serialized object', () => {
      const customer = createCustomer();
      const json = customer.toJSON();

      expect(json.customerId).toBe('cust-1');
      expect(json.email).toBe('john@example.com');
      expect(json.fullName).toBe('John Doe');
      expect(json.status).toBe('active');
      expect(json.isActive).toBe(true);
    });
  });
});
