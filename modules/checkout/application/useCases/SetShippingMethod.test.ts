import { createAddress, createCheckoutRepository, createCheckoutSession, createShippingQuotePort, emitMock } from '../../tests/testUtils';
import { SetShippingMethodUseCase, SetShippingMethodCommand } from './SetShippingMethod';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';

const SHIPPING_OPTIONS = [
  { methodId: 'sm-1', methodName: 'Standard', amount: 9.99, currency: 'USD' },
  { methodId: 'sm-2', methodName: 'Express', amount: 19.99, currency: 'USD' },
];

describe('SetShippingMethodUseCase', () => {
  let useCase: SetShippingMethodUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;
  let shippingQuotePort: ReturnType<typeof createShippingQuotePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    shippingQuotePort = createShippingQuotePort();
    shippingQuotePort.getShippingOptions.mockResolvedValue(SHIPPING_OPTIONS);
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession({ shippingAddress: createAddress() }));
    useCase = new SetShippingMethodUseCase(checkoutRepository, shippingQuotePort);
  });

  it('should set the shipping method, persist the session, and emit checkout.updated when the method is valid', async () => {
    const result = await useCase.execute(new SetShippingMethodCommand('ck-1', 'sm-1'));

    expect(result.checkoutId).toBe('ck-1');
    expect(result.shippingMethodId).toBe('sm-1');
    expect(result.shippingMethodName).toBe('Standard');
    expect(result.shippingAmount).toBe(9.99);
    expect(checkoutRepository.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ checkoutId: 'ck-1', field: 'shippingMethod', methodId: 'sm-1' }));
  });

  it('should throw NotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetShippingMethodCommand('missing', 'sm-1'))).rejects.toThrow(NotFoundError);
    expect(shippingQuotePort.getShippingOptions).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when the shipping address is not set', async () => {
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession({ shippingAddress: undefined }));

    await expect(useCase.execute(new SetShippingMethodCommand('ck-1', 'sm-1'))).rejects.toThrow(BadRequestError);
    expect(shippingQuotePort.getShippingOptions).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when no shipping service is configured', async () => {
    useCase = new SetShippingMethodUseCase(checkoutRepository);

    await expect(useCase.execute(new SetShippingMethodCommand('ck-1', 'sm-1'))).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when no shipping methods are available for the address', async () => {
    shippingQuotePort.getShippingOptions.mockResolvedValue([]);

    await expect(useCase.execute(new SetShippingMethodCommand('ck-1', 'sm-1'))).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the requested method is not offered', async () => {
    await expect(useCase.execute(new SetShippingMethodCommand('ck-1', 'invalid'))).rejects.toThrow(BadRequestError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
  });
});
