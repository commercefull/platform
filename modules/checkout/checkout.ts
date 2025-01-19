
import { SupplyChannel } from "../inventory/supply-channels";

export class Checkout {
    private readonly shippingCost: number;
    private readonly shippingAddress: string;
    private readonly billingAddress: string;
    private readonly channel: SupplyChannel;
    private readonly items: string[];
    private readonly customerGroup: string;
    private readonly total: number;

    constructor(shippingCost: number, shippingAddress: string, billingAddress: string, channel: Channel, items: string[], customerGroup: string, total: number) {
        this.shippingCost = shippingCost;
        this.shippingAddress = shippingAddress;
        this.billingAddress = billingAddress;
        this.channel = channel;
        this.items = items;
        this.customerGroup = customerGroup;
        this.total = total;
    }
}