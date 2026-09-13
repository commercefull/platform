/**
 * Account module — account dropdown, address forms.
 * Vanilla ES module, no framework.
 */

/**
 * Initialize account dropdown toggle.
 */
function initAccountDropdown() {
  const trigger = document.querySelector('[data-account-dropdown-trigger]');
  const menu = document.querySelector('[data-account-dropdown-menu]');
  if (!trigger || !menu) return;

  let open = false;

  function toggle() {
    open = !open;
    menu.classList.toggle('hidden', !open);
    trigger.setAttribute('aria-expanded', String(open));
  }

  function close() {
    open = false;
    menu.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', function (e) {
    if (!trigger.contains(e.target) && !menu.contains(e.target)) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
}

/**
 * Initialize address form enhancement (country → region cascading).
 */
function initAddressForms() {
  const countrySelects = document.querySelectorAll('[data-address-country]');
  countrySelects.forEach(function (select) {
    select.addEventListener('change', function () {
      const form = select.closest('form');
      const regionSelect = form?.querySelector('[data-address-region]');
      if (!regionSelect) return;
      // Clear existing options except placeholder
      while (regionSelect.options.length > 1) {
        regionSelect.remove(1);
      }
      // Regions would be loaded from an API or embedded data
      const regions = window.__regionsByCountry?.[select.value] || [];
      regions.forEach(function (region) {
        const opt = document.createElement('option');
        opt.value = region.code;
        opt.textContent = region.name;
        regionSelect.appendChild(opt);
      });
    });
  });
}

/**
 * Initialize all account behaviors.
 */
export function initAccount() {
  initAccountDropdown();
  initAddressForms();
}
