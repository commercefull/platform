import { createCheckoutRepository, createCheckoutSession, createOrderPlacementPort, emitMock } from '../../tests/testUtils';
import { CompleteCheckoutUseCase, CompleteCheckoutCommand } from './CompleteCheckout';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';
import type { OrderSnapshot } from '../../application/ports/OrderPlacementPort';

const paidOrder: OrderSnapshot = { orderId: 'o-1', orderNumber: 'ORD-001', status: 'processing', paymentStatus: 'paid' };

function processingSession() {
  const session = createCheckoutSession({ id: 'ck-1', orderId: 'o-1', customerId: 'c-1' });
  session.setPaymentIntent('pi-1', 'o-1');
  session.markPaymentAuthorized();
  return session;
}

describe('CompleteCheckoutUseCase', () => {
  let useCase: CompleteCheckoutUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;
  let orderPlacementPort: ReturnType<typeof createOrderPlacementPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    orderPlacementPort = createOrderPlacementPort();
    orderPlacementPort.findOrder.mockResolvedValue(paidOrder);
    useCase = new CompleteCheckoutUseCase(checkoutRepository, orderPlacementPort);
  });

  it('should complete the session, persist it, and emit checkout.completed when the linked order is processing and paid', async () => {
    const session = processingSession();
    checkoutRepository.findById.mockResolvedValue(session);

    const result = await useCase.execute(new CompleteCheckoutCommand('ck-1'));

    expect(result.status).toBe('completed');
    expect(result.orderId).toBe('o-1');
    expect(session.status).toBe('completed');
    expect(checkoutRepository.save).toHaveBeenCalledWith(session);
    expect(emitMock).toHaveBeenCalledWith('checkout.completed', expect.objectContaining({ checkoutId: 'ck-1', orderId: 'o-1' }));
  });

  it('should return the completed response without side effects when the session is already completed', async () => {
    const session = processingSession();
    session.complete();
    checkoutRepository.findById.mockResolvedValue(session);
    useCase = new CompleteCheckoutUseCase(checkoutRepository);

    const result = await useCase.execute(new CompleteCheckoutCommand('ck-1'));

    expect(result.status).toBe('completed');
    expect(result.orderId).toBe('o-1');
    expect(checkoutRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new CompleteCheckoutCommand('missing'))).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the session is still active', async () => {
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession());

    await expect(useCase.execute(new CompleteCheckoutCommand('ck-1'))).rejects.toThrow(BadRequestError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the linked order does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(processingSession());
    orderPlacementPort.findOrder.mockResolvedValue(null);

    await expect(useCase.execute(new CompleteCheckoutCommand('ck-1'))).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the linked order is not processing and paid', async () => {
    checkoutRepository.findById.mockResolvedValue(processingSession());
    orderPlacementPort.findOrder.mockResolvedValue({ ...paidOrder, status: 'pending', paymentStatus: 'pending' });

    await expect(useCase.execute(new CompleteCheckoutCommand('ck-1'))).rejects.toThrow(BadRequestError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
  });
});
