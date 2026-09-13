/**
 * Product Gallery module — handles PDP image gallery interactions.
 * Vanilla ES module, no framework.
 */

/**
 * Initialize product gallery on PDP.
 */
export function initProductGallery() {
  const thumbnails = document.querySelectorAll('[data-thumbnail]');
  const mainImage = document.getElementById('main-product-image');
  if (!thumbnails.length || !mainImage) return;

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.getAttribute('data-image');
      if (!src) return;
      mainImage.src = src;
      // Update active state
      thumbnails.forEach(t => t.classList.remove('border-ink-900'));
      thumb.classList.add('border-ink-900');
    });
  });

  // Zoom on hover
  mainImage.addEventListener('mouseenter', () => {
    mainImage.style.transform = 'scale(1.05)';
    mainImage.style.transition = 'transform 0.3s ease';
  });
  mainImage.addEventListener('mouseleave', () => {
    mainImage.style.transform = 'scale(1)';
  });
}
