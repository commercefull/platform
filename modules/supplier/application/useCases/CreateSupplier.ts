/**
 * CreateSupplier Use Case
 */

export interface CreateSupplierInput {
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  website?: string;
  description?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  paymentTermsDays?: number;
  leadTimeDays?: number;
  minimumOrderValue?: number;
  dropshipEnabled?: boolean;
}

export interface CreateSupplierOutput {
  supplierId: string;
  name: string;
  status: string;
  createdAt: string;
}

export class CreateSupplierUseCase {
  constructor(private readonly supplierRepository: any) {}

  async execute(input: CreateSupplierInput): Promise<CreateSupplierOutput> {
    const existing = await this.supplierRepository.findByEmail(input.email);
    if (existing) {
      throw new Error(`Supplier with email '${input.email}' already exists`);
    }

    const supplierId = `sup_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const supplier = await this.supplierRepository.create({
      supplierId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      contactPerson: input.contactPerson,
      website: input.website,
      description: input.description,
      address: input.address,
      paymentTermsDays: input.paymentTermsDays || 30,
      leadTimeDays: input.leadTimeDays || 7,
      minimumOrderValue: input.minimumOrderValue,
      dropshipEnabled: input.dropshipEnabled ?? false,
      status: 'pending',
      isActive: false,
    });

    return {
      supplierId: supplier.supplierId,
      name: supplier.name,
      status: supplier.status,
      createdAt: supplier.createdAt.toISOString(),
    };
  }
}
