/**
 * CustomerSubscriptionAddressAdapter
 *
 * ACL adapter implementing subscription's SubscriptionAddressPort on top
 * of the customer module's address repository.
 */

import type { CustomerAddressRepo } from '../../../customer/infrastructure/repositories/customerAddressRepo';
import type { SubscriptionAddressPort, SubscriptionDestination } from '../../application/ports/SubscriptionAddressPort';

export class CustomerSubscriptionAddressAdapter implements SubscriptionAddressPort {
  constructor(private readonly addressRepo: Pick<CustomerAddressRepo, 'findById'>) {}

  async resolveDestination(customerAddressId: string): Promise<SubscriptionDestination | null> {
    try {
      const address = await this.addressRepo.findById(customerAddressId);
      if (!address?.country) return null;
      return {
        country: address.country,
        region: address.state ?? undefined,
        postalCode: address.postalCode ?? undefined,
        city: address.city ?? undefined,
      };
    } catch {
      return null;
    }
  }
}
