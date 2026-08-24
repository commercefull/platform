import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderReturnRepository, OrderReturnStatus, OrderReturnCreateParams } from '../../domain/repositories/OrderReturnRepository';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';
import orderFulfillmentDataRepository from '../../infrastructure/repositories/OrderFulfillmentDataRepository';

const orderRepo = orderDataRepository.commands;
const orderReturnRepo = orderFulfillmentDataRepository.returns;

export class GetOrderUseCase {
  constructor(
    private readonly orders: OrderRepository = orderRepo,
  ) {}

  async findById(id: string) {
    return this.orders.findById(id);
  }
  async findByCustomerId(customerId: string, pagination?: Parameters<typeof this.orders.findByCustomerId>[1]) {
    return this.orders.findByCustomerId(customerId, pagination);
  }
  async findAll(filters?: Parameters<typeof this.orders.findAll>[0], pagination?: Parameters<typeof this.orders.findAll>[1]) {
    return this.orders.findAll(filters, pagination);
  }
  async save(order: Parameters<typeof this.orders.save>[0]) {
    return this.orders.save(order);
  }
  async delete(id: string) {
    return this.orders.delete(id);
  }
  async count(filters?: Parameters<typeof this.orders.count>[0]) {
    return this.orders.count(filters);
  }
  async countByCustomer(customerId: string) {
    return this.orders.countByCustomer(customerId);
  }
  async getOrderItems(orderId: string) {
    return this.orders.getOrderItems(orderId);
  }
}

export class ManageOrderReturnsUseCase {
  constructor(
    private readonly returns: OrderReturnRepository = orderReturnRepo,
  ) {}

  async findByCustomerId(customerId: string, limit?: number, offset?: number) {
    return this.returns.findByCustomerId(customerId, limit, offset);
  }
  async findById(id: string) {
    return this.returns.findById(id);
  }
  async create(params: OrderReturnCreateParams) {
    return this.returns.create(params);
  }
  async updateStatus(id: string, status: OrderReturnStatus) {
    return this.returns.updateStatus(id, status);
  }
}
