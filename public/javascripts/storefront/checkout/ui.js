/**
 * Checkout UI layer — multi-step navigation, address toggle, payment method toggle.
 * Vanilla ES module, no framework. Imports pure processors.
 */

import { onAction } from '../utils.js';
import { nextStep, stepCircleState, stepLabelState, isLineActive } from './processor.js';

const TOTAL_STEPS = 4;
let currentStep = 1;

function showStep(step) {
  // Hide all steps
  document.querySelectorAll('[data-checkout-step]').forEach(function (el) {
    el.classList.add('hidden');
  });
  // Show current step
  const el = document.querySelector('[data-checkout-step="' + step + '"]');
  if (el) el.classList.remove('hidden');

  // Update step indicators
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const circle = document.querySelector('[data-step-circle="' + i + '"]');
    const label = document.querySelector('[data-step-label="' + i + '"]');
    const circleState = stepCircleState(i, step);
    const labelState = stepLabelState(i, step);

    if (circle) {
      circle.className = circle.className.replace(/bg-(gray-200|ink-900|green-600)\s*/g, '');
      circle.className = circle.className.replace(/text-(gray-500|white)\s*/g, '');
      circle.classList.add(...circleState.classes.split(' '));
      circle.innerHTML = circleState.content;
    }
    if (label) {
      label.className = label.className.replace(/text-(gray-500|ink-900)\s*/g, '');
      label.className = label.className.replace(/font-medium\s*/g, '');
      label.classList.add(...labelState.split(' '));
    }
  }

  // Update connecting lines
  for (let j = 1; j < TOTAL_STEPS; j++) {
    const line = document.querySelector('[data-step-line="' + j + '"]');
    if (line) {
      if (isLineActive(j, step)) {
        line.classList.remove('bg-gray-200');
        line.classList.add('bg-green-600');
      } else {
        line.classList.remove('bg-green-600');
        line.classList.add('bg-gray-200');
      }
    }
  }

  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initStepNavigation() {
  onAction('click', 'checkout-step-next', function (_event, element) {
    const step = parseInt(element.dataset.stepNext, 10);
    if (!isNaN(step)) showStep(nextStep(step, 1, TOTAL_STEPS));
  });

  onAction('click', 'checkout-step-prev', function (_event, element) {
    const step = parseInt(element.dataset.stepPrev, 10);
    if (!isNaN(step)) showStep(nextStep(step, -1, TOTAL_STEPS));
  });
}

function initSameAddressToggle() {
  const sameCheckbox = document.getElementById('sameAddress');
  const shippingSection = document.getElementById('shippingAddress');
  if (!sameCheckbox || !shippingSection) return;

  function toggleShipping() {
    shippingSection.classList.toggle('hidden', sameCheckbox.checked);
  }
  sameCheckbox.addEventListener('change', toggleShipping);
  toggleShipping();
}

function initPaymentMethodToggle() {
  const cardRadio = document.getElementById('credit');
  const paypalRadio = document.getElementById('paypal');
  const cardDetails = document.getElementById('cardDetails');
  if (!cardDetails) return;

  function toggleCardDetails() {
    if (cardRadio) cardDetails.style.display = cardRadio.checked ? 'block' : 'none';
  }
  if (cardRadio) cardRadio.addEventListener('change', toggleCardDetails);
  if (paypalRadio) paypalRadio.addEventListener('change', toggleCardDetails);
  toggleCardDetails();
}

export function initCheckout() {
  initStepNavigation();
  initSameAddressToggle();
  initPaymentMethodToggle();
}
