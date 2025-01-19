import { ProductVariant } from "../product/product-variant";
import { SupplyChannel } from "./supply-channels";

export class InventoryItem {
    private readonly productVariant: ProductVariant;
    private readonly supplyChannels: SupplyChannel;

    constructor(productVariant: ProductVariant, supplyChannels: SupplyChannel) {
        this.productVariant = productVariant;
        this.supplyChannels = supplyChannels;
    }
}