import { ProductType } from "./product-type";
import { ProductVariant } from "./product-variant";

/**
 * Product example: Nike Air Max, Adidas Superstar, etc.
 * A collection of product types
 */
export class Product {
    private name: string;
    private productTypes: ProductType[] = [];
    private readonly productVariants: ProductVariant[] = [];
    constructor(name: string) {
        this.name = name;
    }
}