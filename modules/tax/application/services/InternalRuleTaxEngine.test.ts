import { InternalRuleTaxEngine } from './InternalRuleTaxEngine';
import { TaxDecision } from '../../domain/entities/TaxDecision';
import type { CalculateOrderTaxUseCase, CalculateOrderTaxResponse } from '../useCases/CalculateOrderTax';
import type { TaxTransactionContext } from '../../domain/ports/TaxEnginePort';

const context = (overrides: Partial<TaxTransactionContext> = {}): TaxTransactionContext => ({
  lines: [
    { productId: 'p1', name: 'Widget', quantity: 2, unitPriceCents: 1000 },
    { productId: 'p2', name: 'Gadget', quantity: 1, unitPriceCents: 500, taxable: false },
  ],
  shipToAddress: { country: 'DE', state: 'BE', postalCode: '10115' },
  shipFromAddress: { country: 'DE' },
  shippingAmountCents: 499,
  sellerOrganizationId: 'org-1',
  buyerType: 'B2B',
  vatNumber: 'DE123456789',
  marketId: 'mkt-eu',
  currencyCode: 'EUR',
  pricesIncludeTax: false,
  ...overrides,
});

const response = (overrides: Partial<CalculateOrderTaxResponse> = {}): CalculateOrderTaxResponse =>
  ({
    subtotalCents: 2000,
    taxAmountCents: 0,
    totalCents: 2000,
    lineItems: [
      { productId: 'p1', name: 'Widget', subtotalCents: 2000, taxAmountCents: 0, taxRate: 0 },
      { productId: 'p2', name: 'Gadget', subtotalCents: 500, taxAmountCents: 0, taxRate: 0, exemptionVerdict: 'non-taxable' },
    ],
    taxRegime: 'EU_B2B_REVERSE_CHARGE',
    taxPolicyVersion: 'tax-policy:2026-10',
    reverseChargeApplied: true,
    vatNumber: 'DE123456789',
    taxAddedCents: 0,
    taxIncludedInSubtotal: 0,
    decisionRecord: {
      policyCode: 'tax-calculation',
      policyVersion: 'tax-policy:2026-10',
      effect: 'allow',
      reasonCode: 'EU_B2B_REVERSE_CHARGE',
      obligations: [],
      facts: { destinationCountry: 'DE' },
      matchedRuleIndex: 0,
    },
    ...overrides,
  }) as CalculateOrderTaxResponse;

describe('InternalRuleTaxEngine', () => {
  it('should map the use-case quote onto a TaxDecision', async () => {
    const calculateOrderTax = { execute: jest.fn().mockResolvedValue(response()) };
    const engine = new InternalRuleTaxEngine(calculateOrderTax as unknown as CalculateOrderTaxUseCase);

    const decision = await engine.calculateQuote(context());

    expect(decision).toBeInstanceOf(TaxDecision);
    expect(decision.taxRegime).toBe('EU_B2B_REVERSE_CHARGE');
    expect(decision.taxPolicyVersion).toBe('tax-policy:2026-10');
    expect(decision.reverseChargeApplied).toBe(true);
    expect(decision.vatNumber).toBe('DE123456789');
    expect(decision.jurisdictionBreakdown).toEqual(['DE']);
    expect(decision.lineItems).toHaveLength(2);
    expect(decision.lineItems[1].exemptionVerdict).toBe('non-taxable');
    expect(decision.taxAmountCents).toBe(0);
    expect(decision.decisionRecord?.reasonCode).toBe('EU_B2B_REVERSE_CHARGE');
  });

  it('should pass the full transaction context to the use case', async () => {
    const execute = jest.fn().mockResolvedValue(response());
    const engine = new InternalRuleTaxEngine({ execute } as unknown as CalculateOrderTaxUseCase);
    const ctx = context();

    await engine.calculateQuote(ctx);

    const command = execute.mock.calls[0][0];
    expect(command.shippingAddress).toEqual(ctx.shipToAddress);
    expect(command.shippingAmountCents).toBe(499);
    expect(command.organizationId).toBe('org-1');
    expect(command.originCountry).toBe('DE');
    expect(command.buyerType).toBe('B2B');
    expect(command.vatNumber).toBe('DE123456789');
    expect(command.marketId).toBe('mkt-eu');
    expect(command.currencyCode).toBe('EUR');
    expect(command.shipFromAddress).toEqual(ctx.shipFromAddress);
    expect(command.items).toHaveLength(2);
    expect(command.items[0].unitPriceCents).toBe(1000);
  });

  it('should default to NO_TAX when the response carries no regime', async () => {
    const execute = jest.fn().mockResolvedValue(response({ taxRegime: undefined, taxPolicyVersion: undefined }));
    const engine = new InternalRuleTaxEngine({ execute } as unknown as CalculateOrderTaxUseCase);

    const decision = await engine.calculateQuote(context());
    expect(decision.taxRegime).toBe('NO_TAX');
    expect(decision.taxPolicyVersion).toBe('unknown');
  });
});
