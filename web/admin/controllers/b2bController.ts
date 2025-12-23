/**
 * B2B Controller
 * Handles B2B company management, user administration, and quote management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import {
  getCompany,
  getCompanies,
  saveCompany,
  approveCompany,
  suspendCompany,
  deleteCompany,
  getCompanyUsers,
  saveCompanyUser,
  deleteCompanyUser,
  getCompanyAddresses,
} from '../../../modules/b2b/repos/companyRepo';

import {
  getQuote,
  getQuotes,
  saveQuote,
  sendQuote,
  acceptQuote,
  rejectQuote,
  convertQuoteToOrder,
  createQuoteRevision,
  deleteQuote,
  getQuoteItems,
  saveQuoteItem,
  deleteQuoteItem,
} from '../../../modules/b2b/repos/quoteRepo';
import { adminRespond } from 'web/respond';

// ============================================================================
// B2B Company Management
// ============================================================================

export const listB2bCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const tier = req.query.tier as string;
    const search = req.query.search as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getCompanies(
      {
        status: status as any,
        tier: tier as any,
        search,
      },
      { limit, offset },
    );

    adminRespond(req, res, 'programs/b2b/companies/index', {
      pageName: 'B2B Companies',
      companies: result.data,
      total: result.total,
      filters: { status, tier, search },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load B2B companies',
    });
  }
};

export const createB2bCompanyForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'programs/b2b/companies/create', {
      pageName: 'Create B2B Company',
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createB2bCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      legalName,
      registrationNumber,
      vatNumber,
      taxId,
      dunsNumber,
      companyType,
      industry,
      employeeCount,
      annualRevenue,
      creditLimit,
      paymentTermsDays,
      paymentTermsType,
      currency,
      website,
      phone,
      email,
      description,
      tier,
      discountRate,
      requiresApproval,
      orderMinimum,
      orderMaximum,
      taxExempt,
    } = req.body;

    const company = await saveCompany({
      name,
      legalName: legalName || undefined,
      registrationNumber: registrationNumber || undefined,
      vatNumber: vatNumber || undefined,
      taxId: taxId || undefined,
      dunsNumber: dunsNumber || undefined,
      companyType: companyType || 'corporation',
      industry: industry || undefined,
      employeeCount: employeeCount ? parseInt(employeeCount) : undefined,
      annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
      creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
      paymentTermsDays: paymentTermsDays ? parseInt(paymentTermsDays) : 30,
      paymentTermsType: paymentTermsType || 'prepaid',
      currency: currency || 'USD',
      website: website || undefined,
      phone: phone || undefined,
      email: email || undefined,
      description: description || undefined,
      tier: tier || 'standard',
      discountRate: discountRate ? parseFloat(discountRate) : 0,
      requiresApproval: requiresApproval === 'true',
      orderMinimum: orderMinimum ? parseFloat(orderMinimum) : undefined,
      orderMaximum: orderMaximum ? parseFloat(orderMaximum) : undefined,
      taxExempt: taxExempt === 'true',
    });

    res.redirect(`/hub/b2b/companies/${company.b2bCompanyId}?success=B2B company created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'programs/b2b/companies/create', {
      pageName: 'Create B2B Company',
      error: error.message || 'Failed to create B2B company',
      formData: req.body,
    });
  }
};

export const viewB2bCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    const company = await getCompany(companyId);

    if (!company) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'B2B company not found',
      });
      return;
    }

    // Get company users and addresses
    const users = await getCompanyUsers(companyId);
    const addresses = await getCompanyAddresses(companyId);

    adminRespond(req, res, 'programs/b2b/companies/view', {
      pageName: `Company: ${company.name}`,
      company,
      users,
      addresses,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load B2B company',
    });
  }
};

export const editB2bCompanyForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    const company = await getCompany(companyId);

    if (!company) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'B2B company not found',
      });
      return;
    }

    adminRespond(req, res, 'programs/b2b/companies/edit', {
      pageName: `Edit: ${company.name}`,
      company,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateB2bCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const updates: any = {};

    const {
      name,
      legalName,
      registrationNumber,
      vatNumber,
      taxId,
      dunsNumber,
      companyType,
      industry,
      employeeCount,
      annualRevenue,
      creditLimit,
      paymentTermsDays,
      paymentTermsType,
      currency,
      website,
      phone,
      email,
      description,
      tier,
      discountRate,
      requiresApproval,
      orderMinimum,
      orderMaximum,
      taxExempt,
    } = req.body;

    if (name !== undefined) updates.name = name;
    if (legalName !== undefined) updates.legalName = legalName || undefined;
    if (registrationNumber !== undefined) updates.registrationNumber = registrationNumber || undefined;
    if (vatNumber !== undefined) updates.vatNumber = vatNumber || undefined;
    if (taxId !== undefined) updates.taxId = taxId || undefined;
    if (dunsNumber !== undefined) updates.dunsNumber = dunsNumber || undefined;
    if (companyType !== undefined) updates.companyType = companyType;
    if (industry !== undefined) updates.industry = industry || undefined;
    if (employeeCount !== undefined) updates.employeeCount = employeeCount ? parseInt(employeeCount) : undefined;
    if (annualRevenue !== undefined) updates.annualRevenue = annualRevenue ? parseFloat(annualRevenue) : undefined;
    if (creditLimit !== undefined) updates.creditLimit = creditLimit ? parseFloat(creditLimit) : 0;
    if (paymentTermsDays !== undefined) updates.paymentTermsDays = paymentTermsDays ? parseInt(paymentTermsDays) : 30;
    if (paymentTermsType !== undefined) updates.paymentTermsType = paymentTermsType;
    if (currency !== undefined) updates.currency = currency;
    if (website !== undefined) updates.website = website || undefined;
    if (phone !== undefined) updates.phone = phone || undefined;
    if (email !== undefined) updates.email = email || undefined;
    if (description !== undefined) updates.description = description || undefined;
    if (tier !== undefined) updates.tier = tier;
    if (discountRate !== undefined) updates.discountRate = discountRate ? parseFloat(discountRate) : 0;
    if (requiresApproval !== undefined) updates.requiresApproval = requiresApproval === 'true';
    if (orderMinimum !== undefined) updates.orderMinimum = orderMinimum ? parseFloat(orderMinimum) : undefined;
    if (orderMaximum !== undefined) updates.orderMaximum = orderMaximum ? parseFloat(orderMaximum) : undefined;
    if (taxExempt !== undefined) updates.taxExempt = taxExempt === 'true';

    const company = await saveCompany({
      b2bCompanyId: companyId,
      ...updates,
    });

    res.redirect(`/hub/b2b/companies/${companyId}?success=B2B company updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const company = await getCompany(req.params.companyId);

      adminRespond(req, res, 'programs/b2b/companies/edit', {
        pageName: `Edit: ${company?.name || 'Company'}`,
        company,
        error: error.message || 'Failed to update B2B company',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update B2B company',
      });
    }
  }
};

export const approveB2bCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    await approveCompany(companyId, 'admin');

    res.json({ success: true, message: 'B2B company approved successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to approve B2B company' });
  }
};

export const suspendB2bCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    await suspendCompany(companyId);

    res.json({ success: true, message: 'B2B company suspended successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to suspend B2B company' });
  }
};

export const deleteB2bCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    await deleteCompany(companyId);

    res.json({ success: true, message: 'B2B company deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete B2B company' });
  }
};

// ============================================================================
// B2B Company Users Management
// ============================================================================

export const listB2bCompanyUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const includeInactive = req.query.includeInactive === 'true';

    const company = await getCompany(companyId);
    if (!company) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'B2B company not found',
      });
      return;
    }

    const users = await getCompanyUsers(companyId, includeInactive);

    adminRespond(req, res, 'programs/b2b/users/index', {
      pageName: `Users: ${company.name}`,
      company,
      users,
      filters: { includeInactive },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load B2B company users',
    });
  }
};

export const createB2bCompanyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { email, firstName, lastName, phone, jobTitle, department, role } = req.body;

    const user = await saveCompanyUser({
      b2bCompanyId: companyId,
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      jobTitle: jobTitle || undefined,
      department: department || undefined,
      role: role || 'buyer',
    });

    res.redirect(`/hub/b2b/companies/${companyId}/users?success=Company user created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to create company user' });
  }
};

export const deleteB2bCompanyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, userId } = req.params;

    await deleteCompanyUser(userId);

    res.json({ success: true, message: 'Company user deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete company user' });
  }
};

// ============================================================================
// B2B Quotes Management
// ============================================================================

export const listB2bQuotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId as string;
    const customerId = req.query.customerId as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getQuotes(
      {
        companyId,
        customerId,
        status: status as any,
      },
      { limit, offset },
    );

    // Get companies for filtering
    const companies = await getCompanies();

    adminRespond(req, res, 'programs/b2b/quotes/index', {
      pageName: 'B2B Quotes',
      quotes: result.data,
      total: result.total,
      companies,
      filters: { companyId, customerId, status },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load B2B quotes',
    });
  }
};

export const createB2bQuoteForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId as string;

    // Get companies for dropdown
    const companies = await getCompanies();

    adminRespond(req, res, 'programs/b2b/quotes/create', {
      pageName: 'Create B2B Quote',
      companyId,
      companies,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createB2bQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      b2bCompanyId,
      customerId,
      b2bCompanyUserId,
      validityDays,
      currency,
      customerNotes,
      internalNotes,
      terms,
      conditions,
      paymentTerms,
      paymentTermsDays,
    } = req.body;

    const quote = await saveQuote({
      b2bCompanyId,
      customerId,
      b2bCompanyUserId,
      validityDays: validityDays ? parseInt(validityDays) : 30,
      currency: currency || 'USD',
      customerNotes,
      internalNotes,
      terms,
      conditions,
      paymentTerms,
      paymentTermsDays: paymentTermsDays ? parseInt(paymentTermsDays) : undefined,
    });

    res.redirect(`/hub/b2b/quotes/${quote.b2bQuoteId}?success=B2B quote created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const companies = await getCompanies();

      adminRespond(req, res, 'programs/b2b/quotes/create', {
        pageName: 'Create B2B Quote',
        error: error.message || 'Failed to create B2B quote',
        formData: req.body,
        companies,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to create B2B quote',
      });
    }
  }
};

export const viewB2bQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;

    const quote = await getQuote(quoteId);

    if (!quote) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'B2B quote not found',
      });
      return;
    }

    // Get quote items
    const items = await getQuoteItems(quoteId);

    // Get company for display
    let company = null;
    if (quote.b2bCompanyId) {
      company = await getCompany(quote.b2bCompanyId);
    }

    adminRespond(req, res, 'programs/b2b/quotes/view', {
      pageName: `Quote: ${quote.quoteNumber}`,
      quote,
      items,
      company,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load B2B quote',
    });
  }
};

export const editB2bQuoteForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;

    const quote = await getQuote(quoteId);

    if (!quote) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'B2B quote not found',
      });
      return;
    }

    // Get quote items
    const items = await getQuoteItems(quoteId);

    // Get companies for dropdown
    const companies = await getCompanies();

    adminRespond(req, res, 'programs/b2b/quotes/edit', {
      pageName: `Edit Quote: ${quote.quoteNumber}`,
      quote,
      items,
      companies,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateB2bQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;
    const updates: any = {};

    const {
      b2bCompanyId,
      customerId,
      b2bCompanyUserId,
      validityDays,
      currency,
      customerNotes,
      internalNotes,
      terms,
      conditions,
      paymentTerms,
      paymentTermsDays,
      discountTotal,
      discountType,
      discountValue,
      discountReason,
      shippingTotal,
      handlingTotal,
    } = req.body;

    if (b2bCompanyId !== undefined) updates.b2bCompanyId = b2bCompanyId;
    if (customerId !== undefined) updates.customerId = customerId;
    if (b2bCompanyUserId !== undefined) updates.b2bCompanyUserId = b2bCompanyUserId;
    if (validityDays !== undefined) updates.validityDays = parseInt(validityDays);
    if (currency !== undefined) updates.currency = currency;
    if (customerNotes !== undefined) updates.customerNotes = customerNotes;
    if (internalNotes !== undefined) updates.internalNotes = internalNotes;
    if (terms !== undefined) updates.terms = terms;
    if (conditions !== undefined) updates.conditions = conditions;
    if (paymentTerms !== undefined) updates.paymentTerms = paymentTerms;
    if (paymentTermsDays !== undefined) updates.paymentTermsDays = parseInt(paymentTermsDays);
    if (discountTotal !== undefined) updates.discountTotal = parseFloat(discountTotal);
    if (discountType !== undefined) updates.discountType = discountType;
    if (discountValue !== undefined) updates.discountValue = parseFloat(discountValue);
    if (discountReason !== undefined) updates.discountReason = discountReason;
    if (shippingTotal !== undefined) updates.shippingTotal = parseFloat(shippingTotal);
    if (handlingTotal !== undefined) updates.handlingTotal = parseFloat(handlingTotal);

    const quote = await saveQuote({
      b2bQuoteId: quoteId,
      ...updates,
    });

    res.redirect(`/hub/b2b/quotes/${quoteId}?success=B2B quote updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const quote = await getQuote(req.params.quoteId);
      const items = await getQuoteItems(req.params.quoteId);
      const companies = await getCompanies();

      adminRespond(req, res, 'programs/b2b/quotes/edit', {
        pageName: `Edit Quote: ${quote?.quoteNumber || 'Quote'}`,
        quote,
        items,
        companies,
        error: error.message || 'Failed to update B2B quote',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update B2B quote',
      });
    }
  }
};

export const sendB2bQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;

    await sendQuote(quoteId);

    res.json({ success: true, message: 'Quote sent successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to send quote' });
  }
};

export const acceptB2bQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;

    await acceptQuote(quoteId);

    res.json({ success: true, message: 'Quote accepted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to accept quote' });
  }
};

export const rejectB2bQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;
    const { reason } = req.body;

    await rejectQuote(quoteId, reason);

    res.json({ success: true, message: 'Quote rejected successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to reject quote' });
  }
};

export const convertB2bQuoteToOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;
    const { orderId } = req.body;

    await convertQuoteToOrder(quoteId, orderId);

    res.json({ success: true, message: 'Quote converted to order successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to convert quote to order' });
  }
};

export const createB2bQuoteRevision = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;

    const newQuote = await createQuoteRevision(quoteId);

    res.redirect(`/hub/b2b/quotes/${newQuote.b2bQuoteId}?success=Quote revision created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to create quote revision' });
  }
};

export const deleteB2bQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;

    await deleteQuote(quoteId);

    res.json({ success: true, message: 'Quote deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete quote' });
  }
};

// ============================================================================
// B2B Quote Items Management
// ============================================================================

export const addB2bQuoteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.params;
    const {
      productId,
      productVariantId,
      sku,
      name,
      description,
      quantity,
      unit,
      unitPrice,
      costPrice,
      discountPercent,
      discountAmount,
      taxRate,
      isCustomItem,
      isPriceOverride,
      priceOverrideReason,
      position,
      notes,
      requestedDeliveryDate,
      leadTimeDays,
    } = req.body;

    const item = await saveQuoteItem({
      b2bQuoteId: quoteId,
      productId,
      productVariantId,
      sku,
      name,
      description,
      quantity: parseInt(quantity),
      unit: unit || 'each',
      unitPrice: parseFloat(unitPrice),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      discountPercent: parseFloat(discountPercent) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      taxRate: parseFloat(taxRate) || 0,
      isCustomItem: isCustomItem === 'true',
      isPriceOverride: isPriceOverride === 'true',
      priceOverrideReason,
      position: position ? parseInt(position) : 0,
      notes,
      requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : undefined,
      leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : undefined,
    });

    res.json({ success: true, message: 'Quote item added successfully', item });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to add quote item' });
  }
};

export const updateB2bQuoteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId, itemId } = req.params;
    const updates: any = {};

    const { quantity, unitPrice, costPrice, discountPercent, discountAmount, taxRate, notes, requestedDeliveryDate, leadTimeDays } =
      req.body;

    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (unitPrice !== undefined) updates.unitPrice = parseFloat(unitPrice);
    if (costPrice !== undefined) updates.costPrice = costPrice ? parseFloat(costPrice) : undefined;
    if (discountPercent !== undefined) updates.discountPercent = parseFloat(discountPercent);
    if (discountAmount !== undefined) updates.discountAmount = parseFloat(discountAmount);
    if (taxRate !== undefined) updates.taxRate = parseFloat(taxRate);
    if (notes !== undefined) updates.notes = notes;
    if (requestedDeliveryDate !== undefined)
      updates.requestedDeliveryDate = requestedDeliveryDate ? new Date(requestedDeliveryDate) : undefined;
    if (leadTimeDays !== undefined) updates.leadTimeDays = leadTimeDays ? parseInt(leadTimeDays) : undefined;

    const item = await saveQuoteItem({
      b2bQuoteItemId: itemId,
      b2bQuoteId: quoteId,
      ...updates,
    });

    res.json({ success: true, message: 'Quote item updated successfully', item });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to update quote item' });
  }
};

export const deleteB2bQuoteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId, itemId } = req.params;

    await deleteQuoteItem(itemId);

    res.json({ success: true, message: 'Quote item deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete quote item' });
  }
};

// ============================================================================
// B2B Quote Analytics
// ============================================================================

export const b2bQuoteAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get quote analytics (would need implementation for proper analytics queries)
    const stats = {
      totalQuotes: 0,
      sentQuotes: 0,
      acceptedQuotes: 0,
      rejectedQuotes: 0,
      convertedQuotes: 0,
      conversionRate: 0,
      averageQuoteValue: 0,
      totalQuoteValue: 0,
      quotesByStatus: {},
      quotesByMonth: [],
      topCustomers: [],
      quoteApprovalTime: 0,
    };

    adminRespond(req, res, 'programs/b2b/analytics/index', {
      pageName: 'B2B Quote Analytics',
      stats,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load B2B quote analytics',
    });
  }
};
