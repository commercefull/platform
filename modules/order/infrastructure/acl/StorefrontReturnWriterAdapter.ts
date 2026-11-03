/**
 * StorefrontReturnWriterAdapter
 *
 * ACL adapter: the storefront's item-less "simple return" is written through
 * the returns module's canonical orderReturn repository, keeping a single
 * owner for orderReturn mutation SQL.
 */

import { ReturnRequest } from '../../../returns/domain/entities/ReturnRequest';
import type { ReturnRequestRepository } from '../../../returns/domain/repositories/ReturnRepository';
import type { StorefrontReturnWriter } from '../../domain/repositories/OrderReturnRepository';

export class StorefrontReturnWriterAdapter implements StorefrontReturnWriter {
  constructor(private readonly returns: Pick<ReturnRequestRepository, 'create'>) {}

  async createSimple(orderId: string, customerId: string, reason: string, description?: string): Promise<unknown> {
    const returnRequest = ReturnRequest.create({
      orderId,
      customerId,
      returnType: 'refund',
      returnReason: reason,
      customerNotes: description,
      returnCarrier: 'usps',
      returnShippingPaid: false,
      requiresInspection: false,
      items: [],
    });
    return this.returns.create(returnRequest);
  }
}
