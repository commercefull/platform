/**
 * `libs/geo` — shared geographic/jurisdictional country-group data.
 *
 * Shared kernel: no dependencies on `modules/*` or `web/*`, no I/O.
 */

export {
  EEA_MEMBER_STATES,
  EU_MEMBER_STATES,
  EU_VAT_AREA,
  GDPR_REGIONS,
  isEeaMember,
  isEuMember,
  isGdprRegion,
  isInEuVatArea,
} from './countryGroups';
