/**
 * EvaluateSegment Use Case
 *
 * Evaluates segment membership for all customers or a specific customer.
 */

import { Segment } from '../../domain/entities/Segment';
import { ISegmentRepository } from '../../domain/repositories/SegmentRepository';
import { SegmentEvaluator, CustomerData } from '../../domain/services/SegmentEvaluator';

export interface EvaluateSegmentInput {
  segmentId: string;
  customerId?: string; // If provided, evaluate only this customer
}

export interface EvaluateSegmentOutput {
  segmentId: string;
  memberCount: number;
  memberIds?: string[]; // Only if evaluating all
  isMember?: boolean; // Only if evaluating single customer
}

export class EvaluateSegmentUseCase {
  private evaluator: SegmentEvaluator;

  constructor(
    private readonly segmentRepository: ISegmentRepository,
    private readonly customerRepository: any, // CustomerRepository
  ) {
    this.evaluator = new SegmentEvaluator();
  }

  async execute(input: EvaluateSegmentInput): Promise<EvaluateSegmentOutput> {
    const segment = await this.segmentRepository.findById(input.segmentId);
    if (!segment) {
      throw new Error(`Segment not found: ${input.segmentId}`);
    }

    if (input.customerId) {
      // Evaluate single customer
      const customer = await this.customerRepository.findById(input.customerId);
      if (!customer) {
        throw new Error(`Customer not found: ${input.customerId}`);
      }

      const customerData = await this.buildCustomerData(customer);
      const isMember = this.evaluator.evaluateCustomer(customerData, segment);

      return {
        segmentId: segment.segmentId,
        memberCount: segment.memberCount,
        isMember,
      };
    } else {
      // Evaluate all customers
      const memberIds = await this.evaluateAllCustomers(segment);
      await this.segmentRepository.updateMemberCount(segment.segmentId, memberIds.length);

      return {
        segmentId: segment.segmentId,
        memberCount: memberIds.length,
        memberIds,
      };
    }
  }

  private async evaluateAllCustomers(segment: Segment): Promise<string[]> {
    // For static segments, return static members
    if (segment.type === 'static') {
      return segment.staticMemberIds;
    }

    // For dynamic/hybrid, evaluate rules against all customers
    const allCustomers = await this.customerRepository.findAll({ limit: 10000 });
    const memberIds: string[] = [];

    for (const customer of allCustomers.customers || allCustomers) {
      const customerData = await this.buildCustomerData(customer);
      if (this.evaluator.evaluateCustomer(customerData, segment)) {
        memberIds.push(customer.customerId);
      }
    }

    return memberIds;
  }

  private async buildCustomerData(customer: any): Promise<CustomerData> {
    // Get order statistics for the customer
    const orderStats = (await this.customerRepository.getOrderStats?.(customer.customerId)) || {};

    return {
      customerId: customer.customerId,
      totalOrders: orderStats.totalOrders || 0,
      totalSpent: orderStats.totalSpent || 0,
      averageOrderValue: orderStats.averageOrderValue || 0,
      lastOrderDate: orderStats.lastOrderDate,
      registeredAt: customer.createdAt,
      tags: customer.tags || [],
      location: {
        country: customer.defaultAddress?.country,
        state: customer.defaultAddress?.state,
        city: customer.defaultAddress?.city,
      },
    };
  }
}
