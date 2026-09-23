import { createCheckoutRepository, createCheckoutSession, createOrderPlacementPort, emitMock } from '../../tests/testUtils';
import { AbandonCheckoutUseCase, AbandonCheckoutCommand } from './AbandonCheckout';
import { NotFoundError } from '../../../../libs/errors';

describe('AbandonCheckoutUseCase', () => {
  let useCase: AbandonCheckoutUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;
  let orderPlacementPort: ReturnType<typeof createOrderPlacementPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    orderPlacementPort = createOrderPlacementPort();
    useCase = new AbandonCheckoutUseCase(checkoutRepository, orderPlacementPort);
  });

  it('should abandon the session and emit checkout.abandoned when the session exists', async () => {
    const session = createCheckoutSession();
    checkoutRepository.findById.mockResolvedValue(session);

    const result = await useCase.execute(new AbandonCheckoutCommand('ck-1'));

    expect(result.checkoutId).toBe('ck-1');
    expect(session.status).toBe('abandoned');
    expect(checkoutRepository.save).toHaveBeenCalledWith(session);
    expect(emitMock).toHaveBeenCalledWith('checkout.abandoned', expect.objectContaining({ checkoutId: 'ck-1', basketId: 'b-1' }));
  });

  it('should cancel the linked order when the session is pending payment', async () => {
    const session = createCheckoutSession({ status: 'pending_payment', orderId: 'o-1' });
    checkoutRepository.findById.mockResolvedValue(session);

    await useCase.execute(new AbandonCheckoutCommand('ck-1'));

    expect(orderPlacementPort.cancelOrder).toHaveBeenCalledWith('o-1', 'Checkout abandoned by customer');
    expect(session.status).toBe('abandoned');
  });

  it('should still abandon when order cancellation fails', async () => {
    const session = createCheckoutSession({ status: 'pending_payment', orderId: 'o-1' });
    checkoutRepository.findById.mockResolvedValue(session);
    orderPlacementPort.cancelOrder.mockRejectedValue(new Error('order gone'));

    const result = await useCase.execute(new AbandonCheckoutCommand('ck-1'));

    expect(result.checkoutId).toBe('ck-1');
    expect(session.status).toBe('abandoned');
  });

  it('should not cancel an order when the session is not pending payment', async () => {
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession({ status: 'active', orderId: 'o-1' }));

    await useCase.execute(new AbandonCheckoutCommand('ck-1'));

    expect(orderPlacementPort.cancelOrder).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new AbandonCheckoutCommand('missing'))).rejects.toThrow(NotFoundError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
