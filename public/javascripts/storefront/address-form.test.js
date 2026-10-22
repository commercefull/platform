/**
 * Address form tests — country metadata drives required/label resolution.
 * Mirrors the shape produced by libs/address/countryAddressMetadata into
 * `window.__ADDRESS_METADATA`.
 */

import { resolveCountryRules } from './address-form.js';

const META = {
  US: { adminRequired: true, postalRequired: true, adminLabel: 'state', postalLabel: 'zipCode' },
  GB: { adminRequired: false, postalRequired: true, adminLabel: 'county', postalLabel: 'postcode' },
  AE: { adminRequired: true, postalRequired: false, adminLabel: 'emirate', postalLabel: 'postalCode' },
  JP: { adminRequired: true, postalRequired: true, adminLabel: 'prefecture', postalLabel: 'postalCode' },
  ZZ: { adminRequired: false, postalRequired: true, adminLabel: 'region', postalLabel: 'postalCode' },
};

describe('address-form resolveCountryRules', () => {
  it('requires state + ZIP label for US', () => {
    const rules = resolveCountryRules(META, 'US');
    expect(rules.adminRequired).toBe(true);
    expect(rules.adminLabel).toBe('State');
    expect(rules.postalRequired).toBe(true);
    expect(rules.postalLabel).toBe('ZIP Code');
  });

  it('makes region optional for GB with postcode label', () => {
    const rules = resolveCountryRules(META, 'GB');
    expect(rules.adminRequired).toBe(false);
    expect(rules.adminLabel).toBe('County');
    expect(rules.postalLabel).toBe('Postcode');
  });

  it('requires emirate but not postal code for AE', () => {
    const rules = resolveCountryRules(META, 'AE');
    expect(rules.adminRequired).toBe(true);
    expect(rules.adminLabel).toBe('Emirate');
    expect(rules.postalRequired).toBe(false);
  });

  it('requires prefecture + postal code for JP', () => {
    const rules = resolveCountryRules(META, 'JP');
    expect(rules.adminRequired).toBe(true);
    expect(rules.adminLabel).toBe('Prefecture');
    expect(rules.postalRequired).toBe(true);
  });

  it('falls back to ZZ defaults for unknown countries', () => {
    const rules = resolveCountryRules(META, 'XX');
    expect(rules.adminRequired).toBe(false);
    expect(rules.adminLabel).toBe('Region');
  });

  it('returns null when metadata is empty', () => {
    expect(resolveCountryRules({}, 'US')).toBeNull();
    expect(resolveCountryRules(undefined, 'US')).toBeNull();
  });
});
