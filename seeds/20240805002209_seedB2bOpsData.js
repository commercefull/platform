/**
 * B2B Ops Test Data Seed
 * Seeds companies, a B2B user, quotes, and approval workflows for
 * b2b.test.ts integration tests.
 *
 * Approver ID for seeded workflows is the merchant organization ID —
 * the org JWT carries the organization ID in `id`, which the B2B
 * controllers use as the approver identity.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const ORGANIZATION_ID = '01911000-0000-7000-8000-000000000001';

const COMPANY_IDS = {
  LIFECYCLE: '01945000-0000-7000-8000-000000000001',
  OPS: '01945000-0000-7000-8000-000000000002',
};

const USER_ID = '01945001-0000-7000-8000-000000000001';

const QUOTE_IDS = {
  LIFECYCLE: '01945002-0000-7000-8000-000000000001',
  REJECT: '01945002-0000-7000-8000-000000000002',
};

const WORKFLOW_IDS = {
  APPROVE: '01945003-0000-7000-8000-000000000001',
  REJECT_AS_APPROVER: '01945003-0000-7000-8000-000000000002',
  NON_APPROVER: '01945003-0000-7000-8000-000000000003',
  ESCALATE: '01945003-0000-7000-8000-000000000004',
  CANCEL: '01945003-0000-7000-8000-000000000005',
};

exports.seed = async function (knex) {
  const hasCompany = await knex.schema.hasTable('b2bCompany');
  if (!hasCompany) {
    return;
  }

  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 86400000);

  const hasWorkflow = await knex.schema.hasTable('b2bApprovalWorkflow');
  const hasQuote = await knex.schema.hasTable('b2bQuote');
  const hasUser = await knex.schema.hasTable('b2bUser');

  if (hasWorkflow) {
    await knex('b2bApprovalWorkflow').whereIn('workflowId', Object.values(WORKFLOW_IDS)).del();
  }
  if (hasQuote) {
    await knex('b2bQuote').whereIn('quoteId', Object.values(QUOTE_IDS)).del();
  }
  if (hasUser) {
    await knex('b2bUser').where('userId', USER_ID).del();
  }
  await knex('b2bCompany').whereIn('companyId', Object.values(COMPANY_IDS)).del();

  await knex('b2bCompany').insert([
    {
      companyId: COMPANY_IDS.LIFECYCLE,
      organizationId: ORGANIZATION_ID,
      name: 'Ops Lifecycle Company',
      legalName: 'Ops Lifecycle Company LLC',
      contactEmail: 'ops-lifecycle@b2b.example.com',
      status: 'pending',
      paymentTerms: 'net30',
      outstandingBalance: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      companyId: COMPANY_IDS.OPS,
      organizationId: ORGANIZATION_ID,
      name: 'Ops Company',
      legalName: 'Ops Company LLC',
      contactEmail: 'ops@b2b.example.com',
      status: 'approved',
      paymentTerms: 'net30',
      outstandingBalance: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  if (hasUser) {
    await knex('b2bUser').insert({
      userId: USER_ID,
      companyId: COMPANY_IDS.OPS,
      organizationId: ORGANIZATION_ID,
      email: 'ops-b2b-user@example.com',
      firstName: 'B2B',
      lastName: 'User',
      role: 'buyer',
      status: 'invited',
      spendingLimits: JSON.stringify({}),
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (hasQuote) {
    const lineItem = {
      lineItemId: '01945004-0000-7000-8000-000000000001',
      productId: '00000000-0000-0000-0000-000000000001',
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      quantity: 10,
      unitPrice: 25.0,
    };

    await knex('b2bQuote').insert([
      {
        quoteId: QUOTE_IDS.LIFECYCLE,
        companyId: COMPANY_IDS.OPS,
        organizationId: ORGANIZATION_ID,
        quoteNumber: 'Q-OPS-0001',
        status: 'draft',
        requestedBy: 'test-requester',
        lineItems: JSON.stringify([lineItem]),
        subtotal: 250.0,
        discountTotal: 0,
        taxTotal: 0,
        total: 250.0,
        currency: 'USD',
        validUntil,
        createdAt: now,
        updatedAt: now,
      },
      {
        quoteId: QUOTE_IDS.REJECT,
        companyId: COMPANY_IDS.OPS,
        organizationId: ORGANIZATION_ID,
        quoteNumber: 'Q-OPS-0002',
        status: 'sent',
        requestedBy: 'test-requester',
        lineItems: JSON.stringify([lineItem]),
        subtotal: 250.0,
        discountTotal: 0,
        taxTotal: 0,
        total: 250.0,
        currency: 'USD',
        validUntil,
        sentAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }

  if (hasWorkflow) {
    const pendingStep = (order, email = 'approver@example.com') => ({
      stepId: `01945005-0000-7000-8000-00000000000${order}`,
      approverId: ORGANIZATION_ID,
      approverEmail: email,
      status: 'pending',
      order,
    });

    const baseWorkflow = {
      companyId: COMPANY_IDS.OPS,
      organizationId: ORGANIZATION_ID,
      type: 'order',
      requestedBy: 'test-requester',
      requestedByEmail: 'requester@example.com',
      status: 'pending',
      amount: 1000,
      currency: 'USD',
      currentStep: 1,
      createdAt: now,
      updatedAt: now,
    };

    await knex('b2bApprovalWorkflow').insert([
      {
        ...baseWorkflow,
        workflowId: WORKFLOW_IDS.APPROVE,
        referenceId: '01945006-0000-7000-8000-000000000001',
        referenceNumber: 'REF-OPS-APPROVE',
        steps: JSON.stringify([pendingStep(1)]),
      },
      {
        ...baseWorkflow,
        workflowId: WORKFLOW_IDS.REJECT_AS_APPROVER,
        referenceId: '01945006-0000-7000-8000-000000000002',
        referenceNumber: 'REF-OPS-REJECT',
        steps: JSON.stringify([pendingStep(1)]),
      },
      {
        ...baseWorkflow,
        workflowId: WORKFLOW_IDS.NON_APPROVER,
        referenceId: '01945006-0000-7000-8000-000000000003',
        referenceNumber: 'REF-OPS-NONAPPROVER',
        steps: JSON.stringify([
          {
            stepId: '01945005-0000-7000-8000-000000000009',
            approverId: '01945007-0000-7000-8000-000000000001',
            approverEmail: 'other@example.com',
            status: 'pending',
            order: 1,
          },
        ]),
      },
      {
        ...baseWorkflow,
        workflowId: WORKFLOW_IDS.ESCALATE,
        referenceId: '01945006-0000-7000-8000-000000000004',
        referenceNumber: 'REF-OPS-ESCALATE',
        steps: JSON.stringify([pendingStep(1), pendingStep(2, 'manager@example.com')]),
      },
      {
        ...baseWorkflow,
        workflowId: WORKFLOW_IDS.CANCEL,
        referenceId: '01945006-0000-7000-8000-000000000005',
        referenceNumber: 'REF-OPS-CANCEL',
        steps: JSON.stringify([pendingStep(1)]),
      },
    ]);
  }
};
