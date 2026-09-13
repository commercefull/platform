/**
 * B2B Admin UI Controller
 * Admin views for B2B companies, users, quotes, and approval workflows
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { manageCompanyUseCase, manageQuoteUseCase } from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

export const listB2BCompanies = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = (req as unknown as { user?: { organizationId?: string } }).user?.organizationId ?? '';
  const companies = await manageCompanyUseCase.listByOrganization(organizationId);

  adminRespond(req, res, 'b2b/companies/index', {
    pageName: 'B2B Companies',
    companies: companies.map(c => c.toJSON()),
    success: req.query.success || null,
  });
};

export const viewB2BCompany = async (req: TypedRequest, res: Response): Promise<void> => {
  const { companyId } = req.params;
  const company = await manageCompanyUseCase.get(companyId);

  if (!company) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Company not found' });
    return;
  }

  const subsidiaries = await manageCompanyUseCase.listSubsidiaries(companyId);

  adminRespond(req, res, 'b2b/companies/view', {
    pageName: `Company: ${company.name}`,
    company: company.toJSON(),
    subsidiaries: subsidiaries.map(s => s.toJSON()),
    success: req.query.success || null,
  });
};

export const createB2BCompanyForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'b2b/companies/create', { pageName: 'Create B2B Company' });
};

export const createB2BCompany = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = (req as unknown as { user?: { organizationId?: string } }).user?.organizationId ?? '';
  const body = req.body as RequestBody;
  const company = await manageCompanyUseCase.create({
    ...(body as Record<string, unknown>),
    organizationId,
  } as Parameters<typeof manageCompanyUseCase.create>[0]);

  res.redirect(`/admin/b2b/companies/${company.companyId}?success=Company created successfully`);
};

export const editB2BCompanyForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { companyId } = req.params;
  const company = await manageCompanyUseCase.get(companyId);

  if (!company) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Company not found' });
    return;
  }

  adminRespond(req, res, 'b2b/companies/edit', {
    pageName: `Edit: ${company.name}`,
    company: company.toJSON(),
  });
};

export const updateB2BCompany = async (req: TypedRequest, res: Response): Promise<void> => {
  const { companyId } = req.params;
  const body = req.body as RequestBody;
  await manageCompanyUseCase.updateProfile(companyId, body as Parameters<typeof manageCompanyUseCase.updateProfile>[1]);
  res.redirect(`/admin/b2b/companies/${companyId}?success=Company updated successfully`);
};

export const approveB2BCompany = async (req: TypedRequest, res: Response): Promise<void> => {
  const { companyId } = req.params;
  await manageCompanyUseCase.approve(companyId);
  res.redirect(`/admin/b2b/companies/${companyId}?success=Company approved`);
};

export const suspendB2BCompany = async (req: TypedRequest, res: Response): Promise<void> => {
  const { companyId } = req.params;
  await manageCompanyUseCase.suspend(companyId);
  res.redirect(`/admin/b2b/companies/${companyId}?success=Company suspended`);
};

export const reactivateB2BCompany = async (req: TypedRequest, res: Response): Promise<void> => {
  const { companyId } = req.params;
  await manageCompanyUseCase.reactivate(companyId);
  res.redirect(`/admin/b2b/companies/${companyId}?success=Company reactivated`);
};

export const listB2BQuotes = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = (req as unknown as { user?: { organizationId?: string } }).user?.organizationId ?? '';
  const { companyId, status } = req.query as { companyId?: string; status?: string };

  let quotes;
  if (status && organizationId) {
    quotes = await manageQuoteUseCase.listByStatus(status, organizationId);
  } else if (companyId) {
    quotes = await manageQuoteUseCase.listByCompany(companyId);
  } else {
    quotes = await manageQuoteUseCase.listByOrganization(organizationId);
  }

  adminRespond(req, res, 'b2b/quotes/index', {
    pageName: 'B2B Quotes',
    quotes: quotes.map(q => q.toJSON()),
    filters: { companyId: companyId || '', status: status || '' },
    success: req.query.success || null,
  });
};

export const viewB2BQuote = async (req: TypedRequest, res: Response): Promise<void> => {
  const { quoteId } = req.params;
  const quote = await manageQuoteUseCase.get(quoteId);

  if (!quote) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Quote not found' });
    return;
  }

  adminRespond(req, res, 'b2b/quotes/view', {
    pageName: `Quote: ${quote.quoteNumber}`,
    quote: quote.toJSON(),
    success: req.query.success || null,
  });
};
