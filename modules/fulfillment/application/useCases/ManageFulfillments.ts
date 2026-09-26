/**
 * Manage Fulfillments Use Case
 *
 * Fulfillment queries and source assignment shared by the fulfillment
 * controllers and resolvers.
 */

import {
  IFulfillmentRepository,
  FulfillmentFilters,
} from '../../domain/repositories/FulfillmentRepository';
import { FulfillmentNotFoundError } from '../../domain/errors/FulfillmentErrors';
import { SourceType } from '../../domain/entities/Fulfillment';
import { PaginationOptions } from 'libs/types/shared';

export class ManageFulfillmentsUseCase {
  constructor(private readonly fulfillmentRepository: IFulfillmentRepository) {}

  async findByOrderId(orderId: string) {
    return this.fulfillmentRepository.findByOrderId(orderId);
  }

  async findAll(filters?: FulfillmentFilters, pagination?: PaginationOptions) {
    return this.fulfillmentRepository.findAll(filters, pagination);
  }

  async findById(fulfillmentId: string) {
    return this.fulfillmentRepository.findById(fulfillmentId);
  }

  async assign(fulfillmentId: string, sourceType: SourceType, sourceId: string) {
    const fulfillment = await this.fulfillmentRepository.findById(fulfillmentId);
    if (!fulfillment) {
      throw new FulfillmentNotFoundError(fulfillmentId);
    }
    fulfillment.assign(sourceType, sourceId);
    return this.fulfillmentRepository.save(fulfillment);
  }
}
