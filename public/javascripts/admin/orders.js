// Order management JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize filters as hidden
  const filtersBody = document.getElementById('filtersBody');
  const toggleButton = document.getElementById('toggleFilters');

  if (filtersBody) {
    filtersBody.style.display = 'none'; // Start hidden
  }

  if (toggleButton) {
    // Set initial button text to "Show Filters"
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon me-1">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
      </svg>
      Show Filters
    `;

    toggleButton.addEventListener('click', function() {
      if (filtersBody) {
        const isHidden = filtersBody.style.display === 'none';
        filtersBody.style.display = isHidden ? 'block' : 'none';
        this.innerHTML = isHidden ? `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon me-1">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
          </svg>
          Hide Filters
        ` : `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon me-1">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
          </svg>
          Show Filters
        `;
      }
    });
  }
});
