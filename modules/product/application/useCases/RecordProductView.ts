/**
 * Record Product View Use Case
 * Emits `product.viewed` when a shopper looks at a product detail page.
 * Consumers: analytics (funnel + performance counters), tracking (GTM/Meta),
 * recommendation (co-view signals). Event emission lives in the use-case
 * layer — never in controllers.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export class RecordProductViewCommand {
  constructor(
    public readonly productId: string,
    public readonly context?: {
      customerId?: string;
      sessionId?: string;
      organizationId?: string;
      storeId?: string;
    },
  ) {}
}

export class RecordProductViewUseCase {
  async execute(command: RecordProductViewCommand): Promise<void> {
    if (!command.productId) return;
    await eventBus.emit('product.viewed', {
      productId: command.productId,
      customerId: command.context?.customerId,
      sessionId: command.context?.sessionId,
      organizationId: command.context?.organizationId,
      storeId: command.context?.storeId,
    });
  }
}
