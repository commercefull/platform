import { ProductVariant } from "./product-variant";

export class Bundle {
    private products: ProductVariant[] = [];
    private readonly sku: string;

    constructor(sku: string) {
        this.sku = sku;
    }
}