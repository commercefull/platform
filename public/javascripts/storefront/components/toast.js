/**
 * Toast component — reusable toast notifications.
 * Vanilla ES module, no framework.
 */

let toastContainer = null;

/**
 * Ensure the toast container exists in the DOM.
 * @returns {HTMLElement}
 */
function getContainer() {
  if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.className = 'fixed bottom-6 right-6 flex flex-col gap-2 z-[200] pointer-events-none';
  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration — milliseconds (default 3000)
 */
export function toast(message, type = 'success', duration = 3000) {
  const container = getContainer();
  const el = document.createElement('div');
  const bg = type === 'error' ? 'bg-red-600' : type === 'info' ? 'bg-gray-800' : 'bg-ink-900';
  const icon =
    type === 'error'
      ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
      : type === 'success'
        ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        : '';
  el.className = `flex items-center gap-2 px-4 py-3 rounded shadow-lg text-white text-sm ${bg} pointer-events-auto transition-all duration-300 opacity-0 translate-y-2`;
  el.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(el);

  // Animate in
  requestAnimationFrame(function () {
    el.classList.remove('opacity-0', 'translate-y-2');
  });

  // Auto-dismiss
  setTimeout(function () {
    el.classList.add('opacity-0', 'translate-y-2');
    setTimeout(function () {
      return el.remove();
    }, 300);
  }, duration);
}
