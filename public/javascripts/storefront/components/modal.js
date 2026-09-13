/**
 * Modal component — reusable modal dialog.
 * Vanilla ES module, no framework.
 */

/**
 * Open a modal by selector.
 * @param {string} selector — CSS selector for the modal element
 */
export function openModal(selector) {
  const modal = document.querySelector(selector);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

/**
 * Close a modal by selector.
 * @param {string} selector
 */
export function closeModal(selector) {
  const modal = document.querySelector(selector);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

/**
 * Initialize all modals on the page — wires close buttons, overlay clicks, and Escape.
 */
export function initModals() {
  const modals = document.querySelectorAll('[data-modal]');
  modals.forEach(function (modal) {
    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        return closeModal('[data-modal="' + modal.dataset.modal + '"]');
      });
    }
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal('[data-modal="' + modal.dataset.modal + '"]');
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      modals.forEach(function (modal) {
        if (!modal.classList.contains('hidden')) {
          closeModal('[data-modal="' + modal.dataset.modal + '"]');
        }
      });
    }
  });
}
