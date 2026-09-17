
/**
 * Test utilities for GDPR integration tests
 */

/**
 * Generate a unique consent ID for testing
 */
export function generateConsentId(): string {
  return `test-consent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
