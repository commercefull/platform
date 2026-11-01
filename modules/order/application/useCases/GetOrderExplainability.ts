/**
 * GetOrderExplainability — Order Decision Audit Use Case
 *
 * Returns the explainability payload for an order: the market context the
 * order was placed in, the immutable rule `versionSnapshot`, the policy
 * `decisionLog`, the exchange-rate snapshot used for currency conversion,
 * and the applied discount/tax provenance rows. Drives the admin Order
 * Explainability audit tab.
 */

import { PolicyDecisionRecord } from '../../../../libs/rules/policyEngine';
import { OrderExchangeRateQuote, OrderVersionSnapshot } from '../../domain/entities/Order';
import { OrderNotFoundError } from '../../domain/errors/OrderErrors';
import { OrderDiscount } from '../../domain/repositories/OrderDiscountRepository';
import { OrderQueryRepository } from '../../domain/repositories/OrderQueryRepository';
import { OrderTax } from '../../domain/repositories/OrderTaxRepository';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class GetOrderExplainabilityCommand {
  constructor(public readonly orderId: string) {}
}

export interface OrderExplainabilityResponse {
  orderId: string;
  orderNumber: string;
  marketId?: string;
  localeCode?: string;
  contractingEntityId?: string;
  currencyCode: string;
  exchangeRateSnapshot?: OrderExchangeRateQuote[];
  versionSnapshot?: OrderVersionSnapshot;
  decisionLog: PolicyDecisionRecord[];
  discounts: OrderDiscount[];
  taxes: OrderTax[];
}

export class GetOrderExplainabilityUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderQueryRepository: OrderQueryRepository,
  ) {}

  async execute(command: GetOrderExplainabilityCommand): Promise<OrderExplainabilityResponse> {
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    const [discounts, taxes] = await Promise.all([
      this.orderQueryRepository.findDiscountsByOrder(command.orderId),
      this.orderQueryRepository.findTaxesByOrder(command.orderId),
    ]);

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      marketId: order.marketId,
      localeCode: order.localeCode,
      contractingEntityId: order.contractingEntityId,
      currencyCode: order.currencyCode,
      exchangeRateSnapshot: order.exchangeRateSnapshot,
      versionSnapshot: order.versionSnapshot,
      decisionLog: order.decisionLog,
      discounts,
      taxes,
    };
  }
}
