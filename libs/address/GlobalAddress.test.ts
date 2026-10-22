import { GlobalAddress } from './GlobalAddress';
import { DEFAULT_ADDRESS_METADATA, getCountryAddressMetadata } from './countryAddressMetadata';

describe('libs/address/GlobalAddress', () => {
  describe('construction & legacy aliases', () => {
    it('should map legacy field aliases onto canonical fields when built from mixed input', () => {
      const a = GlobalAddress.from({
        country: 'us',
        addressLine1: '1600 Amphitheatre Pkwy',
        city: 'Mountain View',
        state: 'CA',
        zipCode: '94043',
      });
      expect(a.countryCode).toBe('US');
      expect(a.addressLines).toEqual(['1600 Amphitheatre Pkwy']);
      expect(a.locality).toBe('Mountain View');
      expect(a.administrativeArea).toBe('CA');
      expect(a.postalCode).toBe('94043');
    });

    it('should expose legacy getter aliases when canonical fields are set', () => {
      const a = GlobalAddress.create({
        countryCode: 'US',
        addressLines: ['1 Infinite Loop', 'Suite 1'],
        locality: 'Cupertino',
        administrativeArea: 'CA',
        postalCode: '95014',
      });
      expect(a.address1).toBe('1 Infinite Loop');
      expect(a.street1).toBe('1 Infinite Loop');
      expect(a.line1).toBe('1 Infinite Loop');
      expect(a.addressLine2).toBe('Suite 1');
      expect(a.city).toBe('Cupertino');
      expect(a.state).toBe('CA');
      expect(a.region).toBe('CA');
      expect(a.zipCode).toBe('95014');
      expect(a.country).toBe('US');
    });

    it('should throw when constructed without a country', () => {
      expect(() => GlobalAddress.from({ addressLine1: 'x' })).toThrow('countryCode');
    });
  });

  describe('validation — US', () => {
    it('should validate a complete US address', () => {
      const result = GlobalAddress.validate({
        countryCode: 'US',
        addressLines: ['1600 Amphitheatre Pkwy'],
        locality: 'Mountain View',
        administrativeArea: 'CA',
        postalCode: '94043',
      });
      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should reject a US address missing state when state is required', () => {
      const result = GlobalAddress.validate({
        countryCode: 'US',
        addressLines: ['1600 Amphitheatre Pkwy'],
        locality: 'Mountain View',
        postalCode: '94043',
      });
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('administrativeArea');
    });

    it('should reject a malformed US ZIP when the pattern fails', () => {
      const result = GlobalAddress.validate({
        countryCode: 'US',
        addressLines: ['1600 Amphitheatre Pkwy'],
        locality: 'Mountain View',
        administrativeArea: 'CA',
        postalCode: 'ABCDE',
      });
      expect(result.valid).toBe(false);
      expect(result.postalCodeError).toContain('US');
    });
  });

  describe('validation — countries without states', () => {
    it('should validate a UK address without a state when countryCode is GB', () => {
      const result = GlobalAddress.validate({
        countryCode: 'GB',
        addressLines: ['221B Baker Street'],
        locality: 'London',
        postalCode: 'NW1 6XE',
      });
      expect(result.valid).toBe(true);
    });

    it('should validate a French address without a state when countryCode is FR', () => {
      const result = GlobalAddress.validate({
        countryCode: 'FR',
        addressLines: ['8 Rue de la Paix'],
        locality: 'Paris',
        postalCode: '75002',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject a GB address with a malformed postcode when the pattern fails', () => {
      const result = GlobalAddress.validate({
        countryCode: 'GB',
        addressLines: ['221B Baker Street'],
        locality: 'London',
        postalCode: '12345',
      });
      expect(result.valid).toBe(false);
      expect(result.postalCodeError).toBeTruthy();
    });
  });

  describe('validation — countries without postal codes', () => {
    it('should validate a UAE address without a postal code when countryCode is AE', () => {
      const result = GlobalAddress.validate({
        countryCode: 'AE',
        addressLines: ['Sheikh Zayed Road'],
        locality: 'Dubai',
        administrativeArea: 'Dubai',
      });
      expect(result.valid).toBe(true);
    });

    it('should validate a Hong Kong address without a postal code when countryCode is HK', () => {
      const result = GlobalAddress.validate({
        countryCode: 'HK',
        addressLines: ['1 Harbour Road'],
        locality: 'Wan Chai',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validation — JP big-to-small', () => {
    it('should validate a Japanese address when prefecture and postal code are present', () => {
      const result = GlobalAddress.validate({
        countryCode: 'JP',
        addressLines: ['1-1 Chiyoda'],
        locality: 'Chiyoda-ku',
        administrativeArea: 'Tokyo',
        postalCode: '100-0001',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject a Japanese address missing prefecture when administrativeArea is required', () => {
      const result = GlobalAddress.validate({
        countryCode: 'JP',
        addressLines: ['1-1 Chiyoda'],
        locality: 'Chiyoda-ku',
        postalCode: '100-0001',
      });
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('administrativeArea');
    });
  });

  describe('validation — dependent locality countries', () => {
    it('should require dependentLocality for a Brazilian address when countryCode is BR', () => {
      const missing = GlobalAddress.validate({
        countryCode: 'BR',
        addressLines: ['Av. Paulista, 1000'],
        locality: 'São Paulo',
        administrativeArea: 'SP',
        postalCode: '01310-100',
      });
      expect(missing.valid).toBe(false);
      expect(missing.missingFields).toContain('dependentLocality');

      const valid = GlobalAddress.validate({
        countryCode: 'BR',
        addressLines: ['Av. Paulista, 1000'],
        dependentLocality: 'Bela Vista',
        locality: 'São Paulo',
        administrativeArea: 'SP',
        postalCode: '01310-100',
      });
      expect(valid.valid).toBe(true);
    });
  });

  describe('validation — fallback metadata', () => {
    it('should validate an unlisted-country address against the permissive default when countryCode is unknown', () => {
      const result = GlobalAddress.validate({
        countryCode: 'AQ',
        addressLines: ['Research Station'],
        locality: 'McMurdo',
      });
      expect(result.valid).toBe(true);
    });

    it('should require address lines and locality for unlisted countries when fields are missing', () => {
      const result = GlobalAddress.validate({ countryCode: 'AQ' });
      expect(result.valid).toBe(false);
      expect(result.missingFields).toEqual(expect.arrayContaining(['addressLines', 'locality']));
    });
  });

  describe('formatting', () => {
    it('should format a US address small-to-big when displayOrder is small_to_big', () => {
      const a = GlobalAddress.create({
        countryCode: 'US',
        addressLines: ['1600 Amphitheatre Pkwy'],
        locality: 'Mountain View',
        administrativeArea: 'CA',
        postalCode: '94043',
        recipient: { fullName: 'Ada Lovelace' },
      });
      const lines = a.format();
      expect(lines[0]).toBe('Ada Lovelace');
      expect(lines).toContain('1600 Amphitheatre Pkwy');
      expect(lines).toContain('Mountain View, CA, 94043');
      expect(lines[lines.length - 1]).toBe('US');
    });

    it('should format a Japanese address big-to-small when displayOrder is big_to_small', () => {
      const a = GlobalAddress.create({
        countryCode: 'JP',
        addressLines: ['1-1 Chiyoda'],
        locality: 'Chiyoda-ku',
        administrativeArea: 'Tokyo',
        postalCode: '100-0001',
        recipient: { fullName: 'Tanaka Taro' },
      });
      const lines = a.format();
      expect(lines[0]).toBe('JP');
      expect(lines[1]).toBe('〒100-0001');
      expect(lines).toContain('Tokyo Chiyoda-ku');
      expect(lines[lines.length - 1]).toBe('Tanaka Taro');
    });

    it('should render a compact single-line format when formatOneLine is called', () => {
      const a = GlobalAddress.create({
        countryCode: 'FR',
        addressLines: ['8 Rue de la Paix'],
        locality: 'Paris',
        postalCode: '75002',
      });
      expect(a.formatOneLine()).toBe('8 Rue de la Paix, Paris, 75002, FR');
    });
  });

  describe('metadata lookup', () => {
    it('should return country-specific metadata when the country is listed', () => {
      const meta = getCountryAddressMetadata('GB');
      expect(meta.adminAreaLabel).toBe('county');
      expect(meta.postalCodeLabel).toBe('postcode');
    });

    it('should return default metadata when the country is unlisted or undefined', () => {
      expect(getCountryAddressMetadata('ZZ')).toBe(DEFAULT_ADDRESS_METADATA);
      expect(getCountryAddressMetadata(undefined)).toBe(DEFAULT_ADDRESS_METADATA);
    });
  });
});
