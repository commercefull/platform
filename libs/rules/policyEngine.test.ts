import { evaluatePolicies, PolicyRule } from './policyEngine';

const now = new Date('2026-10-22T12:00:00Z');

function rule(overrides: Partial<PolicyRule>): PolicyRule {
  return {
    policyId: 'pol_1',
    policyCode: 'TEST',
    domain: 'compliance',
    version: '1.0.0',
    effect: 'deny',
    reasonCode: 'TEST_DENY',
    conditions: [],
    priority: 0,
    isActive: true,
    ...overrides,
  };
}

describe('libs/rules/policyEngine', () => {
  it('should default-allow when no rules match', () => {
    const d = evaluatePolicies({
      decision: 'compliance_check',
      domain: 'compliance',
      facts: { country: 'FR' },
      rules: [rule({ conditions: [{ attribute: 'country', operator: 'eq', value: 'KP' }] })],
      now,
    });
    expect(d.allowed).toBe(true);
    expect(d.reasonCode).toBe('NO_MATCHING_POLICY');
    expect(d.policyId).toBeUndefined();
  });

  it('should deny when a matching deny rule exists', () => {
    const d = evaluatePolicies({
      decision: 'compliance_check',
      domain: 'compliance',
      facts: { shipToCountry: 'KP' },
      rules: [
        rule({
          policyId: 'pol_embargo',
          policyCode: 'EMBARGO_KP',
          reasonCode: 'EMBARGOED_DESTINATION',
          conditions: [{ attribute: 'shipToCountry', operator: 'eq', value: 'KP' }],
        }),
      ],
      now,
    });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe('EMBARGOED_DESTINATION');
    expect(d.policyCode).toBe('EMBARGO_KP');
    expect(d.version).toBe('1.0.0');
  });

  it('should require obligations when a require_obligation rule matches', () => {
    const d = evaluatePolicies({
      decision: 'compliance_check',
      domain: 'compliance',
      facts: { customerAge: 17 },
      rules: [
        rule({
          effect: 'require_obligation',
          reasonCode: 'AGE_RESTRICTION',
          obligations: ['verify_age'],
          conditions: [{ attribute: 'customerAge', operator: 'lt', value: 18 }],
        }),
      ],
      now,
    });
    expect(d.allowed).toBe(true);
    expect(d.reasonCode).toBe('AGE_RESTRICTION');
    expect(d.obligations).toEqual(['verify_age']);
  });

  it('should prefer deny over require_obligation over allow when several rules match', () => {
    const facts = { shipToCountry: 'IR' };
    const d = evaluatePolicies({
      decision: 'compliance_check',
      domain: 'compliance',
      facts,
      rules: [
        rule({ policyCode: 'ALLOW', effect: 'allow', reasonCode: 'ALLOWED', priority: 10 }),
        rule({ policyCode: 'OBLIG', effect: 'require_obligation', reasonCode: 'CUSTOMS_ID', obligations: ['collect_tax_id'], priority: 5 }),
        rule({ policyCode: 'DENY', effect: 'deny', reasonCode: 'EMBARGOED_DESTINATION', priority: 0 }),
      ],
      now,
    });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe('EMBARGOED_DESTINATION');
    // obligations from other matching rules are still surfaced for context
    expect(d.obligations).toEqual(['collect_tax_id']);
  });

  it('should pick the highest-priority rule when effects tie', () => {
    const d = evaluatePolicies({
      decision: 'compliance_check',
      domain: 'compliance',
      facts: { shipToCountry: 'XX' },
      rules: [
        rule({ policyCode: 'LOW', reasonCode: 'LOW_DENY', priority: 1 }),
        rule({ policyCode: 'HIGH', reasonCode: 'HIGH_DENY', priority: 9 }),
      ],
      now,
    });
    expect(d.reasonCode).toBe('HIGH_DENY');
    expect(d.policyCode).toBe('HIGH');
  });

  it('should ignore inactive and out-of-window rules when evaluating', () => {
    const d = evaluatePolicies({
      decision: 'compliance_check',
      domain: 'compliance',
      facts: { shipToCountry: 'KP' },
      rules: [
        rule({ policyCode: 'INACTIVE', isActive: false, conditions: [{ attribute: 'shipToCountry', operator: 'eq', value: 'KP' }] }),
        rule({
          policyCode: 'EXPIRED',
          effectiveTo: new Date('2020-01-01'),
          conditions: [{ attribute: 'shipToCountry', operator: 'eq', value: 'KP' }],
        }),
        rule({
          policyCode: 'FUTURE',
          effectiveFrom: new Date('2030-01-01'),
          conditions: [{ attribute: 'shipToCountry', operator: 'eq', value: 'KP' }],
        }),
      ],
      now,
    });
    expect(d.allowed).toBe(true);
    expect(d.reasonCode).toBe('NO_MATCHING_POLICY');
  });

  it('should only evaluate rules in the requested domain when rules span domains', () => {
    const d = evaluatePolicies({
      decision: 'privacy_check',
      domain: 'privacy',
      facts: { region: 'EU' },
      rules: [
        rule({ domain: 'compliance', policyCode: 'OTHER_DOMAIN', conditions: [{ attribute: 'region', operator: 'eq', value: 'EU' }] }),
      ],
      now,
    });
    expect(d.allowed).toBe(true);
    expect(d.reasonCode).toBe('NO_MATCHING_POLICY');
  });

  it('should snapshot the fact inputs into the decision record', () => {
    const facts = { shipToCountry: 'KP', channel: 'web' };
    const d = evaluatePolicies({
      decision: 'compliance_check',
      domain: 'compliance',
      facts,
      rules: [rule({ conditions: [{ attribute: 'shipToCountry', operator: 'eq', value: 'KP' }] })],
      now,
    });
    expect(d.inputs).toEqual(facts);
    expect(d.inputs).not.toBe(facts);
    expect(d.evaluatedAt).toEqual(now);
    expect(d.decisionId).toMatch(/^dec_/);
  });
});
