import { OrderFulfillmentRepository, FulfillmentStatus } from '../../domain/repositories/OrderFulfillmentRepository';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import orderFulfillmentDataRepository from '../../infrastructure/repositories/OrderFulfillmentDataRepository';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

const orderFulfillmentRepo = orderFulfillmentDataRepository.fulfillments;
const orderRepo = orderDataRepository.commands;

export class ManageOrderFulfillmentsUseCase {
  constructor(
    private readonly fulfillmentRepo: OrderFulfillmentRepository = orderFulfillmentRepo,
    private readonly orders: OrderRepository = orderRepo,
  ) {}

  async findByStatus(status: string, limit?: number, offset?: number) {
    return this.fulfillmentRepo.findByStatus(status as FulfillmentStatus, limit, offset);
  }
  async findById(id: string) {
    return this.fulfillmentRepo.findById(id);
  }
  async updateStatus(id: string, status: string) {
    return this.fulfillmentRepo.updateStatus(id, status as FulfillmentStatus);
  }
  async addTracking(id: string, trackingNumber: string, carrierCode?: string, carrierName?: string, trackingUrl?: string) {
    return this.fulfillmentRepo.addTracking(id, trackingNumber, carrierCode, carrierName, trackingUrl);
  }
  async update(id: string, updates: Record<string, unknown>) {
    return this.fulfillmentRepo.update(id, updates);
  }
  async markAsShipped(id: string) {
    return this.fulfillmentRepo.markAsShipped(id);
  }
  async markAsDelivered(id: string) {
    return this.fulfillmentRepo.markAsDelivered(id);
  }
  async cancel(id: string, notes?: string) {
    return this.fulfillmentRepo.cancel(id, notes);
  }
  async getStatusStatistics() {
    return this.fulfillmentRepo.getStatusStatistics();
  }
  async findOverdue() {
    return this.fulfillmentRepo.findOverdue();
  }
  async findShippedToday() {
    return this.fulfillmentRepo.findShippedToday();
  }
}

export class GetOrderForFulfillmentUseCase {
  constructor(
    private readonly orders: OrderRepository = orderRepo,
  ) {}

  async findById(id: string) {
    return this.orders.findById(id);
  }
}
