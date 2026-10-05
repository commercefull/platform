/**
 * Wired Use Cases — Agentic Checkout Module
 *
 * Composition root for agentic-checkout use cases. Injects repository
 * implementations and cross-module ACL ports.
 */

import { channelSessionRepository } from '../../infrastructure/repositories/ChannelSessionRepositoryImpl';
import { idempotencyRepository } from '../../infrastructure/repositories/IdempotencyRepositoryImpl';
import { getAgenticCheckoutPorts } from '../../infrastructure/compositionRoot';

import { CreateChannelSessionUseCase } from './CreateChannelSession';
import { GetChannelSessionUseCase } from './GetChannelSession';
import { UpdateChannelSessionUseCase } from './UpdateChannelSession';
import { CompleteChannelSessionUseCase } from './CompleteChannelSession';
import { CancelChannelSessionUseCase } from './CancelChannelSession';
import { GenerateProductFeedUseCase } from './GenerateProductFeed';

const ports = getAgenticCheckoutPorts();

export const createChannelSessionUseCase = new CreateChannelSessionUseCase(
  channelSessionRepository,
  ports.channelCatalog,
  ports.channelCheckout,
);

export const getChannelSessionUseCase = new GetChannelSessionUseCase(channelSessionRepository, ports.channelCheckout);

export const updateChannelSessionUseCase = new UpdateChannelSessionUseCase(
  channelSessionRepository,
  ports.channelCatalog,
  ports.channelCheckout,
);

export const completeChannelSessionUseCase = new CompleteChannelSessionUseCase(
  channelSessionRepository,
  ports.channelCheckout,
  ports.delegatedPayment,
);

export const cancelChannelSessionUseCase = new CancelChannelSessionUseCase(channelSessionRepository, ports.channelCheckout);

export const generateProductFeedUseCase = new GenerateProductFeedUseCase(ports.channelCatalog);

export { channelSessionRepository, idempotencyRepository, ports as agenticCheckoutPorts };
