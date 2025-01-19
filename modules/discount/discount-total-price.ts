export class DiscountTotalPrice {
    private readonly type: 'COUPON' | 'PROMOTION';
    constructor(type: 'COUPON' | 'PROMOTION') {
        this.type = type;
    }
}
