/**
 * Pricing Feature
 * 
 * Main entry point for the pricing feature that loads all extensions and services
 */
import { PricingService } from './services/pricingService';
import './hooks/pricingHooks';

// Import extensions to ensure they are loaded
import '../basket/basketPricingExtension';
import '../order/orderPricingExtension';

// Initialize and export the main pricing service
const pricingService = new PricingService();

export {
  pricingService,
  PricingService
};

/**
 * Initialize the pricing feature
 * This should be called during application startup
 */
export function initializePricingFeature() {
  console.log('Pricing feature initialized');
  // Any additional initialization logic can go here
  return true;
}
