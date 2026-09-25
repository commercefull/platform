import {
  createBasketSnapshot,
  createCheckoutRepository,
  createCheckoutSession,
  createBasketSnapshotPort,
  createTaxQuotePort,
  emitMock,
} from '../../tests/testUtils';
import { SetShippingAddressUseCase, SetShippingAddressCommand } from './SetShippingAddress';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';

const command = () => new SetShippingAddressCommand('ck-1', 'John', 'Doe', '123 Main St', 'NYC', '10001', 'US');

describe('SetShippingAddressUseCase', () => {
  let useCase: SetShippingAddressUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession());
    checkoutRepository.validateShippingAddress.mockResolvedValue({ valid: true, errors: [] });
    useCase = new SetShippingAddressUseCase(checkoutRepository);
  });

  it('should set the shipping address, persist the session, and emit checkout.updated when the address validates', async () => {
    const result = await useCase.execute(command());

    expect(result.checkoutId).toBe('ck-1');
    expect(result.shippingAddress?.city).toBe('NYC');
    expect(result.shippingAddress?.country).toBe('US');
    expect(checkoutRepository.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith(
      'checkout.updated',
      expect.objectContaining({ checkoutId: 'ck-1', field: 'shippingAddress', country: 'US', postalCode: '10001' }),
    );
  });

  it('should throw NotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(command())).rejects.toThrow(NotFoundError);
    expect(checkoutRepository.validateShippingAddress).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when address validation fails', async () => {
    checkoutRepository.validateShippingAddress.mockResolvedValue({ valid: false, errors: ['Invalid postal code'] });

    await expect(useCase.execute(command())).rejects.toThrow(BadRequestError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should recalculate tax through the tax quote port when configured', async () => {
    const basketSnapshotPort = createBasketSnapshotPort();
    basketSnapshotPort.getSnapshot.mockResolvedValue(createBasketSnapshot());
    const taxQuotePort = createTaxQuotePort();
    taxQuotePort.getTaxSettings.mockResolvedValue({ applyDiscountBeforeTax: false, applyTaxToShipping: true, pricesIncludeTax: false });
    taxQuotePort.calculateTax.mockResolvedValue({ success: true, taxAmountCents: 850, breakdown: [] });
    useCase = new SetShippingAddressUseCase(checkoutRepository, basketSnapshotPort, taxQuotePort);

    const result = await useCase.execute(command());

    expect(result.taxAmountCents).toBe(850);
    expect(taxQuotePort.calculateTax).toHaveBeenCalledWith(
      expect.objectContaining({ shippingAddress: expect.objectContaining({ country: 'US' }) }),
    );
  });

  it('should fall back to zero tax when the tax quote fails', async () => {
    const taxQuotePort = createTaxQuotePort();
    taxQuotePort.getTaxSettings.mockRejectedValue(new Error('tax service down'));
    taxQuotePort.calculateTax.mockRejectedValue(new Error('tax service down'));
    useCase = new SetShippingAddressUseCase(checkoutRepository, undefined, taxQuotePort);

    const result = await useCase.execute(command());

    expect(result.taxAmountCents).toBe(0);
    expect(checkoutRepository.save).toHaveBeenCalled();
  });
});
