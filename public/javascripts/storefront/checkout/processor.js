/**
 * Checkout processor — pure business logic for multi-step checkout.
 * No DOM, no fetch. Fully testable in Node without jsdom.
 */

/**
 * Compute the next step in the checkout flow.
 * @param {number} current
 * @param {number} delta — +1 (next) or -1 (prev)
 * @param {number} totalSteps
 * @returns {number} clamped step number
 */
export function nextStep(current, delta, totalSteps) {
  const next = current + delta;
  return Math.max(1, Math.min(next, totalSteps));
}

/**
 * Determine the CSS classes for a step indicator circle.
 * @param {number} stepIndex — the step number (1-based)
 * @param {number} currentStep — the active step
 * @returns {{classes: string, content: string}} classes and inner content
 */
export function stepCircleState(stepIndex, currentStep) {
  if (stepIndex < currentStep) {
    return { classes: 'bg-green-600 text-white', content: '\u2713' };
  }
  if (stepIndex === currentStep) {
    return { classes: 'bg-ink-900 text-white', content: String(stepIndex) };
  }
  return { classes: 'bg-gray-200 text-gray-500', content: String(stepIndex) };
}

/**
 * Determine the CSS classes for a step label.
 * @param {number} stepIndex
 * @param {number} currentStep
 * @returns {string}
 */
export function stepLabelState(stepIndex, currentStep) {
  if (stepIndex === currentStep) {
    return 'text-ink-900 font-medium';
  }
  if (stepIndex < currentStep) {
    return 'text-ink-900';
  }
  return 'text-gray-500';
}

/**
 * Determine if a connecting line should be active (green) or inactive (gray).
 * @param {number} lineIndex — the line number (1-based, between steps)
 * @param {number} currentStep
 * @returns {boolean} true if the line should be active
 */
export function isLineActive(lineIndex, currentStep) {
  return lineIndex < currentStep;
}
