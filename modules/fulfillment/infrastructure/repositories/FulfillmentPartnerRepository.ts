/**
 * Consolidated Fulfillment Partner Repository
 *
 * Merges fulfillmentLocationRepo and fulfillmentPartnerRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Fulfillment Partner (locations, partners, network)
 */

import fulfillmentLocationRepo from './fulfillmentLocationRepo';
import fulfillmentPartnerRepo from './fulfillmentPartnerRepo';

// Re-export types for backward compatibility
export type { CreateFulfillmentLocationParams, UpdateFulfillmentLocationParams } from './fulfillmentLocationRepo';
export type { FulfillmentPartner } from './fulfillmentPartnerRepo';

class FulfillmentPartnerRepository {
  readonly locations = fulfillmentLocationRepo;
  readonly partners = fulfillmentPartnerRepo;
}

export default new FulfillmentPartnerRepository();
