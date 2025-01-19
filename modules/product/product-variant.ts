export class ProductVariant {
    private readonly name: string;
    private readonly sku: string;
    private readonly price: number;
    
    constructor(name: string, sku: string, price: number) {
        this.name = name;
        this.sku = sku;
        this.price = price;
    }
}