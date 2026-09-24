import type { CouponRepository } from '../../domain/repositories/CouponRepository';

export class ManageCouponsUseCase {
  constructor(private readonly couponRepo: CouponRepository) {}

  async findById(id: string) {
    return this.couponRepo.findById(id);
  }
  async findByCode(code: string, organizationId?: string) {
    return this.couponRepo.findByCode(code, organizationId);
  }
  async findAll(...args: Parameters<CouponRepository['findAll']>) {
    return this.couponRepo.findAll(...args);
  }
  async findActiveCoupons(...args: Parameters<CouponRepository['findActiveCoupons']>) {
    return this.couponRepo.findActiveCoupons(...args);
  }
  async create(input: Parameters<CouponRepository['create']>[0]) {
    return this.couponRepo.create(input);
  }
  async update(id: string, input: Parameters<CouponRepository['update']>[1]) {
    return this.couponRepo.update(id, input);
  }
  async delete(id: string) {
    return this.couponRepo.delete(id);
  }
  async getUsage(couponId: string) {
    return this.couponRepo.getUsage(couponId);
  }
  async validate(...args: Parameters<CouponRepository['validate']>) {
    return this.couponRepo.validate(...args);
  }
  calculateDiscount(...args: Parameters<CouponRepository['calculateDiscount']>) {
    return this.couponRepo.calculateDiscount(...args);
  }
}
