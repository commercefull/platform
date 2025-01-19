type FulfillmentType = 'HOME_DELIVERY' | 'PICKUP' | 'OTHER';

export class Fulfillment {
    constructor(private readonly type: FulfillmentType) { }
}