/**
 * Country Address Metadata — Shared Kernel
 *
 * Per-country address schema metadata describing which address fields are
 * required, how they are labelled, the postal code pattern, and the display
 * field ordering. Drives `GlobalAddress.validate()` and address forms.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies, no I/O, no module-specific business rules.
 * - Data-only table; countries not listed fall back to `DEFAULT_METADATA`.
 */

/** Which `GlobalAddress` fields a country requires. */
type AddressFieldKey =
  'addressLines' | 'locality' | 'dependentLocality' | 'administrativeArea' | 'postalCode' | 'sortingCode' | 'organization' | 'recipient';

/** Label vocabulary for `administrativeArea` — varies per country. */
type AdminAreaLabel = 'state' | 'province' | 'county' | 'prefecture' | 'region' | 'emirate' | 'territory';

/** Label vocabulary for `postalCode` — varies per country. */
type PostalCodeLabel = 'zipCode' | 'postcode' | 'postalCode' | 'eircode' | 'pinCode';

/** Display ordering: Western `small_to_big` vs East Asian `big_to_small`. */
type AddressDisplayOrder = 'small_to_big' | 'big_to_small';

interface CountryAddressMetadata {
  /** ISO 3166-1 alpha-2 code this metadata describes. */
  countryCode: string;
  /** Fields that must be present/non-empty for a valid address. */
  requiredFields: AddressFieldKey[];
  /** UI label key for `administrativeArea` (e.g. 'state' for US, 'county' for IE). */
  adminAreaLabel: AdminAreaLabel;
  /** UI label key for `postalCode` (e.g. 'zipCode' for US, 'postcode' for GB). */
  postalCodeLabel: PostalCodeLabel;
  /** Optional postal code format. Omit when the country has no postal codes. */
  postalCodePattern?: RegExp;
  /** Human-readable hint for the postal code format (e.g. '12345 or 12345-6789'). */
  postalCodeHint?: string;
  /** Field display order when rendering a formatted address. */
  displayOrder: AddressDisplayOrder;
  /** Whether the country uses `dependentLocality` (suburb/neighborhood/district). */
  usesDependentLocality: boolean;
}

/**
 * Permissive fallback for countries without an explicit entry: name lines,
 * locality, and country are required; `administrativeArea`/`postalCode` are
 * optional so addresses for uncovered countries are not rejected outright.
 */
const DEFAULT_ADDRESS_METADATA: CountryAddressMetadata = {
  countryCode: 'ZZ',
  requiredFields: ['addressLines', 'locality'],
  adminAreaLabel: 'region',
  postalCodeLabel: 'postalCode',
  displayOrder: 'small_to_big',
  usesDependentLocality: false,
};

const METADATA: CountryAddressMetadata[] = [
  {
    countryCode: 'US',
    requiredFields: ['addressLines', 'locality', 'administrativeArea', 'postalCode'],
    adminAreaLabel: 'state',
    postalCodeLabel: 'zipCode',
    postalCodePattern: /^\d{5}(-\d{4})?$/,
    postalCodeHint: '12345 or 12345-6789',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'CA',
    requiredFields: ['addressLines', 'locality', 'administrativeArea', 'postalCode'],
    adminAreaLabel: 'province',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    postalCodeHint: 'K1A 0B1',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'GB',
    requiredFields: ['addressLines', 'locality', 'postalCode'],
    adminAreaLabel: 'county',
    postalCodeLabel: 'postcode',
    postalCodePattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/,
    postalCodeHint: 'SW1A 1AA',
    displayOrder: 'small_to_big',
    usesDependentLocality: true,
  },
  {
    countryCode: 'IE',
    requiredFields: ['addressLines', 'locality'],
    adminAreaLabel: 'county',
    postalCodeLabel: 'eircode',
    postalCodePattern: /^[A-Za-z]\d{2} ?[A-Za-z0-9]{4}$/,
    postalCodeHint: 'D02 X285',
    displayOrder: 'small_to_big',
    usesDependentLocality: true,
  },
  {
    countryCode: 'FR',
    requiredFields: ['addressLines', 'locality', 'postalCode'],
    adminAreaLabel: 'region',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{5}$/,
    postalCodeHint: '75001',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'DE',
    requiredFields: ['addressLines', 'locality', 'postalCode'],
    adminAreaLabel: 'region',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{5}$/,
    postalCodeHint: '10115',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'ES',
    requiredFields: ['addressLines', 'locality', 'administrativeArea', 'postalCode'],
    adminAreaLabel: 'province',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{5}$/,
    postalCodeHint: '28001',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'IT',
    requiredFields: ['addressLines', 'locality', 'administrativeArea', 'postalCode'],
    adminAreaLabel: 'province',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{5}$/,
    postalCodeHint: '00100',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'NL',
    requiredFields: ['addressLines', 'locality', 'postalCode'],
    adminAreaLabel: 'province',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{4} ?[A-Za-z]{2}$/,
    postalCodeHint: '1011 AB',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'BE',
    requiredFields: ['addressLines', 'locality', 'postalCode'],
    adminAreaLabel: 'province',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{4}$/,
    postalCodeHint: '1000',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'JP',
    requiredFields: ['postalCode', 'administrativeArea', 'locality', 'addressLines'],
    adminAreaLabel: 'prefecture',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{3}-?\d{4}$/,
    postalCodeHint: '100-0001',
    displayOrder: 'big_to_small',
    usesDependentLocality: true,
  },
  {
    countryCode: 'AU',
    requiredFields: ['addressLines', 'locality', 'administrativeArea', 'postalCode'],
    adminAreaLabel: 'state',
    postalCodeLabel: 'postcode',
    postalCodePattern: /^\d{4}$/,
    postalCodeHint: '2000',
    displayOrder: 'small_to_big',
    usesDependentLocality: true,
  },
  {
    countryCode: 'AE',
    requiredFields: ['addressLines', 'locality', 'administrativeArea'],
    adminAreaLabel: 'emirate',
    postalCodeLabel: 'postalCode',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'HK',
    requiredFields: ['addressLines', 'locality'],
    adminAreaLabel: 'territory',
    postalCodeLabel: 'postalCode',
    displayOrder: 'big_to_small',
    usesDependentLocality: true,
  },
  {
    countryCode: 'SG',
    requiredFields: ['addressLines', 'postalCode'],
    adminAreaLabel: 'region',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{6}$/,
    postalCodeHint: '018956',
    displayOrder: 'small_to_big',
    usesDependentLocality: false,
  },
  {
    countryCode: 'BR',
    requiredFields: ['addressLines', 'dependentLocality', 'locality', 'administrativeArea', 'postalCode'],
    adminAreaLabel: 'state',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{5}-?\d{3}$/,
    postalCodeHint: '01310-100',
    displayOrder: 'small_to_big',
    usesDependentLocality: true,
  },
  {
    countryCode: 'MX',
    requiredFields: ['addressLines', 'dependentLocality', 'locality', 'administrativeArea', 'postalCode'],
    adminAreaLabel: 'state',
    postalCodeLabel: 'postalCode',
    postalCodePattern: /^\d{5}$/,
    postalCodeHint: '06600',
    displayOrder: 'small_to_big',
    usesDependentLocality: true,
  },
  {
    countryCode: 'IN',
    requiredFields: ['addressLines', 'locality', 'administrativeArea', 'postalCode'],
    adminAreaLabel: 'state',
    postalCodeLabel: 'pinCode',
    postalCodePattern: /^\d{6}$/,
    postalCodeHint: '110001',
    displayOrder: 'small_to_big',
    usesDependentLocality: true,
  },
];

const BY_COUNTRY = new Map(METADATA.map(m => [m.countryCode, m]));

/**
 * Look up address metadata for an ISO 3166-1 alpha-2 country code.
 * Returns `DEFAULT_ADDRESS_METADATA` for unknown/unlisted countries.
 */
export function getCountryAddressMetadata(countryCode: string | undefined | null): CountryAddressMetadata {
  if (!countryCode) return DEFAULT_ADDRESS_METADATA;
  return BY_COUNTRY.get(countryCode.toUpperCase()) ?? DEFAULT_ADDRESS_METADATA;
}

/**
 * JSON-serializable field-requirement map for the storefront address forms —
 * one entry per known country plus 'ZZ' (the permissive default). Rendered
 * into the page so client JS can toggle required/labels per country without
 * duplicating the table.
 */
interface AddressFieldUiMetadata {
  adminRequired: boolean;
  postalRequired: boolean;
  adminLabel: AdminAreaLabel;
  postalLabel: PostalCodeLabel;
  postalHint?: string;
  usesDependentLocality: boolean;
}

export function getAddressFieldUiMetadata(): Record<string, AddressFieldUiMetadata> {
  const out: Record<string, AddressFieldUiMetadata> = {};
  const entry = (m: CountryAddressMetadata): AddressFieldUiMetadata => ({
    adminRequired: m.requiredFields.includes('administrativeArea'),
    postalRequired: m.requiredFields.includes('postalCode'),
    adminLabel: m.adminAreaLabel,
    postalLabel: m.postalCodeLabel,
    postalHint: m.postalCodeHint,
    usesDependentLocality: m.usesDependentLocality,
  });
  for (const m of METADATA) out[m.countryCode] = entry(m);
  out['ZZ'] = entry(DEFAULT_ADDRESS_METADATA);
  return out;
}
