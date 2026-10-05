import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageOrganizationsUseCase, Organization } from '../../application/wired';
import type { OrganizationStatus } from '../../domain/entities/Organization';

interface CreateOrganizationBody {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  logo?: string;
  description?: string;
  password?: string;
  status?: OrganizationStatus;
}

interface UpdateOrganizationBody {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  status?: OrganizationStatus;
}

interface AddOrganizationAddressBody {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary?: boolean;
}

interface UpdateOrganizationAddressBody {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

type PaymentType = 'bankAccount' | 'paypal' | 'stripe' | 'venmo' | 'other';

interface AddOrganizationPaymentInfoBody {
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  paymentType?: PaymentType;
  paymentProcessor?: string;
  processorAccountId?: string;
  isVerified?: boolean;
}

interface UpdateOrganizationPaymentInfoBody {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  paymentType?: PaymentType;
  paymentProcessor?: string;
  isVerified?: boolean;
}

const repo = manageOrganizationsUseCase;

export const getOrganizations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const status = req.query.status as Organization['status'] | undefined;

  let orgs: Organization[];

  if (status) {
    orgs = await repo.findByStatus(status, limit);
  } else {
    orgs = await repo.findAll(limit, offset);
  }

  jsonResponse(res, 200, {
    success: true,
    data: orgs,
    pagination: { limit, offset, total: orgs.length },
  });
};

export const getOrganizationById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const org = await repo.findById(id);

  if (!org) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${id} not found` });
    return;
  }

  jsonResponse(res, 200, { success: true, data: org });
};

export const createOrganization = async (
  req: HttpRequest<Record<string, string>, unknown, CreateOrganizationBody>,
  res: HttpResponse,
): Promise<void> => {
  const { name, email, phone, website, logoUrl, logo, description, password, status = 'pending' } = req.body;

  if (!name || !email) {
    jsonResponse(res, 400, { success: false, message: 'Name and email are required' });
    return;
  }

  const existing = await repo.findByEmail(email);
  if (existing) {
    jsonResponse(res, 409, { success: false, message: `Organization with email ${email} already exists` });
    return;
  }

  const org = await repo.create({
    name,
    email,
    phone,
    website,
    logo: logoUrl || logo,
    description,
    status,
    password: password || 'defaultpassword123',
  });

  jsonResponse(res, 201, { success: true, data: org, message: 'Organization created successfully' });
};

export const updateOrganization = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateOrganizationBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const { name, email, phone, website, logoUrl, description, status } = req.body;

  const existing = await repo.findById(id);
  if (!existing) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${id} not found` });
    return;
  }

  if (email && email !== existing.email) {
    const orgWithEmail = await repo.findByEmail(email);
    if (orgWithEmail && orgWithEmail.organizationId !== id) {
      jsonResponse(res, 409, { success: false, message: `Email ${email} is already in use by another organization` });
      return;
    }
  }

  const updated = await repo.update(id, { name, email, phone, website, logo: logoUrl, description, status });

  jsonResponse(res, 200, { success: true, data: updated, message: 'Organization updated successfully' });
};

export const deleteOrganization = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  const existing = await repo.findById(id);
  if (!existing) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${id} not found` });
    return;
  }

  const deleted = await repo.delete(id);

  if (deleted) {
    jsonResponse(res, 200, { success: true, message: 'Organization deleted successfully' });
  } else {
    jsonResponse(res, 500, { success: false, message: 'Failed to delete organization' });
  }
};

export const getOrganizationStores = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const org = await repo.findById(id);

  if (!org) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${id} not found` });
    return;
  }

  const stores = await repo.getStoresByOrganization(id);

  jsonResponse(res, 200, { success: true, data: stores });
};

export const getOrganizationAddresses = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.params;

  const org = await repo.findById(organizationId);
  if (!org) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const addresses = await repo.findAddressesByOrganizationId(organizationId);

  jsonResponse(res, 200, { success: true, data: addresses });
};

export const addOrganizationAddress = async (
  req: HttpRequest<Record<string, string>, unknown, AddOrganizationAddressBody>,
  res: HttpResponse,
): Promise<void> => {
  const { organizationId } = req.params;
  const { addressLine1, addressLine2, city, state, postalCode, country, isPrimary = false } = req.body;

  const org = await repo.findById(organizationId);
  if (!org) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  if (!addressLine1 || !city || !state || !postalCode || !country) {
    jsonResponse(res, 400, { success: false, message: 'Address line 1, city, state, postal code, and country are required' });
    return;
  }

  const address = await repo.createAddress({
    organizationId: organizationId,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    isDefault: isPrimary,
  });

  jsonResponse(res, 201, { success: true, data: address, message: 'Organization address added successfully' });
};

export const updateOrganizationAddress = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateOrganizationAddressBody>,
  res: HttpResponse,
): Promise<void> => {
  const { organizationId, addressId } = req.params;
  const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  const org = await repo.findById(organizationId);
  if (!org) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const existingAddress = await repo.findAddressById(addressId);
  if (!existingAddress || existingAddress.organizationId !== organizationId) {
    jsonResponse(res, 404, { success: false, message: `Address with ID ${addressId} not found for organization ${organizationId}` });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: {
      ...existingAddress,
      addressLine1: addressLine1 || existingAddress.addressLine1,
      addressLine2: addressLine2 !== undefined ? addressLine2 : existingAddress.addressLine2,
      city: city || existingAddress.city,
      state: state || existingAddress.state,
      postalCode: postalCode || existingAddress.postalCode,
      country: country || existingAddress.country,
      isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
    },
    message: 'Organization address updated successfully',
  });
};

export const getOrganizationPaymentInfo = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.params;

  const org = await repo.findById(organizationId);
  if (!org) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const paymentInfo = await repo.findPaymentInfoByOrganizationId(organizationId);

  jsonResponse(res, 200, { success: true, data: paymentInfo || [] });
};

export const addOrganizationPaymentInfo = async (
  req: HttpRequest<Record<string, string>, unknown, AddOrganizationPaymentInfoBody>,
  res: HttpResponse,
): Promise<void> => {
  const { organizationId } = req.params;
  const { accountHolderName, bankName, accountNumber, routingNumber, paymentType, isVerified = false } = req.body;

  const org = await repo.findById(organizationId);
  if (!org) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const existingPaymentInfo = await repo.findPaymentInfoByOrganizationId(organizationId);
  if (existingPaymentInfo && existingPaymentInfo.length > 0) {
    jsonResponse(res, 409, { success: false, message: `Payment information already exists for organization with ID ${organizationId}` });
    return;
  }

  if (!accountHolderName) {
    jsonResponse(res, 400, { success: false, message: 'Account holder name is required' });
    return;
  }

  const paymentInfo = await repo.createPaymentInfo({
    organizationId: organizationId,
    accountHolderName,
    bankName,
    accountNumber,
    routingNumber,
    // paymentType must satisfy organizationPaymentInfo_paymentType_check
    // ('bankAccount' | 'paypal' | 'stripe' | 'venmo' | 'other'); 'bank' is invalid.
    paymentType: paymentType || 'bankAccount',
    currency: 'USD',
    isVerified,
  });

  jsonResponse(res, 201, { success: true, data: paymentInfo, message: 'Organization payment information added successfully' });
};

export const updateOrganizationPaymentInfo = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateOrganizationPaymentInfoBody>,
  res: HttpResponse,
): Promise<void> => {
  const { organizationId, paymentInfoId } = req.params;
  const { accountHolderName, bankName, accountNumber, routingNumber, paymentType, isVerified } = req.body;

  const org = await repo.findById(organizationId);
  if (!org) {
    jsonResponse(res, 404, { success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const existingPaymentInfo = await repo.findPaymentInfoById(paymentInfoId);
  if (!existingPaymentInfo || existingPaymentInfo.organizationId !== organizationId) {
    jsonResponse(res, 404, {
      success: false,
      message: `Payment info with ID ${paymentInfoId} not found for organization ${organizationId}`,
    });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: {
      ...existingPaymentInfo,
      accountHolderName: accountHolderName || existingPaymentInfo.accountHolderName,
      bankName: bankName !== undefined ? bankName : existingPaymentInfo.bankName,
      accountNumber: accountNumber !== undefined ? accountNumber : existingPaymentInfo.accountNumber,
      routingNumber: routingNumber !== undefined ? routingNumber : existingPaymentInfo.routingNumber,
      paymentType: paymentType || existingPaymentInfo.paymentType,
      isVerified: isVerified !== undefined ? isVerified : existingPaymentInfo.isVerified,
    },
    message: 'Organization payment information updated successfully',
  });
};
