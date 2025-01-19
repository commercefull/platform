import { ProductAttributes } from "./product-attribute";

/**
 * Product type example: shoes, shirts, pants, etc.
 * A collection of product attributes
 */
export class ProductType {
    private readonly name: string;
    private readonly productAttributes: ProductAttributes[] = [];

    constructor(name: string) {
        this.name = name;
    }
}
