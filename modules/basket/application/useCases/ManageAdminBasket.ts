import type { BasketRepository } from '../../domain/repositories/BasketRepository';
import { Basket } from '../../domain/entities/Basket';

export class ManageAdminBasketUseCase {
  constructor(private readonly repo: BasketRepository) {}

  async findAbandonedBaskets(olderThanDays: number) {
    return this.repo.findAbandonedBaskets(olderThanDays);
  }
  async findExpiredBaskets() {
    return this.repo.findExpiredBaskets();
  }
  async findById(basketId: string) {
    return this.repo.findById(basketId);
  }
  async findSummaries(limit?: number, offset?: number) {
    return this.repo.findSummaries(limit, offset);
  }
  async getOrCreateForMerge(basketId: string): Promise<{ basket: Basket; isNew: boolean }> {
    const existing = await this.repo.findById(basketId);
    if (existing) {
      return { basket: existing, isNew: false };
    }
    const basket = Basket.create({ basketId, sessionId: basketId, currency: 'USD' });
    return { basket: await this.repo.save(basket), isNew: true };
  }
  async delete(basketId: string) {
    return this.repo.delete(basketId);
  }

  /** Gross cart value (unitPrice × quantity, before discounts). */
  getCartValueCents(basket: Basket): number {
    return basket.items.reduce((total, item) => total + item.unitPrice.cents * item.quantity, 0);
  }

  getDaysSinceActivity(basket: Basket): number {
    return Math.floor((Date.now() - basket.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  async getAbandonedCartStats(olderThanDays: number) {
    const abandonedBaskets = await this.repo.findAbandonedBaskets(olderThanDays);
    const expiredBaskets = await this.repo.findExpiredBaskets();
    const recoveryPotentialCents = abandonedBaskets.reduce((total, b) => total + this.getCartValueCents(b), 0);
    return {
      abandonedBaskets,
      expiredBaskets,
      stats: {
        totalAbandoned: abandonedBaskets.length,
        totalExpired: expiredBaskets.length,
        recoveryPotentialCents,
        avgCartValueCents: abandonedBaskets.length > 0 ? Math.round(recoveryPotentialCents / abandonedBaskets.length) : 0,
      },
    };
  }

  async getBasketViewDetails(basketId: string) {
    const basket = await this.repo.findById(basketId);
    if (!basket) return null;
    return {
      basket,
      cartValueCents: this.getCartValueCents(basket),
      daysSinceActivity: this.getDaysSinceActivity(basket),
    };
  }

  async getBasketAnalytics() {
    const abandonedBaskets = await this.repo.findAbandonedBaskets(30);
    const expiredBaskets = await this.repo.findExpiredBaskets();
    const abandonedValueCents = abandonedBaskets.reduce((total, b) => total + this.getCartValueCents(b), 0);

    const recentAbandoned = abandonedBaskets.filter(b => this.getDaysSinceActivity(b) <= 7);
    const olderAbandoned = abandonedBaskets.filter(b => this.getDaysSinceActivity(b) > 7);
    const recentValueCents = recentAbandoned.reduce((total, b) => total + this.getCartValueCents(b), 0);
    const olderValueCents = olderAbandoned.reduce((total, b) => total + this.getCartValueCents(b), 0);

    return {
      totalAbandoned: abandonedBaskets.length,
      totalExpired: expiredBaskets.length,
      totalValueCents: abandonedValueCents,
      avgCartValueCents: abandonedBaskets.length > 0 ? Math.round(abandonedValueCents / abandonedBaskets.length) : 0,
      recoveryRate: 0,
      recentAbandoned: recentAbandoned.length,
      olderAbandoned: olderAbandoned.length,
      recentValueCents,
      olderValueCents,
      topAbandonedProducts: [] as unknown[],
    };
  }

  /** Delete every expired basket; returns the number removed. */
  async cleanupExpiredBaskets(): Promise<number> {
    const expiredBaskets = await this.repo.findExpiredBaskets();
    for (const basket of expiredBaskets) {
      await this.repo.delete(basket.basketId);
    }
    return expiredBaskets.length;
  }
}
