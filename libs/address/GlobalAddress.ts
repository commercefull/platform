/**
 * GlobalAddress — Shared Kernel
 *
 * Canonical country-neutral postal address value object with per-country
 * validation and formatting driven by `countryAddressMetadata`.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies on `modules/*` or `web/*`, no I/O.
 * - Universal vocabulary: country → administrativeArea → locality →
 *   dependentLocality → addressLines, plus recipient metadata.
 *
 * Backward compatibility: legacy getter aliases (`address1`, `street1`,
 * `city`, `state`, `region`, `zipCode`) map onto the canonical fields so
 * existing consumers can migrate incrementally.
 */

import { AddressFieldKey, CountryAddressMetadata, getCountryAddressMetadata } from './countryAddressMetadata';

/** Fields a `GlobalAddress` may carry. All except `countryCode` are optional. */
export interface GlobalAddressProps {
  /** ISO 3166-1 alpha-2 country code (required, uppercased on construction). */
  countryCode: string;
  /** Street address lines (line1..line4). */
  addressLines?: string[];
  /** City / town / post town. */
  locality?: string;
  /** Suburb / neighborhood / district / colonia / ward. */
  dependentLocality?: string;
  /** State / province / prefecture / county / oblast / emirate. */
  administrativeArea?: string;
  /** ZIP / postcode / PIN / Eircode. */
  postalCode?: string;
  /** CEDEX or other sorting code (rare; used in FR corporate mail). */
  sortingCode?: string;
  /** Company or organization name. */
  organization?: string;
  /** Free-form recipient fields. */
  recipient?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    email?: string;
  };
}

/** Validation outcome for `GlobalAddress.validate()`. */
export interface GlobalAddressValidationResult {
  valid: boolean;
  /** Field keys that failed a requirement check. */
  missingFields: AddressFieldKey[];
  /** Non-empty when `postalCode` exists but fails the country pattern. */
  postalCodeError?: string;
}

/**
 * Input shape accepted by `GlobalAddress.from()` — canonical fields plus all
 * known legacy aliases (`address1`, `street1`, `city`, `state`, `region`,
 * `zipCode`, `country`) used across checkout/order/customer/shipping/store.
 */
export type GlobalAddressInput = Partial<GlobalAddressProps> & {
  country?: string;
  address1?: string;
  address2?: string;
  addressLine1?: string;
  addressLine2?: string;
  street1?: string;
  street2?: string;
  line1?: string;
  line2?: string;
  city?: string;
  town?: string;
  state?: string;
  province?: string;
  region?: string;
  zip?: string;
  zipCode?: string;
  postcode?: string;
  suburb?: string;
  district?: string;
};

export class GlobalAddress {
  private readonly props: GlobalAddressProps;

  private constructor(props: GlobalAddressProps) {
    this.props = {
      ...props,
      countryCode: props.countryCode.toUpperCase(),
      addressLines: props.addressLines ? [...props.addressLines] : undefined,
      recipient: props.recipient ? { ...props.recipient } : undefined,
    };
  }

  /** Build a `GlobalAddress` from canonical or legacy-aliased input. */
  static from(input: GlobalAddressInput): GlobalAddress {
    const countryCode = input.countryCode ?? input.country;
    if (!countryCode) {
      throw new Error('GlobalAddress requires a countryCode');
    }
    return new GlobalAddress({
      countryCode,
      addressLines: resolveAddressLines(input),
      locality: input.locality ?? input.city ?? input.town,
      dependentLocality: input.dependentLocality ?? input.suburb ?? input.district,
      administrativeArea: input.administrativeArea ?? input.state ?? input.province ?? input.region,
      postalCode: input.postalCode ?? input.zipCode ?? input.zip ?? input.postcode,
      sortingCode: input.sortingCode,
      organization: input.organization,
      recipient: input.recipient,
    });
  }

  static create(props: GlobalAddressProps): GlobalAddress {
    return new GlobalAddress(props);
  }

  /** Immutable snapshot of the canonical props. */
  toProps(): GlobalAddressProps {
    return {
      ...this.props,
      addressLines: this.props.addressLines ? [...this.props.addressLines] : undefined,
      recipient: this.props.recipient ? { ...this.props.recipient } : undefined,
    };
  }

  get countryCode(): string {
    return this.props.countryCode;
  }

  get addressLines(): string[] {
    return this.props.addressLines ? [...this.props.addressLines] : [];
  }

  get locality(): string | undefined {
    return this.props.locality;
  }

  get dependentLocality(): string | undefined {
    return this.props.dependentLocality;
  }

  get administrativeArea(): string | undefined {
    return this.props.administrativeArea;
  }

  get postalCode(): string | undefined {
    return this.props.postalCode;
  }

  get sortingCode(): string | undefined {
    return this.props.sortingCode;
  }

  get organization(): string | undefined {
    return this.props.organization;
  }

  get recipient(): GlobalAddressProps['recipient'] {
    return this.props.recipient ? { ...this.props.recipient } : undefined;
  }

  // -------------------------------------------------------------------------
  // Legacy aliases — keep existing module consumers compiling while they
  // migrate to canonical field names.
  // -------------------------------------------------------------------------

  get addressLine1(): string | undefined {
    return this.props.addressLines?.[0];
  }

  get addressLine2(): string | undefined {
    return this.props.addressLines?.[1];
  }

  /** Alias used by `order`'s `OrderAddress`. */
  get address1(): string | undefined {
    return this.addressLine1;
  }

  get address2(): string | undefined {
    return this.addressLine2;
  }

  /** Alias used by `shipping`'s `ShippingAddress`. */
  get street1(): string | undefined {
    return this.addressLine1;
  }

  get street2(): string | undefined {
    return this.addressLine2;
  }

  /** Alias used by `store`'s `StoreAddress`/`line1`. */
  get line1(): string | undefined {
    return this.addressLine1;
  }

  get line2(): string | undefined {
    return this.addressLine2;
  }

  /** Alias for `locality`. */
  get city(): string | undefined {
    return this.props.locality;
  }

  /** Alias for `administrativeArea`. */
  get state(): string | undefined {
    return this.props.administrativeArea;
  }

  /** Alias for `administrativeArea` (checkout VO uses `region`). */
  get region(): string | undefined {
    return this.props.administrativeArea;
  }

  /** Alias for `postalCode`. */
  get zipCode(): string | undefined {
    return this.props.postalCode;
  }

  /** Alias for `countryCode` (checkout VO uses `country`). */
  get country(): string {
    return this.props.countryCode;
  }

  /**
   * Validate this address against its country's metadata.
   * Required-field checks and postal-code pattern checks are data-driven;
   * countries without explicit metadata fall back to a permissive default.
   */
  validate(): GlobalAddressValidationResult {
    return GlobalAddress.validateProps(this.toProps());
  }

  /** Static validation on a props-shaped object (canonical or legacy input). */
  static validate(input: GlobalAddressInput): GlobalAddressValidationResult {
    return GlobalAddress.from(input).validate();
  }

  /** Validate raw canonical props without constructing an instance. */
  static validateProps(props: GlobalAddressProps): GlobalAddressValidationResult {
    const meta = getCountryAddressMetadata(props.countryCode);
    const missingFields: AddressFieldKey[] = [];

    for (const field of meta.requiredFields) {
      if (!hasValue(props, field)) {
        missingFields.push(field);
      }
    }

    let postalCodeError: string | undefined;
    if (props.postalCode && meta.postalCodePattern && !meta.postalCodePattern.test(props.postalCode)) {
      postalCodeError = `postalCode does not match ${props.countryCode} format${meta.postalCodeHint ? ` (e.g. ${meta.postalCodeHint})` : ''}`;
    }

    return {
      valid: missingFields.length === 0 && !postalCodeError,
      missingFields,
      postalCodeError,
    };
  }

  /** Country metadata this address validates against. */
  metadata(): CountryAddressMetadata {
    return getCountryAddressMetadata(this.props.countryCode);
  }

  /**
   * Format the address as display lines in the country's conventional order.
   * `big_to_small` countries (JP, HK) put postal/administrative fields first.
   */
  format(): string[] {
    const meta = this.metadata();
    const p = this.props;
    const recipientName = p.recipient?.fullName ?? ([p.recipient?.firstName, p.recipient?.lastName].filter(Boolean).join(' ') || undefined);

    if (meta.displayOrder === 'big_to_small') {
      const lines: (string | undefined)[] = [
        p.countryCode,
        p.postalCode ? `〒${p.postalCode}` : undefined,
        [p.administrativeArea, p.locality, p.dependentLocality].filter(Boolean).join(' ') || undefined,
        ...(p.addressLines ?? []).slice().reverse(),
        p.organization,
        recipientName,
      ];
      return lines.filter((l): l is string => Boolean(l));
    }

    const lines: (string | undefined)[] = [
      recipientName,
      p.organization,
      ...(p.addressLines ?? []),
      p.dependentLocality,
      [p.locality, p.administrativeArea, p.postalCode].filter(Boolean).join(', ') || undefined,
      p.countryCode,
    ];
    return lines.filter((l): l is string => Boolean(l));
  }

  /** Single-line format for compact display (list views, logs). */
  formatOneLine(): string {
    return this.format().join(', ');
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveAddressLines(input: GlobalAddressInput): string[] | undefined {
  if (input.addressLines && input.addressLines.length > 0) {
    return [...input.addressLines];
  }
  const lines = [
    input.addressLine1 ?? input.address1 ?? input.street1 ?? input.line1,
    input.addressLine2 ?? input.address2 ?? input.street2 ?? input.line2,
  ].filter((l): l is string => typeof l === 'string' && l.trim().length > 0);
  return lines.length > 0 ? lines : undefined;
}

function hasValue(props: GlobalAddressProps, field: AddressFieldKey): boolean {
  switch (field) {
    case 'addressLines':
      return Array.isArray(props.addressLines) && props.addressLines.some(l => l.trim().length > 0);
    case 'recipient':
      return Boolean(props.recipient && (props.recipient.fullName || props.recipient.firstName || props.recipient.lastName));
    default: {
      const value = props[field];
      return typeof value === 'string' && value.trim().length > 0;
    }
  }
}
