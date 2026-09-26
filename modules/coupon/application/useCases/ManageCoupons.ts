import type { CouponRepository } from '../../domain/repositories/CouponRepository';

export class ManageCouponsUseCase {
  constructor(private readonly couponRepository: CouponRepository) {}

  async findById(couponId: string) {
    return this.couponRepository.findById(couponId);
  }
  async findByCode(code: string) {
    return this.couponRepository.findByCode(code);
  }
  async findAll(...args: Parameters<CouponRepository['findAll']>) {
    return this.couponRepository.findAll(...args);
  }
  async getActiveCoupons(limit?: number) {
    return this.couponRepository.getActiveCoupons(limit);
  }
  async getUsageHistory(couponId: string, limit?: number) {
    return this.couponRepository.getUsageHistory(couponId, limit);
  }
  async delete(couponId: string) {
    return this.couponRepository.delete(couponId);
  }
}
