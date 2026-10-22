/**
 * `libs/address` — canonical global address primitives.
 *
 * Shared kernel: no dependencies on `modules/*` or `web/*`, no I/O.
 */

export {
  DEFAULT_ADDRESS_METADATA,
  getCountryAddressMetadata,
  getAddressFieldUiMetadata,
} from './countryAddressMetadata';
export type {
  AddressDisplayOrder,
  AddressFieldUiMetadata,
  AddressFieldKey,
  AdminAreaLabel,
  CountryAddressMetadata,
  PostalCodeLabel,
} from './countryAddressMetadata';
export { GlobalAddress } from './GlobalAddress';
export type { GlobalAddressInput, GlobalAddressProps, GlobalAddressValidationResult } from './GlobalAddress';
