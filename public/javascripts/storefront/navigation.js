/**
 * Navigation module — handles mobile menu toggle and dropdown behavior.
 * Vanilla ES module, no framework.
 */

/**
 * Initialize the mobile menu toggle.
 */
export function initNavigation() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) {
    return;
  }

  toggle.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  // Close menu when clicking outside
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) {
      menu.classList.add('hidden');
    }
  });
}
