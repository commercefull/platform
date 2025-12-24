/**
 * Admin Login JavaScript
 * Handles login form interactions and password visibility toggle
 */

window.addEventListener('load', function() {
  // Password visibility toggle
  const toggleButton = document.querySelector('.input-group-text .link-secondary');
  const passwordInput = document.querySelector('input[name="password"]');

  if (toggleButton && passwordInput) {
    toggleButton.addEventListener('click', function(e) {
      e.preventDefault();

      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.querySelector('svg').style.opacity = '0.5';
      } else {
        passwordInput.type = 'password';
        this.querySelector('svg').style.opacity = '1';
      }
    });
  }

  // Initialize tooltips if Bootstrap tooltips are available
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
});
