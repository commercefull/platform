import { OrderReturnRepository, OrderReturnStatus, OrderReturnCreateParams } from '../../domain/repositories/OrderReturnRepository';

export class ManageOrderReturnsUseCase {
  constructor(private readonly returns: OrderReturnRepository) {}

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
