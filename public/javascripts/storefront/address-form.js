/**
 * Country-driven address form.
 *
 * Toggles required state and labels for the administrative-area (state/
 * province/emirate) and postal-code fields from per-country metadata
 * rendered into the page by the server (`window.__ADDRESS_METADATA` —
 * produced from libs/address/countryAddressMetadata). Country list comes
 * from the market the request resolved to.
 */

const LABELS = {
  state: 'State',
  province: 'Province',
  county: 'County',
  prefecture: 'Prefecture',
  region: 'Region',
  emirate: 'Emirate',
  territory: 'Territory',
  zipCode: 'ZIP Code',
  postcode: 'Postcode',
  postalCode: 'Postal Code',
  eircode: 'Eircode',
  pinCode: 'PIN Code',
};

/**
 * Resolve the display/required rules for a country from the metadata blob.
 * Returns null when nothing applies (caller leaves the form untouched).
 *
 * @param {Object} meta — `window.__ADDRESS_METADATA` map keyed by alpha-2 code
 * @param {string} country — selected country code
 */
export function resolveCountryRules(meta, country) {
  const rules = (meta && meta[country]) || (meta && meta.ZZ);
  if (!rules) return null;
  return {
    adminRequired: !!rules.adminRequired,
    adminLabel: LABELS[rules.adminLabel] || 'Region',
    postalRequired: !!rules.postalRequired,
    postalLabel: LABELS[rules.postalLabel] || 'Postal Code',
    postalHint: rules.postalHint || null,
  };
}

function applyCountryRules(meta, country) {
  const resolved = resolveCountryRules(meta, country);
  if (!resolved) return;

  const stateInput = document.querySelector('[name="state"], [name="region"]');
  const postalInput = document.querySelector('[name="postalCode"]');
  const stateLabel = document.querySelector('label[for="addr-state"]');
  const postalLabel = document.querySelector('label[for="addr-postal"]');

  if (stateInput) {
    stateInput.required = resolved.adminRequired;
    stateInput.placeholder = resolved.adminLabel;
    if (stateLabel) stateLabel.textContent = resolved.adminLabel;
  }
  if (postalInput) {
    postalInput.required = resolved.postalRequired;
    postalInput.placeholder = resolved.postalHint || resolved.postalLabel;
    if (postalLabel) postalLabel.textContent = resolved.postalLabel;
  }
}

export function initAddressForm() {
  const form = document.querySelector('[data-address-form]');
  if (!form) return;
  const meta = window.__ADDRESS_METADATA || {};
  const countrySelect = form.querySelector('[name="country"]');
  if (!countrySelect) return;

  countrySelect.addEventListener('change', () => applyCountryRules(meta, countrySelect.value));
  applyCountryRules(meta, countrySelect.value || 'US');
}
