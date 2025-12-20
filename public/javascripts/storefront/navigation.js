// Navigation dropdown functionality for CSP compliance
document.addEventListener('DOMContentLoaded', function() {
  // Shop dropdown functionality
  const shopBtn = document.getElementById('shop-dropdown-btn');
  const shopMenu = document.getElementById('shop-dropdown-menu');

  if (shopBtn && shopMenu) {
    shopBtn.addEventListener('click', function(event) {
      event.stopPropagation();
      shopMenu.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (!shopBtn.contains(event.target) && !shopMenu.contains(event.target)) {
        shopMenu.classList.add('hidden');
      }
    });
  }

  // User menu dropdown functionality
  const userBtn = document.getElementById('user-menu-btn');
  const userMenu = document.getElementById('user-menu-dropdown');

  if (userBtn && userMenu) {
    userBtn.addEventListener('click', function(event) {
      event.stopPropagation();
      userMenu.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (!userBtn.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.classList.add('hidden');
      }
    });
  }

  // Mobile menu button (if needed in future)
  const mobileBtn = document.querySelector('button.md\\:hidden');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', function() {
      // Mobile menu functionality can be added here if needed
      console.log('Mobile menu button clicked');
    });
  }
});
