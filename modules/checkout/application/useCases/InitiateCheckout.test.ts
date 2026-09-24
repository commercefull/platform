import { createBasketSnapshot, createCheckoutRepository, createCheckoutSession, createBasketSnapshotPort, emitMock } from '../../tests/testUtils';
import { InitiateCheckoutUseCase, InitiateCheckoutCommand } from './InitiateCheckout';
import { CheckoutValidationError, CheckoutBasketNotFoundError } from '../../domain/errors/CheckoutErrors';

describe('InitiateCheckoutUseCase', () => {
  let useCase: InitiateCheckoutUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;
  let basketSnapshotPort: ReturnType<typeof createBasketSnapshotPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    basketSnapshotPort = createBasketSnapshotPort();
    basketSnapshotPort.getSnapshot.mockResolvedValue(createBasketSnapshot());
    useCase = new InitiateCheckoutUseCase(checkoutRepository, basketSnapshotPort);
  });

  it('should create, persist, and emit checkout.started for a valid basket', async () => {
    checkoutRepository.findByBasketId.mockResolvedValue(null);

    const result = await useCase.execute(new InitiateCheckoutCommand('b-1', 'cust-1'));

    expect(result.checkoutId).toBe('checkout-uuid-123');
    expect(result.basketId).toBe('b-1');
    expect(result.customerId).toBe('cust-1');
    expect(result.status).toBe('active');
    expect(result.subtotalCents).toBe(10000);
    expect(checkoutRepository.save).toHaveBeenCalledWith(expect.objectContaining({ basketId: 'b-1' }));
    expect(emitMock).toHaveBeenCalledWith('checkout.started', expect.objectContaining({ checkoutId: 'checkout-uuid-123', basketId: 'b-1', customerId: 'cust-1' }));
  });

  it('should throw CheckoutBasketNotFoundError when the basket does not exist', async () => {
    basketSnapshotPort.getSnapshot.mockResolvedValue(null);

    await expect(useCase.execute(new InitiateCheckoutCommand('missing'))).rejects.toThrow(CheckoutBasketNotFoundError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
  });

  it('should throw CheckoutValidationError when the basket is empty', async () => {
    basketSnapshotPort.getSnapshot.mockResolvedValue(createBasketSnapshot({ isEmpty: true }));

    await expect(useCase.execute(new InitiateCheckoutCommand('b-1'))).rejects.toThrow(CheckoutValidationError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
  });

  it('should extend the existing session instead of creating a new one when the basket already has an active checkout', async () => {
    const existing = createCheckoutSession({ id: 'existing-1' });
    checkoutRepository.findByBasketId.mockResolvedValue(existing);

    const result = await useCase.execute(new InitiateCheckoutCommand('b-1'));

    expect(result.checkoutId).toBe('existing-1');
    expect(checkoutRepository.save).toHaveBeenCalledWith(existing);
    expect(emitMock).not.toHaveBeenCalledWith('checkout.started', expect.anything());
  });

  it('should create a new session when the existing session is no longer active', async () => {
    checkoutRepository.findByBasketId.mockResolvedValue(createCheckoutSession({ id: 'old-1', status: 'abandoned' }));

    const result = await useCase.execute(new InitiateCheckoutCommand('b-1'));

    expect(result.checkoutId).toBe('checkout-uuid-123');
    expect(emitMock).toHaveBeenCalledWith('checkout.started', expect.anything());
  });
});
