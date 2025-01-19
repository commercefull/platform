import { Tax } from "../charges/tax";

export class Checkout {
    constructor(private tax: Tax) {}

    getTax(amount: number) {
        return this.tax.getTax(amount);
    }
}