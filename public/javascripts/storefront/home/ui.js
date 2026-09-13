/**
 * Home UI layer — event delegation and DOM updates for the home page.
 * Vanilla ES module, no framework. Imports pure processors.
 */

import { onAction } from '../utils.js';
import { nextSlideIndex, shouldLazyLoad } from './processor.js';

function initHeroCarousel() {
  const carousel = document.querySelector('[data-hero-carousel]');
  if (!carousel) return;
  const slides = carousel.querySelectorAll('[data-hero-slide]');
  if (slides.length === 0) return;

  let current = 0;
  let autoTimer = null;

  function goTo(index) {
    current = index;
    const dots = carousel.querySelectorAll('[data-hero-dot]');
    slides.forEach(function (slide, i) {
      slide.classList.toggle('opacity-100', i === current);
      slide.classList.toggle('opacity-0', i !== current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('bg-ink-900', i === current);
      dot.classList.toggle('bg-gray-300', i !== current);
    });
  }

  function next() {
    goTo(nextSlideIndex(current, 1, slides.length));
  }
  function prev() {
    goTo(nextSlideIndex(current, -1, slides.length));
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, 5000);
  }
  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
  }

  onAction('click', 'hero-prev', function () {
    prev();
    startAuto();
  });
  onAction('click', 'hero-next', function () {
    next();
    startAuto();
  });
  onAction('click', 'hero-dot', function (_event, element) {
    const index = parseInt(element.dataset.heroDot, 10);
    if (!isNaN(index)) goTo(index);
    startAuto();
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  startAuto();
}

function initProductCarousels() {
  const scrollAmount = 280;

  onAction('click', 'carousel-prev', function (_event, element) {
    const carousel = element.closest('[data-product-carousel]');
    const track = carousel && carousel.querySelector('[data-carousel-track]');
    if (track) track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  onAction('click', 'carousel-next', function (_event, element) {
    const carousel = element.closest('[data-product-carousel]');
    const track = carousel && carousel.querySelector('[data-carousel-track]');
    if (track) track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  if (images.length === 0) return;
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && shouldLazyLoad(entry.target)) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '100px' },
  );
  images.forEach(function (img) {
    return observer.observe(img);
  });
}

export function initHome() {
  initHeroCarousel();
  initProductCarousels();
  initLazyLoading();
}
