import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { OrganizationRepo, Organization } from '../../infrastructure/repositories/organizationRepo';

interface CreateOrganizationBody {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  logo?: string;
  description?: string;
  password?: string;
  status?: string;
}

interface UpdateOrganizationBody {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  status?: string;
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

interface AddOrganizationPaymentInfoBody {
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  paymentProcessor?: string;
  processorAccountId?: string;
  isVerified?: boolean;
}

interface UpdateOrganizationPaymentInfoBody {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  paymentProcessor?: string;
  isVerified?: boolean;
}

const repo = new OrganizationRepo();

export const getOrganizations = async (req: TypedRequest, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const status = req.query.status as Organization['status'] | undefined;

  let orgs: Organization[];

  if (status) {
    orgs = await repo.findByStatus(status, limit);
  } else {
    orgs = await repo.findAll(limit, offset);
  }

  res.status(200).json({
    success: true,
    data: orgs,
    pagination: { limit, offset, total: orgs.length },
  });
  
};

export const getOrganizationById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const org = await repo.findById(id);

  if (!org) {
    res.status(404).json({ success: false, message: `Organization with ID ${id} not found` });
    return;
  }

  res.status(200).json({ success: true, data: org });
  
};

export const createOrganization = async (req: TypedRequest<Record<string, string>, unknown, CreateOrganizationBody>, res: Response): Promise<void> => {
  const { name, email, phone, website, logoUrl, logo, description, password, status = 'pending' } = req.body;

  if (!name || !email) {
    res.status(400).json({ success: false, message: 'Name and email are required' });
    return;
  }

  const existing = await repo.findByEmail(email);
  if (existing) {
    res.status(409).json({ success: false, message: `Organization with email ${email} already exists` });
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

  res.status(201).json({ success: true, data: org, message: 'Organization created successfully' });
  
};

export const updateOrganization = async (req: TypedRequest<Record<string, string>, unknown, UpdateOrganizationBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, phone, website, logoUrl, description, status } = req.body;

  const existing = await repo.findById(id);
  if (!existing) {
    res.status(404).json({ success: false, message: `Organization with ID ${id} not found` });
    return;
  }

  if (email && email !== existing.email) {
    const orgWithEmail = await repo.findByEmail(email);
    if (orgWithEmail && orgWithEmail.organizationId !== id) {
      res.status(409).json({ success: false, message: `Email ${email} is already in use by another organization` });
      return;
    }
  }

  const updated = await repo.update(id, { name, email, phone, website, logo: logoUrl, description, status });

  res.status(200).json({ success: true, data: updated, message: 'Organization updated successfully' });
  
};

export const deleteOrganization = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const existing = await repo.findById(id);
  if (!existing) {
    res.status(404).json({ success: false, message: `Organization with ID ${id} not found` });
    return;
  }

  const deleted = await repo.delete(id);

  if (deleted) {
    res.status(200).json({ success: true, message: 'Organization deleted successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete organization' });
  }
  
};

export const getOrganizationStores = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const org = await repo.findById(id);

  if (!org) {
    res.status(404).json({ success: false, message: `Organization with ID ${id} not found` });
    return;
  }

  const stores = await repo.getStoresByOrganization(id);

  res.status(200).json({ success: true, data: stores });
  
};

export const getOrganizationAddresses = async (req: TypedRequest, res: Response): Promise<void> => {
  const { organizationId } = req.params;

  const org = await repo.findById(organizationId);
  if (!org) {
    res.status(404).json({ success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const addresses = await repo.findAddressesByOrganizationId(organizationId);

  res.status(200).json({ success: true, data: addresses });
  
};

export const addOrganizationAddress = async (req: TypedRequest<Record<string, string>, unknown, AddOrganizationAddressBody>, res: Response): Promise<void> => {
  const { organizationId } = req.params;
  const { addressLine1, addressLine2, city, state, postalCode, country, isPrimary = false } = req.body;

  const org = await repo.findById(organizationId);
  if (!org) {
    res.status(404).json({ success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  if (!addressLine1 || !city || !state || !postalCode || !country) {
    res.status(400).json({ success: false, message: 'Address line 1, city, state, postal code, and country are required' });
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

  res.status(201).json({ success: true, data: address, message: 'Organization address added successfully' });
  
};

export const updateOrganizationAddress = async (req: TypedRequest<Record<string, string>, unknown, UpdateOrganizationAddressBody>, res: Response): Promise<void> => {
  const { organizationId, addressId } = req.params;
  const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  const org = await repo.findById(organizationId);
  if (!org) {
    res.status(404).json({ success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const existingAddress = await repo.findAddressById(addressId);
  if (!existingAddress || existingAddress.organizationId !== organizationId) {
    res.status(404).json({ success: false, message: `Address with ID ${addressId} not found for organization ${organizationId}` });
    return;
  }

  res.status(200).json({
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

export const getOrganizationPaymentInfo = async (req: TypedRequest, res: Response): Promise<void> => {
  const { organizationId } = req.params;

  const org = await repo.findById(organizationId);
  if (!org) {
    res.status(404).json({ success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const paymentInfo = await repo.findPaymentInfoByOrganizationId(organizationId);

  res.status(200).json({ success: true, data: paymentInfo || [] });
  
};

export const addOrganizationPaymentInfo = async (req: TypedRequest<Record<string, string>, unknown, AddOrganizationPaymentInfoBody>, res: Response): Promise<void> => {
  const { organizationId } = req.params;
  const { accountHolderName, bankName, accountNumber, routingNumber, paymentProcessor, isVerified = false } = req.body;

  const org = await repo.findById(organizationId);
  if (!org) {
    res.status(404).json({ success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const existingPaymentInfo = await repo.findPaymentInfoByOrganizationId(organizationId);
  if (existingPaymentInfo && existingPaymentInfo.length > 0) {
    res.status(409).json({ success: false, message: `Payment information already exists for organization with ID ${organizationId}` });
    return;
  }

  if (!accountHolderName) {
    res.status(400).json({ success: false, message: 'Account holder name is required' });
    return;
  }

  const paymentInfo = await repo.createPaymentInfo({
    organizationId: organizationId,
    accountHolderName,
    bankName,
    accountNumber,
    routingNumber,
    paymentType: paymentProcessor || 'bank',
    currency: 'USD',
    isVerified,
  });

  res.status(201).json({ success: true, data: paymentInfo, message: 'Organization payment information added successfully' });
  
};

export const updateOrganizationPaymentInfo = async (req: TypedRequest<Record<string, string>, unknown, UpdateOrganizationPaymentInfoBody>, res: Response): Promise<void> => {
  const { organizationId, paymentInfoId } = req.params;
  const { accountHolderName, bankName, accountNumber, routingNumber, paymentProcessor, isVerified } = req.body;

  const org = await repo.findById(organizationId);
  if (!org) {
    res.status(404).json({ success: false, message: `Organization with ID ${organizationId} not found` });
    return;
  }

  const existingPaymentInfo = await repo.findPaymentInfoById(paymentInfoId);
  if (!existingPaymentInfo || existingPaymentInfo.organizationId !== organizationId) {
    res.status(404).json({ success: false, message: `Payment info with ID ${paymentInfoId} not found for organization ${organizationId}` });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      ...existingPaymentInfo,
      accountHolderName: accountHolderName || existingPaymentInfo.accountHolderName,
      bankName: bankName !== undefined ? bankName : existingPaymentInfo.bankName,
      accountNumber: accountNumber !== undefined ? accountNumber : existingPaymentInfo.accountNumber,
      routingNumber: routingNumber !== undefined ? routingNumber : existingPaymentInfo.routingNumber,
      paymentType: paymentProcessor || existingPaymentInfo.paymentType,
      isVerified: isVerified !== undefined ? isVerified : existingPaymentInfo.isVerified,
    },
    message: 'Organization payment information updated successfully',
  });
  
};
